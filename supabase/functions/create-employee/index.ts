// Edge Function: create-employee
// Admin-only: checks the password, creates an employee row, returns the token
// so the admin panel can build the individual test link.
// Deploy with: supabase functions deploy create-employee
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { password, name } = await req.json();
    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Wrong password" }), { status: 401, headers: corsHeaders });
    }
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "Name required" }), { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({ name: name.trim() })
      .select("token")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ token: data.token }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
