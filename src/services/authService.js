import { supabase } from "./supabase";

export async function login(credentials) {
  return supabase.auth.signInWithPassword(credentials);
}

export async function register(values) {
  return supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.name,
        role: values.role || "user",
      },
    },
  });
}

export async function logout() {
  return supabase.auth.signOut();
}
