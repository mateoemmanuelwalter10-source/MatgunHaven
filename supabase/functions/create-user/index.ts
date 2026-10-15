import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return jsonResponse(401, { error: "Sign in as an administrator to create users." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase function environment configuration.");
    return jsonResponse(500, { error: "User creation is not configured on the server." });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return jsonResponse(401, { error: "Your session is invalid or expired. Please sign in again." });
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Unable to verify administrator role:", profileError);
    return jsonResponse(500, { error: "Unable to verify administrator permissions." });
  }
  if (String(profile?.role || "").trim().toLowerCase() !== "admin") {
    return jsonResponse(403, { error: "Only administrators can create users." });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid request body." });
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return jsonResponse(400, { error: "Invalid request body." });
  }

  const values = input as Record<string, unknown>;
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim() : "";
  const role = typeof values.role === "string" ? values.role.trim().toLowerCase() : "";
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "user"].includes(role)) {
    return jsonResponse(400, { error: "A valid name, email, and role are required." });
  }

  const requestOrigin = request.headers.get("origin");
  let redirectTo: string | undefined;
  if (requestOrigin) {
    try {
      const origin = new URL(requestOrigin);
      const isLocalhost = origin.hostname === "localhost" || origin.hostname === "127.0.0.1";
      if ((origin.protocol === "https:" || (isLocalhost && origin.protocol === "http:")) &&
          origin.origin === requestOrigin) {
        redirectTo = new URL("/reset-password", origin).toString();
      }
    } catch {
      return jsonResponse(400, { error: "Invalid application origin for invitation redirect." });
    }
  }

  const { data: invitedData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name, role },
    ...(redirectTo ? { redirectTo } : {}),
  });
  if (inviteError || !invitedData.user) {
    console.error("Unable to send user invitation:", inviteError);
    return jsonResponse(400, { error: inviteError?.message || "Unable to send invitation." });
  }

  return jsonResponse(200, { id: invitedData.user.id });
});
