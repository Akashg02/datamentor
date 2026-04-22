export type ChartTypeId =
  | "DistPlot" | "PieChart" | "ViolinPlot" | "HeatMap"
  | "PairPlot" | "JointPlot" | "BarChart" | "Histogram"
  | "ScatterPlot" | "LineChart";

export interface ChartTypeDef {
  id: ChartTypeId;
  label: string;
  description: string;
  icon: string;
  col1Type: "numeric" | "categorical" | "numeric|datetime" | null;
  col2Type: "numeric" | "categorical" | null;
  multiSelect: "numeric" | "numeric+group" | null;
  maxMulti?: number;
}

export const CHART_TYPES: ChartTypeDef[] = [
  {
    id: "DistPlot",
    label: "Distribution Plot",
    description: "Histogram with KDE curve showing value distribution",
    icon: "📊",
    col1Type: "numeric",
    col2Type: null,
    multiSelect: null,
  },
  {
    id: "PieChart",
    label: "Pie Chart",
    description: "Category proportions as slices",
    icon: "🥧",
    col1Type: "categorical",
    col2Type: null,
    multiSelect: null,
  },
  {
    id: "ViolinPlot",
    label: "Violin Plot",
    description: "Distribution density grouped by category",
    icon: "🎻",
    col1Type: "numeric",
    col2Type: "categorical",
    multiSelect: null,
  },
  {
    id: "HeatMap",
    label: "Heat Map",
    description: "Correlation matrix for multiple numeric columns",
    icon: "🌡️",
    col1Type: null,
    col2Type: null,
    multiSelect: "numeric",
    maxMulti: 8,
  },
  {
    id: "PairPlot",
    label: "Pair Plot",
    description: "NxN grid of scatter plots for multiple columns",
    icon: "🔲",
    col1Type: null,
    col2Type: null,
    multiSelect: "numeric+group",
    maxMulti: 10,
  },
  {
    id: "JointPlot",
    label: "Joint Plot",
    description: "Scatter with marginal histograms",
    icon: "⊕",
    col1Type: "numeric",
    col2Type: "numeric",
    multiSelect: null,
  },
  {
    id: "BarChart",
    label: "Bar Chart",
    description: "Category vs numeric value comparison",
    icon: "📶",
    col1Type: "categorical",
    col2Type: "numeric",
    multiSelect: null,
  },
  {
    id: "Histogram",
    label: "Histogram",
    description: "Frequency distribution of a numeric column",
    icon: "📉",
    col1Type: "numeric",
    col2Type: null,
    multiSelect: null,
  },
  {
    id: "ScatterPlot",
    label: "Scatter Plot",
    description: "Two numeric columns plotted against each other",
    icon: "✦",
    col1Type: "numeric",
    col2Type: "numeric",
    multiSelect: null,
  },
  {
    id: "LineChart",
    label: "Line Chart",
    description: "Trend line over a numeric or datetime axis",
    icon: "📈",
    col1Type: "numeric|datetime",
    col2Type: "numeric",
    multiSelect: null,
  },
];

export const CHART_TYPE_MAP = Object.fromEntries(
  CHART_TYPES.map((ct) => [ct.id, ct])
) as Record<ChartTypeId, ChartTypeDef>;
