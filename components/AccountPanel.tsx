"use client";
import { useState, useEffect } from "react";

interface SavedWork {
  id: string;
  fileName: string;
  csvData: string;
  timestamp: string;
}

interface Props {
  currentCsvText: string;
  currentFileName: string;
  onLoadWork: (csv: string, name: string) => void;
}

const STORAGE_KEY = "datamentor_works";

function loadFromStorage(): SavedWork[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveToStorage(works: SavedWork[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works.slice(0, 20)));
}

export default function AccountPanel({ currentCsvText, currentFileName, onLoadWork }: Props) {
  const [works, setWorks] = useState<SavedWork[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { setWorks(loadFromStorage()); }, []);

  function saveWork() {
    if (!currentCsvText || !currentFileName) { alert("NO CSV LOADED — UPLOAD A FILE FIRST"); return; }
    const newWork: SavedWork = {
      id: Date.now().toString(),
      fileName: currentFileName,
      csvData: currentCsvText,
      timestamp: new Date().toLocaleDateString(),
    };
    const updated = [newWork, ...loadFromStorage()];
    saveToStorage(updated);
    setWorks(updated);
    alert("WORK SAVED!");
  }

  function deleteWork(work: SavedWork) {
    if (!confirm(`DELETE "${work.fileName}"?`)) return;
    const updated = works.filter((w) => w.id !== work.id);
    saveToStorage(updated);
    setWorks(updated);
    if (selected === work.id) setSelected(null);
  }

  function loadSelected() {
    const work = works.find((w) => w.id === selected);
    if (work) onLoadWork(work.csvData, work.fileName);
  }

  const Hdg = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10, color:"var(--green)", textShadow:"var(--glow-green)", marginBottom:16 }}>
      {children}
    </p>
  );

  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      <Hdg>WORKSPACE &amp; SAVED WORKS</Hdg>

      {/* ── Info card ── */}
      <div className="card p-5 mb-5">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--green)", boxShadow:"var(--glow-green)", display:"inline-block" }} />
          <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--green)" }}>LOCAL STORAGE MODE</span>
        </div>
        <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)" }}>
          ALL WORK IS STORED IN YOUR BROWSER. NOTHING LEAVES YOUR MACHINE.
        </p>
      </div>

      {/* ── Save current work ── */}
      <div className="card p-4 mb-5" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ fontFamily:"'Courier New',monospace", fontSize:13, color:"var(--green)" }}>
            ACTIVE: {currentFileName || "NONE"}
          </p>
          <p style={{ fontFamily:"'VT323',monospace", fontSize:15, color:"var(--text-dim)" }}>
            {currentCsvText ? "READY TO SAVE" : "NO CSV LOADED"}
          </p>
        </div>
        <button onClick={saveWork} className="btn-primary" disabled={!currentCsvText}>
          &gt; SAVE WORK
        </button>
      </div>

      {/* ── Saved works list ── */}
      <div className="card overflow-hidden">
        <div style={{ background:"var(--green)", padding:"6px 14px" }}>
          <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"#0a0a0a" }}>
            SAVED WORKS ({works.length})
          </span>
        </div>

        {works.length === 0 ? (
          <p style={{ padding:32, textAlign:"center", fontFamily:"'VT323',monospace", fontSize:18, color:"var(--text-dim)" }}>
            &gt; NO SAVED WORKS YET
          </p>
        ) : (
          <div>
            {works.map((work) => {
              const isSel = selected === work.id;
              return (
                <div
                  key={work.id}
                  style={{
                    display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                    borderBottom:"1px solid var(--border-dim)",
                    background: isSel ? "rgba(0,255,65,0.06)" : "transparent",
                    transition:"background 0.1s",
                  }}
                >
                  <input type="radio" checked={isSel} onChange={() => setSelected(work.id)}
                    style={{ accentColor:"var(--green)", cursor:"pointer", flexShrink:0 }} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:"'Courier New',monospace", fontSize:13, color:"var(--green)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {work.fileName}
                    </p>
                    <p style={{ fontFamily:"'VT323',monospace", fontSize:14, color:"var(--text-dim)" }}>
                      {work.timestamp}&nbsp;·&nbsp;
                      <span style={{ color:"var(--amber)" }}>LOCAL</span>
                    </p>
                  </div>

                  <button
                    onClick={loadSelected}
                    disabled={!isSel}
                    className="btn-secondary"
                    style={{ fontSize:7, padding:"6px 10px" }}
                  >
                    LOAD
                  </button>

                  <button onClick={() => deleteWork(work)} className="btn-danger">
                    DEL
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
