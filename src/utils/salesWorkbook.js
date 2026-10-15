function normalizeHeader(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findColumnIndexes(row) {
  const columns = {
    customer: -1,
    date: -1,
    receipt: -1,
    quantity: -1,
    amount: -1,
  };

  row.forEach((value, index) => {
    const header = normalizeHeader(value);
    if (columns.customer === -1 && header === "customer") {
      columns.customer = index;
    } else if (
      columns.date === -1 &&
      (header === "date" || header.includes("deliverydate"))
    ) {
      columns.date = index;
    } else if (
      columns.receipt === -1 &&
      header.includes("receipt") &&
      (header.includes("no") || header.includes("number"))
    ) {
      columns.receipt = index;
    } else if (
      columns.quantity === -1 &&
      (header.includes("quantity") || header.includes("gallons"))
    ) {
      columns.quantity = index;
    } else if (
      columns.amount === -1 &&
      (header.includes("amount") || header.includes("total"))
    ) {
      columns.amount = index;
    }
  });

  const requiredColumns = [columns.date, columns.receipt, columns.quantity, columns.amount];
  return requiredColumns.every((index) => index >= 0) ? columns : null;
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return parseDate(date);
  }

  const normalized = String(value ?? "").trim();
  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const usMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!isoMatch && !usMatch) return null;

  const [, first, second, third] = isoMatch || usMatch;
  const year = Number(isoMatch ? first : third);
  const month = Number(isoMatch ? second : first);
  const day = Number(isoMatch ? third : second);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      if (!isEmptyRow(row)) rows.push(row);
      row = [];
      field = "";
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  row.push(field);
  if (!isEmptyRow(row)) rows.push(row);
  if (inQuotes) throw new Error("CSV contains an unclosed quoted field.");
  return rows;
}

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value ?? "")
    .replace(/[₱,\s]/g, "")
    .trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function isEmptyRow(row) {
  return row.every((value) => value === null || value === undefined || value === "");
}

function isTotalRow(row) {
  return row.some((value) => /^\s*total\s*:?$/i.test(String(value ?? "")));
}

export async function parseSalesFile(file, customers, existingReceipts) {
  const sheets = file.name.toLowerCase().endsWith(".csv")
    ? [{ sheet: file.name, data: parseCsvRows(await file.text()) }]
    : await (async () => {
        const { default: readExcelFile } = await import("read-excel-file/browser");
        return readExcelFile(file);
      })();
  return parseSalesSheets(sheets, customers, existingReceipts);
}

export function parseSalesSheets(sheets, customers, existingReceipts) {
  const customersByName = new Map();

  for (const customer of customers) {
    const key = String(customer.full_name || "").trim().toLocaleLowerCase();
    const matches = customersByName.get(key) || [];
    matches.push(customer);
    customersByName.set(key, matches);
  }

  const previewRows = [];
  const seenReceipts = new Set();
  const recognizedSheets = new Set();

  sheets.forEach(({ sheet, data }) => {
    let columns = null;
    const sheetCustomerName = String(sheet).trim();

    data.forEach((row, rowIndex) => {
      if (!Array.isArray(row) || isEmptyRow(row)) return;

      const headerColumns = findColumnIndexes(row);
      if (headerColumns) {
        columns = headerColumns;
        recognizedSheets.add(sheet);
        return;
      }

      if (!columns || isTotalRow(row)) return;

      const receiptValue = row[columns.receipt];
      const customerName = String(
        columns.customer >= 0 ? row[columns.customer] ?? "" : sheetCustomerName,
      ).trim();
      const matchingCustomers =
        customersByName.get(customerName.toLocaleLowerCase()) || [];
      const quantity = parseNumber(row[columns.quantity]);
      const amount = parseNumber(row[columns.amount]);
      const saleDate = parseDate(row[columns.date]);
      const receiptNumber = parseNumber(receiptValue);
      const reasons = [];

      if (matchingCustomers.length === 0) {
        reasons.push(`Customer "${customerName || "(blank)"}" was not found.`);
      } else if (matchingCustomers.length > 1) {
        reasons.push(`Customer name "${customerName}" is not unique.`);
      }
      if (!saleDate) reasons.push("Invalid delivery date.");
      if (!Number.isInteger(receiptNumber) || receiptNumber <= 0) {
        reasons.push("Receipt number must be a positive integer.");
      }
      if (quantity === null || quantity <= 0) {
        reasons.push("Quantity must be greater than zero.");
      }
      if (amount === null || amount < 0) {
        reasons.push("Amount must be zero or greater.");
      }

      if (Number.isInteger(receiptNumber) && receiptNumber > 0) {
        const receiptKey = String(receiptNumber);
        if (existingReceipts.has(receiptKey) || seenReceipts.has(receiptKey)) {
          reasons.push("Duplicate receipt number.");
        }
      }

      const valid = reasons.length === 0;
      const status = valid
        ? "ready"
        : reasons.every((reason) => reason === "Duplicate receipt number.")
          ? "skipped"
          : "invalid";
      if (valid) seenReceipts.add(String(receiptNumber));
      previewRows.push({
        worksheet: sheet,
        rowNumber: rowIndex + 1,
        receiptNumber,
        customerName,
        saleDate,
        quantity,
        amount,
        valid,
        status,
        reasons,
        sale: valid
          ? {
              customer_id: matchingCustomers[0].id,
              sale_date: saleDate,
              receipt_no: receiptNumber,
              gallons: quantity,
              total_amount: amount,
              price_per_gallon: amount / quantity,
            }
          : null,
      });
    });
  });

  const skippedSheets = sheets
    .map(({ sheet }) => sheet)
    .filter((sheet) => !recognizedSheets.has(sheet));

  return { rows: previewRows, skippedSheets };
}
