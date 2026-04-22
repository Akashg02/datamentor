import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

export function registerChartJS() {
  ChartJS.register(
    CategoryScale, LinearScale, BarElement, PointElement, LineElement,
    ArcElement, Title, Tooltip, Legend, Filler
  );
}

// Neon retro palette — phosphor green, cyan, amber, magenta, etc.
export const DARK_PALETTE = [
  "rgba(0,255,65,0.85)",    // matrix green
  "rgba(0,207,255,0.85)",   // cyan
  "rgba(255,153,0,0.85)",   // amber
  "rgba(255,0,255,0.85)",   // magenta
  "rgba(255,204,0,0.85)",   // yellow
  "rgba(255,0,85,0.85)",    // hot red
  "rgba(0,255,200,0.85)",   // teal
  "rgba(180,0,255,0.85)",   // purple
];

export const NEON_COLORS = {
  green:   "#00ff41",
  cyan:    "#00cfff",
  amber:   "#ff9900",
  magenta: "#ff00ff",
  yellow:  "#ffcc00",
  red:     "#ff0055",
  teal:    "#00ffc8",
  purple:  "#b400ff",
};

export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#b8ffcc", font: { family: "'Courier New', monospace", size: 11 } },
    },
    tooltip: {
      backgroundColor: "#0a0a0a",
      titleColor: "#00ff41",
      bodyColor: "#b8ffcc",
      borderColor: "#00ff41",
      borderWidth: 1,
      titleFont: { family: "'Press Start 2P', monospace", size: 9 },
      bodyFont:  { family: "'Courier New', monospace", size: 12 },
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(0,255,65,0.6)", font: { family: "'Courier New', monospace", size: 10 } },
      grid:  { color: "rgba(0,255,65,0.08)" },
      border: { color: "rgba(0,255,65,0.3)" },
    },
    y: {
      ticks: { color: "rgba(0,255,65,0.6)", font: { family: "'Courier New', monospace", size: 10 } },
      grid:  { color: "rgba(0,255,65,0.08)" },
      border: { color: "rgba(0,255,65,0.3)" },
    },
  },
};
