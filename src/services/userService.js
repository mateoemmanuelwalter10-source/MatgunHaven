import { supabase } from "./supabase";

export async function fetchProfile(id) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data;
}

export async function updateProfile(id, values) {
  const { data, error } = await supabase.from("profiles").update(values).eq("id", id);
  return { data, error };
}

export async function updateUserEmail(email) {
  const { data, error } = await supabase.auth.updateUser({ email });
  return { data, error };
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function fetchUsers() {
  const { data, error } = await supabase.from("profiles").select("*");
  return { data, error };
}
