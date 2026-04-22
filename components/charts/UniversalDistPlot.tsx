"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { computeKDE, computeStats } from "@/lib/chartDataProcessor";
import { computeHistogramBins } from "@/lib/advancedDataProcessors";

Chart.register(...registerables);

interface Props {
  values: number[];
  label: string;
}

export default function UniversalDistPlot({ values, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !values.length) return;
    chartRef.current?.destroy();

    const { labels: binLabels, counts } = computeHistogramBins(values, 20);
    const { x: kdeX, y: kdeY } = computeKDE(values);
    const stats = computeStats(values);
    const maxCount = Math.max(...counts, 1);
    const maxKde = Math.max(...kdeY, 1);
    const kdeScaled = kdeY.map((v) => (v / maxKde) * maxCount);

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: binLabels,
        datasets: [
          {
            label: label,
            data: counts,
            backgroundColor: "rgba(0,255,65,0.5)",
            borderColor: "#00ff41",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#00ff41", font: { family: "'Courier New',monospace", size: 11 } } },
          tooltip: {
            callbacks: { afterBody: () => [`Mean: ${stats.mean.toFixed(2)}`, `Std: ${stats.std.toFixed(2)}`] },
            backgroundColor: "#050505", titleColor: "#00ff41", bodyColor: "#b8ffcc",
            borderColor: "#00ff41", borderWidth: 1,
          },
        },
        scales: {
          x: { ticks: { color: "rgba(0,255,65,0.5)", maxRotation: 45, font: { family: "'Courier New',monospace", size: 10 } }, grid: { color: "rgba(0,255,65,0.07)" }, border: { color: "rgba(0,255,65,0.3)" } },
          y: { ticks: { color: "rgba(0,255,65,0.5)", font: { family: "'Courier New',monospace", size: 10 } }, grid: { color: "rgba(0,255,65,0.07)" }, border: { color: "rgba(0,255,65,0.3)" } },
        },
      },
    });

    void kdeX; void kdeScaled; // KDE overlay skipped for simplicity (bar-only)
    return () => { chartRef.current?.destroy(); };
  }, [values, label]);

  if (!values.length) return <p className="text-gray-400 text-center p-4">No numeric data</p>;
  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
