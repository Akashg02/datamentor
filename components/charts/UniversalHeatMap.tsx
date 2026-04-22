"use client";
import { buildCorrelationMatrix } from "@/lib/advancedDataProcessors";

interface Props {
  data: Record<string, number[]>;
  cols: string[];
}

function colorForValue(v: number): string {
  // -1 = red, 0 = neutral (transparent), 1 = green
  if (v > 0) return `rgba(0,255,65,${(Math.abs(v) * 0.85).toFixed(2)})`;
  return `rgba(255,0,85,${(Math.abs(v) * 0.8).toFixed(2)})`;
}

export default function UniversalHeatMap({ data, cols }: Props) {
  if (!cols.length) return <p className="text-gray-400 text-center p-4">Select numeric columns</p>;

  const matrix = buildCorrelationMatrix(data, cols);
  const cellSize = Math.min(80, Math.floor(480 / cols.length));
  const fontSize = cellSize < 50 ? 9 : 11;

  return (
    <div className="overflow-auto">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `80px repeat(${cols.length}, ${cellSize}px)`,
          gap: 1,
        }}
      >
        {/* Header row */}
        <div />
        {cols.map((c) => (
          <div
            key={c}
            style={{ fontSize, writingMode: "vertical-rl", transform: "rotate(180deg)", padding: "4px 2px", color: "#9ca3af", textAlign: "center", maxWidth: cellSize, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {c}
          </div>
        ))}
        {/* Data rows */}
        {cols.map((rowCol, ri) => (
          <>
            <div key={`label-${rowCol}`} style={{ fontSize, color: "#9ca3af", display: "flex", alignItems: "center", paddingRight: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rowCol}
            </div>
            {cols.map((colCol, ci) => {
              const v = matrix[ri][ci];
              return (
                <div
                  key={`${rowCol}-${colCol}`}
                  title={`${rowCol} vs ${colCol}: ${v.toFixed(3)}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: colorForValue(v),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: fontSize - 1,
                    color: Math.abs(v) > 0.5 ? "#050505" : "rgba(0,255,65,0.5)",
                    borderRadius: 2,
                  }}
                >
                  {v.toFixed(2)}
                </div>
              );
            })}
          </>
        ))}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:10, fontFamily:"'Courier New',monospace", fontSize:11 }}>
        <span style={{ background: "rgba(255,0,85,0.7)", padding: "2px 8px", color:"#fff" }}>-1 NEGATIVE</span>
        <span style={{ border: "1px solid rgba(0,255,65,0.3)", padding: "2px 8px", color:"rgba(0,255,65,0.5)" }}>0 NONE</span>
        <span style={{ background: "rgba(0,255,65,0.7)", padding: "2px 8px", color:"#050505" }}>+1 POSITIVE</span>
      </div>
    </div>
  );
}
