export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US");
}

export function formatDateInput(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.slice(0, 10).split("-");
  return `${month}/${day}/${year}`;
}

export function parseDateInput(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, monthText, dayText, yearText] = match;
  const month = Number(monthText);
  const day = Number(dayText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
