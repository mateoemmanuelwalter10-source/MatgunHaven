import { supabase } from "./supabase";

export async function fetchSales() {
  const { data, error } = await supabase
    .from("sales")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createSale(sale) {
  const { data, error } = await supabase.from("sales").insert([sale]);
  return { data, error };
}

export async function updateSale(id, sale) {
  const { data, error } = await supabase.from("sales").update(sale).eq("id", id);
  return { data, error };
}

export async function getSale(id) {
  const { data, error } = await supabase
    .from("sales")
    .select("*, customer:customers(*)")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function deleteSale(id) {
  const { data, error } = await supabase.from("sales").delete().eq("id", id);
  return { data, error };
}
