"use client";
import { useState } from "react";
import { repairCode } from "@/lib/pythonAssistant";

interface Props {
  title: string;
  code: string;
  explanation: string;
  onRun: (code: string) => Promise<string>;
  index: number;
}

function padIndex(n: number): string {
  return String(n + 1).padStart(2, "0");
}

export default function CodeCell({ title, code, explanation, onRun, index }: Props) {
  const [cellCode, setCellCode] = useState(code);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [repair, setRepair] = useState<{ fixedCode: string; explanation: string } | null>(null);

  async function run() {
    setRunning(true);
    setRepair(null);
    const result = await onRun(cellCode);
    setOutput(result);
    setRunning(false);
    if (result.startsWith("Error:")) {
      const fix = repairCode(cellCode, result);
      if (fix) setRepair(fix);
    }
  }

  function applyRepair() {
    if (!repair) return;
    setCellCode(repair.fixedCode);
    setRepair(null);
  }

  const outputLines = (output || "").split("\n");
  const hasImage = outputLines.some((l) => l.startsWith("__IMG_BASE64__:"));
  const isError = output?.startsWith("Error:") ?? false;

  return (
    <div className="code-cell mb-5 fade-in">
      {/* ── Fake terminal title bar ── */}
      <div className="cell-titlebar">
        <span className="cell-dot" />
        <span>CELL_{padIndex(index)}.PY</span>
        <span style={{ opacity:0.5, marginLeft:4 }}>—</span>
        <span style={{ opacity:0.7, fontFamily:"'Courier New',monospace", fontSize:9 }}>
          {title.replace(/^\d+\.\s*/, "").toUpperCase()}
        </span>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          <button
            onClick={() => setShowExplanation((v) => !v)}
            style={{
              fontFamily:"'Press Start 2P',monospace", fontSize:6,
              background:"rgba(0,0,0,0.3)", color:"#0a0a0a",
              border:"none", padding:"3px 7px", cursor:"pointer",
              textTransform:"uppercase",
            }}
          >
            {showExplanation ? "HIDE" : "EXPLAIN"}
          </button>
          <button
            onClick={run}
            disabled={running}
            style={{
              fontFamily:"'Press Start 2P',monospace", fontSize:6,
              background: running ? "rgba(0,0,0,0.4)" : "#0a0a0a",
              color: running ? "rgba(0,0,0,0.5)" : "var(--green)",
              border:"none", padding:"3px 10px", cursor: running ? "not-allowed" : "pointer",
              textTransform:"uppercase",
              boxShadow: running ? "none" : "none",
            }}
          >
            {running ? "RUNNING" : "▶ RUN"}
          </button>
        </div>
      </div>

      {/* ── Explanation ── */}
      {showExplanation && (
        <div style={{
          padding:"10px 14px", borderBottom:"1px solid var(--green-dim)",
          background:"rgba(0,255,65,0.03)",
          fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)",
          whiteSpace:"pre-wrap", lineHeight:1.5,
        }}>
          <span style={{ color:"var(--green)", marginRight:6 }}>&gt;&gt;</span>
          {explanation}
        </div>
      )}

      {/* ── Input prompt line ── */}
      <div style={{ padding:"4px 14px 0", borderBottom:"1px solid rgba(0,255,65,0.06)" }}>
        <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"var(--green-dim)" }}>
          In&nbsp;[{index + 1}]:&nbsp;
        </span>
      </div>

      {/* ── Code textarea ── */}
      <textarea
        value={cellCode}
        onChange={(e) => setCellCode(e.target.value)}
        style={{
          width:"100%", background:"transparent", padding:"8px 14px 10px",
          fontFamily:"'Courier New',monospace", fontSize:13,
          color:"var(--green)", resize:"none", outline:"none",
          lineHeight:1.55, caretColor:"var(--green)",
        }}
        rows={Math.min(Math.max(cellCode.split("\n").length + 1, 3), 22)}
        spellCheck={false}
      />

      {/* ── Output ── */}
      {output !== null && (
        <div className={`cell-output ${isError ? "is-error" : ""}`}>
          <div style={{ marginBottom:4, fontFamily:"'Courier New',monospace", fontSize:10, color:"rgba(0,255,65,0.4)" }}>
            Out [{index + 1}]:
          </div>
          {outputLines.map((line, i) =>
            line.startsWith("__IMG_BASE64__:") ? (
              <img
                key={i}
                src={`data:image/png;base64,${line.replace("__IMG_BASE64__:", "")}`}
                alt="Plot output"
                style={{ maxWidth:"100%", marginTop:8, border:"1px solid var(--green-dim)" }}
              />
            ) : (
              <div key={i} style={{ minHeight: line ? undefined : 4 }}>{line}</div>
            )
          )}
          {!hasImage && output === "(no output)" && (
            <span style={{ color:"var(--text-dim)", fontStyle:"italic" }}>
              — cell executed with no output —
            </span>
          )}
        </div>
      )}

      {/* ── AI Repair suggestion ── */}
      {repair && (
        <div style={{ padding:"10px 14px", borderTop:"1px solid var(--amber)", background:"rgba(255,153,0,0.04)" }}>
          <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--amber)", marginBottom:8 }}>
            &gt; AI REPAIR SUGGESTION
          </p>
          <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)", marginBottom:8 }}>
            {repair.explanation}
          </p>
          <button onClick={applyRepair}
            style={{
              fontFamily:"'Press Start 2P',monospace", fontSize:7,
              background:"var(--amber)", color:"#0a0a0a",
              border:"none", padding:"7px 12px", cursor:"pointer",
              boxShadow:"2px 2px 0 #7a4800",
            }}>
            &gt; APPLY FIX
          </button>
        </div>
      )}
    </div>
  );
}
