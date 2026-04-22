import { computeStats } from "./chartDataProcessor";

interface ColumnKnowledge {
  label: string;
  description: string;
  insight: (stats: ReturnType<typeof computeStats>) => string;
  pairInsight?: (otherCol: string) => string;
}

export const COLUMN_KNOWLEDGE: Record<string, ColumnKnowledge> = {
  age: {
    label: "Age",
    description: "Patient or subject age in years",
    insight: (s) => `Ages range from ${s.min.toFixed(0)} to ${s.max.toFixed(0)} (mean ${s.mean.toFixed(1)}). ${s.std > 15 ? "High age variance suggests a diverse cohort." : "Relatively homogeneous age group."}`,
    pairInsight: (other) => `Age vs ${other} may reveal age-related trends common in clinical datasets.`,
  },
  chol: {
    label: "Cholesterol",
    description: "Serum cholesterol in mg/dL",
    insight: (s) => `Cholesterol mean ${s.mean.toFixed(1)} mg/dL. ${s.mean > 240 ? "Above the high-risk threshold of 240 mg/dL." : "Within normal range (<200 mg/dL is optimal)."}`,
    pairInsight: (other) => `Cholesterol and ${other} correlation is clinically significant for cardiovascular risk.`,
  },
  trtbps: {
    label: "Resting Blood Pressure",
    description: "Resting blood pressure in mmHg",
    insight: (s) => `Mean BP: ${s.mean.toFixed(1)} mmHg. ${s.mean > 130 ? "Elevated — hypertension stage 1 threshold is 130 mmHg." : "Within acceptable range."}`,
  },
  thalachh: {
    label: "Max Heart Rate",
    description: "Maximum heart rate achieved",
    insight: (s) => `Max HR range: ${s.min.toFixed(0)}–${s.max.toFixed(0)} bpm (mean ${s.mean.toFixed(1)}). Reduced max HR may indicate cardiovascular compromise.`,
  },
  price: {
    label: "Price",
    description: "Monetary value or price",
    insight: (s) => `Price range $${s.min.toFixed(2)}–$${s.max.toFixed(2)}, mean $${s.mean.toFixed(2)}. ${s.std / s.mean > 0.5 ? "High price variability detected." : "Prices are relatively consistent."}`,
    pairInsight: (other) => `Price vs ${other} can reveal value drivers in the dataset.`,
  },
  salary: {
    label: "Salary",
    description: "Annual or monthly compensation",
    insight: (s) => `Salary distribution: mean $${s.mean.toFixed(0)}, std $${s.std.toFixed(0)}. ${s.std / s.mean > 0.4 ? "Wide salary disparity present." : "Relatively uniform compensation."}`,
  },
  revenue: {
    label: "Revenue",
    description: "Business revenue metric",
    insight: (s) => `Revenue: mean ${s.mean.toFixed(0)}, range ${s.min.toFixed(0)}–${s.max.toFixed(0)}.`,
  },
  temperature: {
    label: "Temperature",
    description: "Temperature measurement",
    insight: (s) => `Temperature range: ${s.min.toFixed(1)}–${s.max.toFixed(1)}, mean ${s.mean.toFixed(1)}.`,
  },
  score: {
    label: "Score",
    description: "Performance or assessment score",
    insight: (s) => `Scores: mean ${s.mean.toFixed(1)}, std ${s.std.toFixed(1)}. ${s.mean < 60 ? "Below-average performance observed." : "Performance appears satisfactory."}`,
  },
  grade: {
    label: "Grade",
    description: "Academic or quality grade",
    insight: (s) => `Grade distribution: mean ${s.mean.toFixed(1)}.`,
  },
};

export interface AnalysisResult {
  title: string;
  description: string;
  insights: string[];
  columnContext: string[];
}

function getKnownInsights(cols: string[], data: Record<string, number[]>): string[] {
  const insights: string[] = [];
  for (const col of cols) {
    const key = col.toLowerCase().replace(/[^a-z]/g, "");
    const known = COLUMN_KNOWLEDGE[key];
    if (known && data[col]?.length) {
      const stats = computeStats(data[col]);
      insights.push(known.insight(stats));
    }
  }
  return insights;
}

export function generateDistPlotAnalysis(col: string, data: Record<string, number[]>): AnalysisResult {
  const vals = data[col] || [];
  const stats = computeStats(vals);
  const skew = stats.mean > stats.median ? "right-skewed" : stats.mean < stats.median ? "left-skewed" : "symmetric";
  const insights = [
    `Distribution is approximately ${skew} (mean ${stats.mean.toFixed(2)}, median ${stats.median.toFixed(2)}).`,
    `Range: [${stats.min.toFixed(2)}, ${stats.max.toFixed(2)}], std dev: ${stats.std.toFixed(2)}.`,
    stats.std / (stats.mean || 1) > 0.5
      ? "High coefficient of variation — significant spread in values."
      : "Values are clustered closely around the mean.",
    ...getKnownInsights([col], data),
  ];
  return {
    title: `Distribution of "${col}"`,
    description: `Univariate analysis showing value frequency and density estimation.`,
    insights,
    columnContext: [`${col}: analyzed across ${vals.length} observations`],
  };
}

export function generatePieChartAnalysis(col: string, freqs: Record<string, number>): AnalysisResult {
  const entries = Object.entries(freqs).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const top = entries[0];
  const insights = [
    `"${top?.[0]}" is the most frequent category at ${((top?.[1] / total) * 100).toFixed(1)}%.`,
    `${entries.length} distinct categories detected.`,
    entries[0]?.[1] / total > 0.5 ? "One category dominates — consider whether this reflects the true population." : "Reasonably balanced category distribution.",
  ];
  return {
    title: `Category Distribution: "${col}"`,
    description: "Proportional breakdown of categorical values.",
    insights,
    columnContext: [`${col}: ${entries.length} unique categories, ${total} total observations`],
  };
}

export function generateHeatMapAnalysis(cols: string[]): AnalysisResult {
  return {
    title: `Correlation Matrix: ${cols.slice(0, 3).join(", ")}${cols.length > 3 ? "…" : ""}`,
    description: `Pairwise Pearson correlation for ${cols.length} numeric columns.`,
    insights: [
      "Values near ±1 indicate strong linear relationships; values near 0 suggest independence.",
      "Multicollinearity (|r| > 0.9) can affect regression model stability.",
      `Analyzing ${cols.length} columns yields ${(cols.length * (cols.length - 1)) / 2} unique pairs.`,
    ],
    columnContext: cols.map((c) => `${c}: numeric`),
  };
}

export function generatePairPlotAnalysis(cols: string[]): AnalysisResult {
  return {
    title: `Pair Plot: ${cols.length} Variables`,
    description: "NxN scatter matrix revealing bivariate relationships and univariate distributions.",
    insights: [
      `${cols.length}×${cols.length} grid shows ${cols.length * cols.length} panels.`,
      "Diagonal panels show each variable's distribution.",
      "Off-diagonal panels reveal linear or non-linear associations.",
      "Clusters or bands in scatter panels may indicate grouping in the data.",
    ],
    columnContext: cols.map((c) => `${c}: numeric`),
  };
}

export function generateGenericAnalysis(chartType: string, cols: string[]): AnalysisResult {
  return {
    title: `${chartType}: ${cols.join(" vs ")}`,
    description: `Visualization of ${cols.length} variable(s).`,
    insights: [
      `Selected columns: ${cols.join(", ")}.`,
      "Patterns in the chart may reveal trends, outliers, or clusters.",
    ],
    columnContext: cols.map((c) => `${c}`),
  };
}
