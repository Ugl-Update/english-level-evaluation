// Edge Function: preview-questions
// Admin-only: returns the full question bank including answer keys and listening scripts.
// NOTE: in the Supabase dashboard the import below is "./_shared/questions.ts".
import { QUESTION_BANK, LISTENING, SPEAKING, WRITTEN_PROMPTS } from "../_shared/questions.ts";

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { password } = await req.json();
    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Wrong password" }), { status: 401, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({
        intermediate: QUESTION_BANK.intermediate,
        advanced: {
          ...QUESTION_BANK.advanced,
          written: WRITTEN_PROMPTS.advanced,
        },
        listening: LISTENING,
        speaking: SPEAKING,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
