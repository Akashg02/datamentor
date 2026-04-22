export type ColumnType = "numeric" | "categorical" | "boolean" | "datetime";

export interface ParsedColumn {
  name: string;
  type: ColumnType;
  values: (string | number | null)[];
  numericValues: number[];
  uniqueValues: string[];
}

export interface ProcessedData {
  columns: Record<string, ParsedColumn>;
  rows: Record<string, string>[];
  rowCount: number;
  columnNames: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  booleanColumns: string[];
  datetimeColumns: string[];
}

export function isDateColumn(values: string[]): boolean {
  let valid = 0;
  let total = 0;
  for (const v of values) {
    const strVal = String(v).trim();
    if (!strVal) continue;
    // Skip pure numeric strings — new Date("63") is valid but misleading
    if (/^-?\d+(\.\d+)?$/.test(strVal)) continue;
    total++;
    const d = new Date(strVal);
    if (!isNaN(d.getTime())) valid++;
  }
  return total > 0 && valid / total > 0.7;
}

export function detectColumnType(values: (string | number | null)[]): ColumnType {
  const nonEmpty = values.filter((v) => v !== null && v !== "" && v !== undefined);
  if (nonEmpty.length === 0) return "categorical";

  const numericCount = nonEmpty.filter((v) => {
    const n = Number(v);
    return isFinite(n);
  }).length;

  if (numericCount / nonEmpty.length > 0.8) {
    const nums = nonEmpty.map((v) => Number(v)).filter(isFinite);
    const uniqueNums = new Set(nums);
    if (uniqueNums.size === 2 && uniqueNums.has(0) && uniqueNums.has(1)) {
      return "boolean";
    }
    return "numeric";
  }

  if (isDateColumn(nonEmpty.map(String))) return "datetime";

  return "categorical";
}

export function processCSVData(rows: Record<string, string>[]): ProcessedData {
  if (!rows.length) {
    return {
      columns: {}, rows: [], rowCount: 0,
      columnNames: [], numericColumns: [], categoricalColumns: [],
      booleanColumns: [], datetimeColumns: [],
    };
  }

  const columnNames = Object.keys(rows[0]);
  const columns: Record<string, ParsedColumn> = {};

  for (const col of columnNames) {
    const rawValues = rows.map((r) => r[col] ?? null);
    const type = detectColumnType(rawValues);
    const numericValues =
      type === "numeric" || type === "boolean"
        ? rawValues.map((v) => Number(v)).filter(isFinite)
        : [];
    const uniqueValues = Array.from(new Set(rawValues.map(String).filter(Boolean)));

    columns[col] = { name: col, type, values: rawValues, numericValues, uniqueValues };
  }

  return {
    columns,
    rows,
    rowCount: rows.length,
    columnNames,
    numericColumns: columnNames.filter((c) => columns[c].type === "numeric"),
    categoricalColumns: columnNames.filter((c) => columns[c].type === "categorical"),
    booleanColumns: columnNames.filter((c) => columns[c].type === "boolean"),
    datetimeColumns: columnNames.filter((c) => columns[c].type === "datetime"),
  };
}

export function computeStats(values: number[]) {
  if (!values.length) return { min: 0, max: 0, mean: 0, median: 0, std: 0, q1: 0, q3: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  return { min: sorted[0], max: sorted[n - 1], mean, median, std, q1, q3 };
}

export function computeCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const ex = xs[i] - mx, ey = ys[i] - my;
    num += ex * ey;
    dx += ex * ex;
    dy += ey * ey;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

export function computeKDE(values: number[], bandwidth?: number): { x: number[]; y: number[] } {
  if (!values.length) return { x: [], y: [] };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const n = values.length;
  const bw = bandwidth ?? (1.06 * (computeStats(values).std || 1) * Math.pow(n, -0.2));
  const points = 100;
  const xs = Array.from({ length: points }, (_, i) => min + (i / (points - 1)) * (max - min));
  const ys = xs.map((xi) => {
    const sum = values.reduce((acc, v) => {
      const u = (xi - v) / bw;
      return acc + Math.exp(-0.5 * u * u);
    }, 0);
    return sum / (n * bw * Math.sqrt(2 * Math.PI));
  });
  return { x: xs, y: ys };
}
