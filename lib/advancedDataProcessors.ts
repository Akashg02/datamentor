import { computeCorrelation, computeStats } from "./chartDataProcessor";

export function buildCorrelationMatrix(
  data: Record<string, number[]>,
  cols: string[]
): number[][] {
  return cols.map((r) =>
    cols.map((c) => computeCorrelation(data[r] || [], data[c] || []))
  );
}

export function computeHistogramBins(
  values: number[],
  numBins = 20
): { labels: string[]; counts: number[] } {
  if (!values.length) return { labels: [], counts: [] };
  const stats = computeStats(values);
  const width = (stats.max - stats.min) / numBins || 1;
  const counts = new Array(numBins).fill(0);
  const labels: string[] = [];
  for (let i = 0; i < numBins; i++) {
    const lo = stats.min + i * width;
    const hi = lo + width;
    labels.push(`${lo.toFixed(1)}–${hi.toFixed(1)}`);
    for (const v of values) {
      if (v >= lo && (i === numBins - 1 ? v <= hi : v < hi)) counts[i]++;
    }
  }
  return { labels, counts };
}

export function groupByCategory(
  numericValues: number[],
  categoryValues: string[]
): Record<string, number[]> {
  const groups: Record<string, number[]> = {};
  for (let i = 0; i < numericValues.length; i++) {
    const cat = String(categoryValues[i] || "Unknown");
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(numericValues[i]);
  }
  return groups;
}

export function aggregateByCategory(
  catValues: string[],
  numericValues: number[]
): { labels: string[]; values: number[] } {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (let i = 0; i < catValues.length; i++) {
    const cat = String(catValues[i] || "Unknown");
    sums[cat] = (sums[cat] || 0) + (numericValues[i] || 0);
    counts[cat] = (counts[cat] || 0) + 1;
  }
  const labels = Object.keys(sums);
  const values = labels.map((l) => sums[l] / counts[l]);
  return { labels, values };
}

export function computeFrequencies(values: (string | number | null)[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const v of values) {
    const k = String(v ?? "null");
    freq[k] = (freq[k] || 0) + 1;
  }
  return freq;
}
