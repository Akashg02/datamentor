"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { DARK_PALETTE } from "@/lib/chartConfig";

Chart.register(...registerables);

interface Props {
  labels: string[];
  values: number[];
  xLabel: string;
  yLabel: string;
}

export default function UniversalBarChart({ labels, values, xLabel, yLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !labels.length) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: yLabel,
          data: values,
          backgroundColor: DARK_PALETTE.slice(0, labels.length),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#00ff41", font: { family: "'Courier New',monospace", size: 11 } } },
          tooltip: { backgroundColor: "#050505", titleColor: "#00ff41", bodyColor: "#b8ffcc", borderColor: "#00ff41", borderWidth: 1 },
        },
        scales: {
          x: { title: { display: true, text: xLabel, color: "#7fff7f" }, ticks: { color: "rgba(0,255,65,0.5)", font: { family: "'Courier New',monospace", size: 10 } }, grid: { color: "rgba(0,255,65,0.07)" }, border: { color: "rgba(0,255,65,0.3)" } },
          y: { title: { display: true, text: yLabel, color: "#7fff7f" }, ticks: { color: "rgba(0,255,65,0.5)", font: { family: "'Courier New',monospace", size: 10 } }, grid: { color: "rgba(0,255,65,0.07)" }, border: { color: "rgba(0,255,65,0.3)" } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [labels, values, xLabel, yLabel]);

  if (!labels.length) return <p className="text-gray-400 text-center p-4">No data</p>;
  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
