import { AnalysisResult } from "@/lib/visualizationAnalysis";

interface Props {
  analysis: AnalysisResult | null;
}

export default function AnalysisPanel({ analysis }: Props) {
  if (!analysis) return null;

  return (
    <div
      className="fade-in"
      style={{
        marginTop:16, border:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.02)",
        boxShadow:"3px 3px 0 rgba(0,255,65,0.1)",
      }}
    >
      {/* Panel header */}
      <div style={{ padding:"6px 12px", borderBottom:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.05)" }}>
        <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--green)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
          &gt; ANALYSIS REPORT
        </p>
      </div>

      <div style={{ padding:"12px 14px" }}>
        {/* Title */}
        <p style={{ fontFamily:"'Courier New',monospace", fontSize:13, color:"var(--cyan)", textShadow:"var(--glow-cyan)", marginBottom:4 }}>
          {analysis.title.toUpperCase()}
        </p>
        <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)", marginBottom:12 }}>
          {analysis.description}
        </p>

        {/* Insights */}
        {analysis.insights.length > 0 && (
          <>
            <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--text-dim)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>
              INSIGHTS
            </p>
            <ul style={{ listStyle:"none", padding:0, margin:"0 0 12px" }}>
              {analysis.insights.map((ins, i) => (
                <li key={i} style={{ display:"flex", gap:8, marginBottom:6, fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text)" }}>
                  <span style={{ color:"var(--green)", flexShrink:0 }}>&gt;</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Column context tags */}
        {analysis.columnContext.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {analysis.columnContext.map((ctx, i) => (
              <span
                key={i}
                style={{
                  fontFamily:"'Courier New',monospace", fontSize:11,
                  padding:"2px 8px", border:"1px solid var(--green-dim)",
                  color:"var(--green)", background:"rgba(0,255,65,0.06)",
                }}
              >
                {ctx}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
