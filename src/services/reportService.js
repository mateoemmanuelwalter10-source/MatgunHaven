import { supabase } from "./supabase";
import { logSystemError } from "./systemLogService";

export async function fetchReports() {
  const { data, error } = await supabase.from("sales").select("*");
  if (error) await logSystemError("fetch_reports", error, { entityType: "report" });
  return { data, error };
}
