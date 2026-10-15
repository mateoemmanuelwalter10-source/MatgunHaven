import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConnectionEvent = "supabase-connection-state";
let supabaseConnectionFailed = false;

function publishConnectionState(connected) {
  if (!connected) supabaseConnectionFailed = true;
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(supabaseConnectionEvent, {
      detail: { connected },
    }),
  );
}

export function hasSupabaseConnectionFailed() {
  return supabaseConnectionFailed;
}

async function monitoredFetch(...args) {
  let response;
  try {
    response = await fetch(...args);
  } catch (error) {
    if (error?.name !== "AbortError") publishConnectionState(false);
    throw error;
  }

  if (response.status >= 500) publishConnectionState(false);
  return response;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: monitoredFetch },
});
