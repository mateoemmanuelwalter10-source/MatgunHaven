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

export async function createUserAccount({ name, email, password, role }) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: {
      name,
      email,
      password,
      role,
    },
  });

  if (error) {
    let surfacedError = error;
    if (error instanceof FunctionsHttpError) {
      const responseBody = await error.context.json();
      if (typeof responseBody?.error === "string") {
        surfacedError = new Error(responseBody.error);
      }
    }
    await logSystemError("create_user_account", surfacedError, { entityType: "user" });
    return { data, error: surfacedError };
  }

  if (data?.user?.id) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: name,
      role,
    });
    if (profileError) {
      await logSystemError("create_user_profile", profileError, {
        entityType: "user",
        entityId: data.user.id,
      });
      return { data, error: profileError };
    }
    await logSystemEvent({
      eventType: "create",
      message: "User account created",
      entityType: "user",
      entityId: data.user.id,
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
