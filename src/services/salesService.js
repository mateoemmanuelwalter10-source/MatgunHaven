import { supabase } from "./supabase";
import { logSystemError, logSystemEvent } from "./systemLogService";

const salesSelect = `id, customer_id, sale_date:Date_Delivered, receipt_no:"Reciept_No.", gallons:Quantity, total_amount:Delivered_Total_Price, price_per_gallon:Price_at_time, notes, created_at, customer:customers_list(id, full_name:name, phone:contact_number, price_per_gallon:price_per_container)`;

export async function fetchSales() {
  const { data, error } = await supabase
    .from("sales")
    .select(salesSelect)
    .order("created_at", { ascending: false });
  if (error) await logSystemError("fetch_sales", error, { entityType: "sale" });
  return { data, error };
}

export async function createSale(sale) {
  const payload = {
    customer_id: sale.customer_id,
    Date_Delivered: sale.sale_date || new Date().toISOString().slice(0, 10),
    "Reciept_No.": Number(sale.receipt_no),
    Quantity: Number(sale.gallons) || 0,
    Delivered_Total_Price: Number(sale.total_amount) || 0,
    Price_at_time: Number(sale.price_per_gallon) || 0,
    notes: sale.notes,
  };

  const { data, error } = await supabase.from("sales").insert([payload]);
  if (error) {
    await logSystemError("create_sale", error, { entityType: "sale" });
  } else {
    await logSystemEvent({
      eventType: "create",
      message: "Delivery created",
      entityType: "sale",
      entityId: data?.[0]?.id,
    });
  }
  return { data, error };
}

export async function fetchExistingReceiptNumbers() {
  const receipts = new Set();
  const pageSize = 1000;

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from("sales")
      .select('"Reciept_No."')
      .range(start, start + pageSize - 1);

    if (error) {
      await logSystemError("fetch_existing_receipt_numbers", error, {
        entityType: "sale",
      });
      return { data: null, error };
    }

    for (const row of data || []) {
      const receiptNumber = Number(row["Reciept_No."]);
      if (Number.isFinite(receiptNumber)) receipts.add(String(receiptNumber));
    }

    if (!data || data.length < pageSize) break;
  }

  return { data: receipts, error: null };
}

export async function bulkCreateSales(sales, onProgress = () => {}) {
  const batchSize = 100;
  let inserted = 0;

  for (let start = 0; start < sales.length; start += batchSize) {
    const batch = sales.slice(start, start + batchSize).map((sale) => ({
      customer_id: sale.customer_id,
      Date_Delivered: sale.sale_date,
      "Reciept_No.": Number(sale.receipt_no),
      Quantity: Number(sale.gallons),
      Delivered_Total_Price: Number(sale.total_amount),
      Price_at_time: Number(sale.price_per_gallon),
      notes: null,
    }));
    const { error } = await supabase.from("sales").insert(batch);

    if (error) {
      await logSystemError("import_sales", error, {
        entityType: "sale",
        details: { inserted_count: inserted, total_count: sales.length },
      });
      if (inserted > 0) {
        await logSystemEvent({
          eventType: "import",
          message: "Sales import partially completed",
          entityType: "sale",
          details: { inserted_count: inserted, total_count: sales.length },
        });
      }
      return { inserted, error, failedAt: start + 1 };
    }
    inserted += batch.length;
    onProgress(inserted, sales.length);
  }

  await logSystemEvent({
    eventType: "import",
    message: "Sales imported",
    entityType: "sale",
    details: { inserted_count: inserted, total_count: sales.length },
  });
  return { inserted, error: null };
}

export async function updateSale(id, sale) {
  const payload = {
    customer_id: sale.customer_id,
    Date_Delivered: sale.sale_date,
    Quantity: Number(sale.gallons) || 0,
    Delivered_Total_Price: Number(sale.total_amount) || 0,
    Price_at_time: Number(sale.price_per_gallon) || 0,
    notes: sale.notes,
  };

  const { data, error } = await supabase.from("sales").update(payload).eq("id", id);
  if (error) {
    await logSystemError("update_sale", error, { entityType: "sale", entityId: id });
  } else {
    await logSystemEvent({
      eventType: "update",
      message: "Delivery updated",
      entityType: "sale",
      entityId: id,
    });
  }
  return { data, error };
}

export async function getSale(id) {
  const { data, error } = await supabase
    .from("sales")
    .select(salesSelect)
    .eq("id", id)
    .single();
  if (error) await logSystemError("fetch_sale", error, { entityType: "sale", entityId: id });
  return { data, error };
}

export async function deleteSale(id) {
  const { data, error } = await supabase.from("sales").delete().eq("id", id);
  if (error) {
    await logSystemError("delete_sale", error, { entityType: "sale", entityId: id });
  } else {
    await logSystemEvent({
      eventType: "delete",
      message: "Delivery deleted",
      entityType: "sale",
      entityId: id,
    });
  }
  return { data, error };
}
