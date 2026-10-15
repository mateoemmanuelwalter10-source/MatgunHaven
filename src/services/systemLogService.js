import { supabase } from "./supabase";

function safeErrorCode(error) {
  return typeof error?.code === "string" ? error.code.slice(0, 80) : null;
}

export async function logSystemEvent({
  eventType,
  message,
  entityType = null,
  entityId = null,
  details = {},
}) {
  const { data: sessionResult, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) {
    console.error("Could not determine the actor for the system log.", sessionError);
    return { error: sessionError };
  }

  if (!sessionResult.session?.user?.id) return { error: null };

  const { error } = await supabase.from("system_logs").insert({
    actor_id: sessionResult.session.user.id,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId == null ? null : String(entityId),
    message,
    details,
  });

  if (error) console.error("Could not write the system log.", error);
  return { error };
}

export async function logSystemError(operation, error, options = {}) {
  return logSystemEvent({
    eventType: "error",
    message: `Operation failed: ${operation}`,
    entityType: options.entityType || null,
    entityId: options.entityId || null,
    details: {
      operation,
      error_code: safeErrorCode(error),
      ...(options.details || {}),
    },
  });
}

export async function logFailedLogin() {
  return logPublicAuthFailure("login_failed");
}

export async function logPublicAuthFailure(eventType) {
  if (!["login_failed", "registration_failed", "password_reset_failed"].includes(eventType)) {
    throw new Error("Unsupported public authentication log event.");
  }

  const { error } = await supabase.rpc("log_public_auth_failure", {
    p_event_type: eventType,
  });
  if (error) console.error("Could not write the public authentication system log.", error);
  return { error };
}
