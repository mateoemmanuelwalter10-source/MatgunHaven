import { supabase } from "./supabase";

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createCustomer(customer) {
  const { data, error } = await supabase.from("customers").insert([customer]);
  return { data, error };
}

export async function updateCustomer(id, customer) {
  const { data, error } = await supabase.from("customers").update(customer).eq("id", id);
  return { data, error };
}

export async function getCustomer(id) {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
  return { data, error };
}

export async function deleteCustomer(id) {
  const { data, error } = await supabase.from("customers").delete().eq("id", id);
  return { data, error };
}
