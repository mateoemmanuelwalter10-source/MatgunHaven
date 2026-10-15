import { supabase } from "./supabase";
import { logSystemError, logSystemEvent } from "./systemLogService";

const customerColumns = `id, full_name:name, phone:contact_number, price_per_gallon:price_per_container, status, created_at`;

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("customers_list")
    .select(customerColumns)
    .order("created_at", { ascending: true });
  if (error) await logSystemError("fetch_customers", error, { entityType: "customer" });
  return { data, error };
}

export async function fetchActiveCustomers() {
  const { data, error } = await supabase
    .from("customers_list")
    .select(customerColumns)
    .eq("status", true)
    .order("created_at", { ascending: true });
  if (error) await logSystemError("fetch_active_customers", error, { entityType: "customer" });
  return { data, error };
}

export async function createCustomer(customer) {
  const payload = {
    name: customer.full_name,
    contact_number: customer.phone?.trim() || null,
    price_per_container: Number(customer.price_per_gallon) || 0,
    status: true,
  };

  const { data, error } = await supabase.from("customers_list").insert([payload]);
  if (error) {
    await logSystemError("create_customer", error, { entityType: "customer" });
  } else {
    await logSystemEvent({
      eventType: "create",
      message: "Customer created",
      entityType: "customer",
      entityId: data?.[0]?.id,
    });
  }
  return { data, error };
}

export async function updateCustomer(id, customer) {
  const payload = {
    name: customer.full_name,
    contact_number: customer.phone?.trim() || null,
    price_per_container: Number(customer.price_per_gallon) || 0,
  };

  const { data, error } = await supabase.from("customers_list").update(payload).eq("id", id);
  if (error) {
    await logSystemError("update_customer", error, { entityType: "customer", entityId: id });
  } else {
    await logSystemEvent({
      eventType: "update",
      message: "Customer updated",
      entityType: "customer",
      entityId: id,
    });
  }
  return { data, error };
}

export async function getCustomer(id) {
  const { data, error } = await supabase
    .from("customers_list")
    .select(customerColumns)
    .eq("id", id)
    .single();
  if (error) {
    await logSystemError("fetch_customer", error, { entityType: "customer", entityId: id });
  }
  return { data, error };
}

export async function deleteCustomer(id) {
  const { data, error } = await supabase.from("customers_list").delete().eq("id", id);
  if (error) {
    await logSystemError("delete_customer", error, { entityType: "customer", entityId: id });
  } else {
    await logSystemEvent({
      eventType: "delete",
      message: "Customer deleted",
      entityType: "customer",
      entityId: id,
    });
  }
  return { data, error };
}

export async function setCustomerActive(id, isActive) {
  const { data, error } = await supabase
    .from("customers_list")
    .update({ status: isActive })
    .eq("id", id)
    .select(customerColumns)
    .single();
  if (error) {
    await logSystemError("change_customer_status", error, {
      entityType: "customer",
      entityId: id,
    });
  } else {
    await logSystemEvent({
      eventType: "update",
      message: isActive ? "Customer activated" : "Customer deactivated",
      entityType: "customer",
      entityId: id,
      details: { status: isActive ? "active" : "inactive" },
    });
  }
  return { data, error };
}
