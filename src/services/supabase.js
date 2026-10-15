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

function isDatabaseRequest(input) {
  const requestUrl =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.href
        : String(input);

  try {
    return /\/rest\/v1(?:\/|$)/.test(new URL(requestUrl, supabaseUrl).pathname);
  } catch {
    return false;
  }
}

async function monitoredFetch(...args) {
  const databaseRequest = isDatabaseRequest(args[0]);
  let response;
  try {
    response = await fetch(...args);
  } catch (error) {
    if (databaseRequest && error?.name !== "AbortError") {
      publishConnectionState(false);
    }
    throw error;
  }

  if (databaseRequest && response.status >= 500) publishConnectionState(false);
  return response;
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: monitoredFetch },
});
