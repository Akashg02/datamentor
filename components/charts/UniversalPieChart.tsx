"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { DARK_PALETTE } from "@/lib/chartConfig";

Chart.register(...registerables);

interface Props {
  labels: string[];
  values: number[];
  label: string;
}

export default function UniversalPieChart({ labels, values, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !labels.length) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          backgroundColor: DARK_PALETTE.slice(0, labels.length),
          borderColor: "#050505",
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { color: "#b8ffcc", padding: 12, font: { family: "'Courier New',monospace", size: 11 } } },
          tooltip: { backgroundColor: "#050505", titleColor: "#00ff41", bodyColor: "#b8ffcc", borderColor: "#00ff41", borderWidth: 1 },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [labels, values, label]);

  if (!labels.length) return <p className="text-gray-400 text-center p-4">No categorical data</p>;
  return (
    <div style={{ height: 320 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
