// Edge Function: submit-assessment
// Grades MCQ server-side, uploads speaking recordings, MERGES results (a partial re-test
// only replaces its own sections), blocks retakes, and marks the attempt complete.
// NOTE: in the Supabase dashboard the import below is "./_shared/questions.ts".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { QUESTION_BANK, LISTENING, band } from "../_shared/questions.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIERS = ["intermediate", "advanced"] as const;
const ALL_SECTIONS = ["intermediate", "advanced", "listening", "speaking"];

type MissedItem = { id: string; question: string; chosenText: string | null; correctOption: string; };

function gradeTier(tier: string, answers: Record<string, Record<string, Record<string, number>>>) {
  const bank = QUESTION_BANK[tier];
  let correct = 0;
  const missed: MissedItem[] = [];
  for (const cat of ["vocab", "premises"] as const) {
    for (const q of bank[cat]) {
      const chosen = answers?.[tier]?.[cat]?.[q.id];
      if (chosen === q.correct) { correct++; }
      else {
        missed.push({
          id: q.id, question: q.text,
          chosenText: chosen !== undefined && chosen !== null ? q.options[chosen] ?? null : null,
          correctOption: q.options[q.correct],
        });
      }
    }
  }
  const total = bank.vocab.length + bank.premises.length;
  return { correct, total, band: band(correct, total), missed };
}

function collectListeningReview(listeningAnswers: Record<string, number>, written: Record<string, string>) {
  return LISTENING.map((q) => {
    if (q.type === "written") {
      return { id: q.id, type: "written", question: q.question, response: written?.[q.id] || "" };
    }
    const chosen = listeningAnswers?.[q.id];
    return {
      id: q.id, type: "mcq", question: q.question,
      chosenText: chosen !== undefined && chosen !== null ? q.options?.[chosen] ?? null : null,
      correctOption: q.options?.[q.correct!] ?? "",
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { token, answers, written, audio } = body;
    if (!token) return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers: corsHeaders });

    const sections = Array.isArray(body.sections) && body.sections.length
      ? body.sections.filter((s: string) => ALL_SECTIONS.includes(s))
      : ALL_SECTIONS;

    const { data: employee, error: empErr } = await supabase
      .from("employees").select("id, name, status").eq("token", token).single();
    if (empErr || !employee) return new Response(JSON.stringify({ error: "Invalid link" }), { status: 404, headers: corsHeaders });
    if (employee.status === "completed") return new Response(JSON.stringify({ error: "Already submitted" }), { status: 403, headers: corsHeaders });

    // Load the existing record to merge into (latest for this employee)
    const { data: existingRows } = await supabase
      .from("assessment_results").select("*")
      .eq("employee_id", employee.id)
      .order("submitted_at", { ascending: false }).limit(1);
    const existing = existingRows && existingRows.length ? existingRows[0] : null;

    const tierScores: Record<string, any> = { ...(existing?.tier_scores || {}) };
    const missedItems: Record<string, unknown> = { ...(existing?.missed_items || {}) };
    const writtenResponses: Record<string, string> = { ...(existing?.written_responses || {}), ...(written || {}) };
    const audioUrls: Record<string, string> = { ...(existing?.audio_urls || {}) };

    // MCQ tiers — only the submitted ones
    for (const tier of TIERS) {
      if (!sections.includes(tier)) continue;
      const result = gradeTier(tier, answers || {});
      tierScores[tier] = { correct: result.correct, total: result.total, band: result.band };
      missedItems[tier] = result.missed;
    }

    // Listening (manual) — reset to pending for re-grading
    if (sections.includes("listening")) {
      missedItems.listening_review = collectListeningReview(answers?.listening || {}, written || {});
      tierScores.listening = { manual: true, scores: {}, total: 0, max: 35, scored: 0, band: "Pending review" };
    }

    // Advanced section carries the written prompts — reset written_advanced for re-grading
    if (sections.includes("advanced")) {
      tierScores.written_advanced = { manual: true, scores: {}, total: 0, max: 15, scored: 0, band: "Pending review" };
    }

    // Speaking (manual) — upload clips + reset to pending
    if (sections.includes("speaking")) {
      const speakingClips: string[] = audio?.speaking || [];
      for (let i = 0; i < speakingClips.length; i++) {
        if (!speakingClips[i]) continue;
        const bytes = Uint8Array.from(atob(speakingClips[i]), (c) => c.charCodeAt(0));
        const path = `${token}/speaking_${i}.webm`;
        await supabase.storage.from("dispatch-test-audio").upload(path, bytes, { contentType: "audio/webm", upsert: true });
        const { data: signed } = await supabase.storage.from("dispatch-test-audio").createSignedUrl(path, 60 * 60 * 24 * 365);
        audioUrls[`speaking_${i}`] = signed?.signedUrl || "";
      }
      tierScores.speaking = { manual: true, scores: {}, total: 0, max: 25, scored: 0, band: "Pending review" };
    }

    // Recompute overall MCQ score from merged tiers
    let totalCorrect = 0, totalQs = 0;
    for (const tier of TIERS) {
      const ts = tierScores[tier];
      if (ts && typeof ts.correct === "number" && typeof ts.total === "number") { totalCorrect += ts.correct; totalQs += ts.total; }
    }
    const overallBand = totalQs > 0 ? band(totalCorrect, totalQs) : (existing?.overall_band || "Pending review");

    const row = {
      employee_id: employee.id,
      tier_scores: tierScores,
      missed_items: missedItems,
      written_responses: writtenResponses,
      overall_score: totalCorrect,
      overall_total: totalQs,
      overall_band: overallBand,
      audio_urls: audioUrls,
    };
    if (existing) {
      await supabase.from("assessment_results").update(row).eq("id", existing.id);
    } else {
      await supabase.from("assessment_results").insert(row);
    }

    // Mark this attempt complete (matched by the current token)
    await supabase.from("attempts")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("employee_id", employee.id).eq("token", token).eq("status", "pending");

    await supabase.from("employees")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", employee.id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
