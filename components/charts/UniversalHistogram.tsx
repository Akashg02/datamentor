"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { computeHistogramBins } from "@/lib/advancedDataProcessors";

Chart.register(...registerables);

interface Props {
  values: number[];
  label: string;
  bins?: number;
}

export default function UniversalHistogram({ values, label, bins = 25 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !values.length) return;
    chartRef.current?.destroy();
    const { labels, counts } = computeHistogramBins(values, bins);

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label,
          data: counts,
          backgroundColor: "rgba(0,207,255,0.5)",
          borderColor: "#00cfff",
          borderWidth: 1,
          barPercentage: 1,
          categoryPercentage: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#00cfff", font: { family: "'Courier New',monospace", size: 11 } } },
          tooltip: { backgroundColor: "#050505", titleColor: "#00cfff", bodyColor: "#b8ffcc", borderColor: "#00cfff", borderWidth: 1 },
        },
        scales: {
          x: { ticks: { color: "rgba(0,207,255,0.5)", maxRotation: 45, autoSkip: true, maxTicksLimit: 10, font: { family: "'Courier New',monospace", size:10 } }, grid: { color: "rgba(0,207,255,0.07)" }, border: { color: "rgba(0,207,255,0.3)" } },
          y: { ticks: { color: "rgba(0,207,255,0.5)", font: { family: "'Courier New',monospace", size:10 } }, grid: { color: "rgba(0,207,255,0.07)" }, border: { color: "rgba(0,207,255,0.3)" } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [values, label, bins]);

  if (!values.length) return <p className="text-gray-400 text-center p-4">No numeric data</p>;
  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
