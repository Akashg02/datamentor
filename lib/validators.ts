export function isValidCSV(file: File): boolean {
  return file.type === "text/csv" || file.name.endsWith(".csv");
}

export function sanitizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function sanitizeCSVRows(
  rows: Record<string, string>[]
): Record<string, string>[] {
  if (!rows.length) return rows;
  const keys = Object.keys(rows[0]);
  return rows.map((row) => {
    const clean: Record<string, string> = {};
    for (const k of keys) {
      clean[k] = String(row[k] ?? "").trim();
    }
    return clean;
  });
}

export function removeDuplicateRows(
  rows: Record<string, string>[]
): { rows: Record<string, string>[]; removed: number } {
  const seen = new Set<string>();
  const result: Record<string, string>[] = [];
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(row);
    }
  }
  return { rows: result, removed: rows.length - result.length };
}

export function normalizeHeaders(
  rows: Record<string, string>[]
): Record<string, string>[] {
  if (!rows.length) return rows;
  const keys = Object.keys(rows[0]);
  const map: Record<string, string> = {};
  for (const k of keys) map[k] = sanitizeHeader(k);
  return rows.map((row) => {
    const n: Record<string, string> = {};
    for (const k of keys) n[map[k]] = row[k];
    return n;
  });
}
