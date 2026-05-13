export function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

export function formatCurrency(value?: number | null) {
  return `BDT ${Number(value || 0).toLocaleString()}`;
}

export function todayInputValue() {
  return new Date().toISOString().split("T")[0] || "";
}
