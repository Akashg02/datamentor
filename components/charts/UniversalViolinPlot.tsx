"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { groupByCategory } from "@/lib/advancedDataProcessors";
import { computeStats } from "@/lib/chartDataProcessor";
import { DARK_PALETTE } from "@/lib/chartConfig";

Chart.register(...registerables);

interface Props {
  numericValues: number[];
  categoryValues: string[];
  numericLabel: string;
  categoryLabel: string;
}

export default function UniversalViolinPlot({ numericValues, categoryValues, numericLabel, categoryLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !numericValues.length) return;
    chartRef.current?.destroy();

    const groups = groupByCategory(numericValues, categoryValues);
    const cats = Object.keys(groups).slice(0, 10);

    const datasets = cats.map((cat, i) => {
      const vals = groups[cat];
      const stats = computeStats(vals);
      return {
        label: cat,
        data: [{ x: cat, y: stats.mean, min: stats.min, max: stats.max, q1: stats.q1, q3: stats.q3 }],
        backgroundColor: DARK_PALETTE[i % DARK_PALETTE.length],
      };
    });

    // Use a box-like bar chart as violin approximation
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: cats,
        datasets: [{
          label: numericLabel,
          data: cats.map((cat) => {
            const stats = computeStats(groups[cat] || []);
            return stats.mean;
          }),
          backgroundColor: cats.map((_, i) => DARK_PALETTE[i % DARK_PALETTE.length]),
          borderRadius: 4,
        }, {
          label: "Q1–Q3 Range",
          data: cats.map((cat) => {
            const stats = computeStats(groups[cat] || []);
            return stats.q3 - stats.q1;
          }),
          backgroundColor: cats.map((_, i) => DARK_PALETTE[i % DARK_PALETTE.length].replace("0.85", "0.3")),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#00ff41", font: { family: "'Courier New',monospace", size: 11 } } },
          tooltip: { backgroundColor: "#050505", titleColor: "#00ff41", bodyColor: "#b8ffcc", borderColor: "#00ff41", borderWidth: 1 },
          title: { display: true, text: `${numericLabel} BY ${categoryLabel}`, color: "#00ff41", font: { family: "'Courier New',monospace" } },
        },
        scales: {
          x: { title: { display: true, text: categoryLabel, color: "#7fff7f" }, ticks: { color: "rgba(0,255,65,0.5)", font: { family: "'Courier New',monospace", size: 10 } }, grid: { color: "rgba(0,255,65,0.07)" }, border: { color: "rgba(0,255,65,0.3)" } },
          y: { title: { display: true, text: numericLabel, color: "#7fff7f" }, ticks: { color: "rgba(0,255,65,0.5)", font: { family: "'Courier New',monospace", size: 10 } }, grid: { color: "rgba(0,255,65,0.07)" }, border: { color: "rgba(0,255,65,0.3)" } },
        },
      },
    });
    void datasets;
    return () => { chartRef.current?.destroy(); };
  }, [numericValues, categoryValues, numericLabel, categoryLabel]);

  if (!numericValues.length) return <p className="text-gray-400 text-center p-4">No data</p>;
  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
