export function formatCsvLine(columns: (string | number)[]) {
  return columns.join(",");
}

export function formatDateYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}
