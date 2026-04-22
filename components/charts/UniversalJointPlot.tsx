"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { computeHistogramBins } from "@/lib/advancedDataProcessors";

Chart.register(...registerables);

interface Props {
  xValues: number[];
  yValues: number[];
  xLabel: string;
  yLabel: string;
}

function MiniChart({ type, data, label, color }: { type: "bar" | "scatter"; data: unknown; label: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        animation: false,
        elements: { point: { radius: 2 } },
      },
    });
    void label; void color;
    return () => { chartRef.current?.destroy(); };
  }, [type, data, label, color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

export default function UniversalJointPlot({ xValues, yValues, xLabel, yLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const n = Math.min(xValues.length, yValues.length, 500);
  const xHist = computeHistogramBins(xValues, 20);
  const yHist = computeHistogramBins(yValues, 20);

  useEffect(() => {
    if (!canvasRef.current || !xValues.length) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "scatter",
      data: {
        datasets: [{
          label: `${xLabel} vs ${yLabel}`,
          data: Array.from({ length: n }, (_, i) => ({ x: xValues[i], y: yValues[i] })),
          backgroundColor: "rgba(0,255,65,0.4)",
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
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
  }, [xValues, yValues, xLabel, yLabel, n]);

  if (!xValues.length) return <p className="text-gray-400 text-center p-4">No data</p>;

  const xHistData = { labels: xHist.labels, datasets: [{ data: xHist.counts, backgroundColor: "rgba(0,255,65,0.55)", barPercentage: 1, categoryPercentage: 1 }] };
  const yHistData = { labels: yHist.labels, datasets: [{ data: yHist.counts, backgroundColor: "rgba(0,207,255,0.55)", barPercentage: 1, categoryPercentage: 1 }] };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gridTemplateRows: "80px 1fr", gap: 4 }}>
      <div style={{ height: 80 }}>
        <MiniChart type="bar" data={xHistData} label={xLabel} color="rgba(99,102,241,0.6)" />
      </div>
      <div />
      <div style={{ height: 300 }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ height: 300 }}>
        <MiniChart type="bar" data={yHistData} label={yLabel} color="rgba(168,85,247,0.6)" />
      </div>
    </div>
  );
}
