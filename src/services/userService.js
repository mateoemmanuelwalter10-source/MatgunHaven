import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { logSystemError, logSystemEvent } from "./systemLogService";

export async function fetchProfile(id) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) await logSystemError("fetch_user_profile", error, { entityType: "user", entityId: id });
  return { data, error };
}

export async function fetchUser(id) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) await logSystemError("fetch_user", error, { entityType: "user", entityId: id });
  return { data, error };
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true });
  if (error) await logSystemError("fetch_users", error, { entityType: "user" });
  return { data, error };
}

export async function createUserAccount({ name, email, role }) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: {
      name,
      email,
      role,
    },
  });

  if (error) {
    let surfacedError = error;
    if (error instanceof FunctionsHttpError) {
      const response = error.context.clone();
      try {
        const responseBody = await response.json();
        const message = responseBody?.error || responseBody?.message;
        if (typeof message === "string") {
          surfacedError = new Error(message);
        }
      } catch {
        surfacedError = new Error(`User creation failed (HTTP ${response.status}).`);
      }
    }
    await logSystemError("create_user_account", surfacedError, {
      entityType: "user",
      details: {
        error_name: surfacedError.name,
        error_message: surfacedError.message.slice(0, 300),
        http_status:
          error.context instanceof Response ? error.context.status : null,
      },
    });
    return { data, error: surfacedError };
  }

  if (data?.id) {
    await logSystemEvent({
      eventType: "invite",
      message: "User invitation sent",
      entityType: "user",
      entityId: data.id,
    });
  }

  return { data, error };
}

export async function updateProfile(id, values) {
  const { data, error } = await supabase.from("profiles").update(values).eq("id", id);
  await logProfileUpdateResult(data, error, id);
  return { data, error };
}

export async function updateUserProfile(id, values) {
  const { data, error } = await supabase.from("profiles").update(values).eq("id", id);
  await logProfileUpdateResult(data, error, id);
  return { data, error };
}

async function logProfileUpdateResult(data, error, id) {
  if (error) {
    await logSystemError("update_user_profile", error, { entityType: "user", entityId: id });
    return;
  }
  await logSystemEvent({
    eventType: "update",
    message: "User profile updated",
    entityType: "user",
    entityId: id,
  });
}

export async function updateUserEmail(email) {
  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) {
    await logSystemError("update_user_email", error, { entityType: "user" });
  } else {
    await logSystemEvent({
      eventType: "update",
      message: "User email update requested",
      entityType: "user",
      entityId: data.user?.id,
    });
  }
  return { data, error };
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    await logSystemError("request_password_reset", error, { entityType: "user" });
  } else {
    await logSystemEvent({
      eventType: "password_reset_requested",
      message: "Password reset requested",
      entityType: "user",
    });
  }
  return { data, error };
}

export async function deleteUserProfile(id) {
  const { data, error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) {
    await logSystemError("delete_user_profile", error, { entityType: "user", entityId: id });
  } else {
    await logSystemEvent({
      eventType: "delete",
      message: "User profile deleted",
      entityType: "user",
      entityId: id,
    });
  }
  return { data, error };
}
