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
  const password = typeof values.password === "string" ? values.password : "";
  const role = typeof values.role === "string" ? values.role.trim().toLowerCase() : "";
  if (!name || !email || !password || !["admin", "user"].includes(role)) {
    return jsonResponse(400, { error: "Name, email, password, and a valid role are required." });
  }

  const { data: createdData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  });
  if (createError || !createdData.user) {
    return jsonResponse(400, { error: createError?.message || "Unable to create user." });
  }

  const { error: saveProfileError } = await adminClient.from("profiles").upsert({
    id: createdData.user.id,
    full_name: name,
    role,
  });
  if (saveProfileError) {
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(createdData.user.id);
    if (cleanupError) {
      console.error("Failed to clean up Auth user after profile creation failed:", cleanupError);
    }
    console.error("Unable to create user profile:", saveProfileError);
    return jsonResponse(500, { error: "The user profile could not be created." });
  }

  return jsonResponse(200, { id: createdData.user.id });
});
