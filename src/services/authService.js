import { supabase } from "./supabase";
import {
  logPublicAuthFailure,
  logSystemError,
  logSystemEvent,
} from "./systemLogService";

export async function login(credentials) {
  return supabase.auth.signInWithPassword(credentials);
}

export async function logout() {
  return supabase.auth.signOut();
}

export async function resetPassword(email) {
  const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (result.error) {
    await logPublicAuthFailure("password_reset_failed");
  } else {
    await logSystemEvent({
      eventType: "password_reset_requested",
      message: "Password reset requested",
      entityType: "user",
    });
  }
  return result;
}

export async function updatePassword(newPassword) {
  const result = await supabase.auth.updateUser({ password: newPassword });
  if (result.error) {
    await logSystemError("update_password", result.error, { entityType: "user" });
  } else {
    await logSystemEvent({
      eventType: "update",
      message: "User password updated",
      entityType: "user",
      entityId: result.data.user?.id,
    });
  }
  return result;
}
