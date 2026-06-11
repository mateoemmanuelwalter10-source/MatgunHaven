import { supabase } from "./supabase";

export async function fetchReports() {
  const { data, error } = await supabase.from("sales").select("*");
  return { data, error };
}
