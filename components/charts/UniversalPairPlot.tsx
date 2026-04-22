"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { computeHistogramBins } from "@/lib/advancedDataProcessors";

Chart.register(...registerables);

interface Props {
  data: Record<string, number[]>;
  cols: string[];
}

function getMaxHeight(n: number): number {
  if (n <= 2) return 320;
  if (n === 3) return 240;
  if (n === 4) return 180;
  if (n <= 6) return 130;
  return 90;
}

function getLabelWidth(n: number): number {
  if (n <= 3) return 72;
  if (n <= 5) return 60;
  return 48;
}

function ScatterCell({ xs, ys }: { xs: number[]; ys: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const n = Math.min(xs.length, ys.length, 200);
    chartRef.current = new Chart(canvasRef.current, {
      type: "scatter",
      data: {
        datasets: [{
          data: Array.from({ length: n }, (_, i) => ({ x: xs[i], y: ys[i] })),
          backgroundColor: "rgba(0,255,65,0.4)",
          pointRadius: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false } },
        },
        animation: false,
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [xs, ys]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

function HistCell({ vals }: { vals: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const { labels, counts } = computeHistogramBins(vals, 10);
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: "rgba(0,207,255,0.65)",
          barPercentage: 1, categoryPercentage: 1,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false } },
        },
        animation: false,
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [vals]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

export default function UniversalPairPlot({ data, cols }: Props) {
  if (!cols.length) return <p className="text-gray-400 text-center p-4">Select numeric columns</p>;
  const n = cols.length;
  const maxH = getMaxHeight(n);
  const labelW = getLabelWidth(n);
  const fontSize = n > 5 ? 9 : n > 3 ? 10 : 11;

  return (
    <div className="overflow-auto">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${labelW}px repeat(${n}, minmax(0, 1fr))`,
          gap: 2,
        }}
      >
        {/* Header row */}
        <div />
        {cols.map((c) => (
          <div key={c} style={{ fontSize, color: "#9ca3af", textAlign: "center", padding: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c}
          </div>
        ))}
        {/* Grid rows */}
        {cols.map((rowCol, ri) => (
          <>
            <div key={`l-${rowCol}`} style={{ fontSize, color: "#9ca3af", display: "flex", alignItems: "center", paddingRight: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rowCol}
            </div>
            {cols.map((colCol, ci) => (
              <div
                key={`${rowCol}-${colCol}`}
                style={{
                  aspectRatio: "1",
                  maxHeight: maxH,
                  background: "rgba(0,255,65,0.02)",
                  borderRadius: 0,
                  overflow: "hidden",
                  border: "1px solid rgba(0,255,65,0.08)",
                }}
              >
                {ri === ci
                  ? <HistCell vals={data[rowCol] || []} />
                  : <ScatterCell xs={data[colCol] || []} ys={data[rowCol] || []} />
                }
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
