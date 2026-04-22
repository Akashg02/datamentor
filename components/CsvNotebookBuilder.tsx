"use client";
import { useState, useMemo } from "react";
import Papa from "papaparse";
import { processCSVData, ProcessedData } from "@/lib/chartDataProcessor";
import { normalizeHeaders, removeDuplicateRows, sanitizeCSVRows } from "@/lib/validators";
import { SAMPLE_DATASETS } from "@/lib/sampleDatasets";
import CsvVisualizations from "./CsvVisualizations";
import NotebookViewer from "./NotebookViewer";
import AccountPanel from "./AccountPanel";

type Tab = "upload" | "clean" | "notebook" | "visualize" | "account" | "tutorial";

interface CleaningReport {
  originalRows: number;
  cleanedRows: number;
  duplicatesRemoved: number;
  headersNormalized: boolean;
  nullsFound: number;
}

const TABS: { id: Tab; label: string; key: string }[] = [
  { id: "upload",    label: "UPLOAD",    key: "F1" },
  { id: "clean",     label: "CLEAN",     key: "F2" },
  { id: "notebook",  label: "NOTEBOOK",  key: "F3" },
  { id: "visualize", label: "VISUALIZE", key: "F4" },
  { id: "tutorial",  label: "TUTORIAL",  key: "F5" },
  { id: "account",   label: "ACCOUNT",   key: "F6" },
];

const CLEANING_STEPS = [
  { id: "imports",          label: "imports",          desc: "pandas, numpy, re imports" },
  { id: "load_csv",         label: "load_csv",         desc: "Load CSV into DataFrame" },
  { id: "preview",          label: "preview",          desc: "df.head() + df.info()" },
  { id: "missingness",      label: "missingness",      desc: "Null counts & percentages" },
  { id: "normalize_text",   label: "normalize_text",   desc: "Lowercase + strip strings" },
  { id: "split_location",   label: "split_location",   desc: "Split location col to city/state" },
  { id: "parse_salary",     label: "parse_salary",     desc: "Extract salary min/max from range" },
  { id: "normalize_binary", label: "normalize_binary", desc: "Map yes/no → 1/0" },
  { id: "drop_duplicates",  label: "drop_duplicates",  desc: "Remove duplicate rows" },
  { id: "save_cleaned",     label: "save_cleaned",     desc: "Export cleaned CSV" },
] as const;

type StepId = typeof CLEANING_STEPS[number]["id"];

export default function CsvNotebookBuilder() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<ProcessedData | null>(null);
  const [cleanedData, setCleanedData] = useState<ProcessedData | null>(null);
  const [cleanReport, setCleanReport] = useState<CleaningReport | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<Set<StepId>>(
    new Set(CLEANING_STEPS.map((s) => s.id))
  );
  // Tutorial tab state
  const [tutorialNotebook, setTutorialNotebook] = useState<{ title: string; code: string; explanation: string }[]>([]);
  const [tutorialError, setTutorialError] = useState("");

  function toggleStep(id: StepId) {
    setSelectedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function loadTutorialNotebook(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const nb = JSON.parse(e.target?.result as string);
        const cells = (nb.cells || [])
          .filter((c: { cell_type: string }) => c.cell_type === "code" || c.cell_type === "markdown")
          .map((c: { source: string | string[]; metadata?: { title?: string }; cell_type: string }, i: number) => {
            const src = Array.isArray(c.source) ? c.source.join("") : c.source;
            const isMarkdown = c.cell_type === "markdown";
            return {
              title: c.metadata?.title || (isMarkdown ? `MARKDOWN ${i + 1}` : `CELL ${i + 1}`),
              code: isMarkdown ? "" : src,
              explanation: isMarkdown ? src : "",
            };
          });
        setTutorialNotebook(cells);
        setTutorialError("");
      } catch {
        setTutorialError("FAILED TO PARSE .ipynb — ENSURE IT IS VALID JUPYTER FORMAT");
      }
    };
    reader.readAsText(file);
  }

  function parseCSV(text: string, name: string) {
    setLoading(true);
    setFileName(name);
    setRawCsvText(text);
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const processed = processCSVData(result.data as Record<string, string>[]);
        setParsedData(processed);
        setCleanedData(null);
        setCleanReport(null);
        setLoading(false);
        setActiveTab("clean");
      },
      error: () => setLoading(false),
    });
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target?.result as string, file.name);
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) handleFile(file);
  }

  function runCleaning() {
    if (!parsedData) return;
    let rows = parsedData.rows;
    const originalRows = rows.length;
    rows = sanitizeCSVRows(rows);
    rows = normalizeHeaders(rows);
    const { rows: deduped, removed } = removeDuplicateRows(rows);
    const nullsFound = deduped.reduce((acc, row) =>
      acc + Object.values(row).filter((v) => !v || v.trim() === "").length, 0);
    setCleanedData(processCSVData(deduped));
    setCleanReport({ originalRows, cleanedRows: deduped.length, duplicatesRemoved: removed, headersNormalized: true, nullsFound });
  }

  const activeData = cleanedData || parsedData;

  const cleanedCsvText = useMemo(() => {
    if (!activeData?.rows.length) return rawCsvText;
    const cols = activeData.columnNames;
    const header = cols.join(",");
    const dataRows = activeData.rows.map((r) => cols.map((c) => `"${(r[c] || "").replace(/"/g, '""')}"`).join(","));
    return [header, ...dataRows].join("\n");
  }, [activeData, rawCsvText]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ══ HEADER ══ */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:12, color:"var(--green)", textShadow:"var(--glow-green)" }}>
              [DM]
            </span>
            <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10, color:"var(--green)", textShadow:"var(--glow-green)" }}
                  className="cursor">DATAMENTOR</span>
            <span className="retro-badge ml-1">v1.0</span>
          </div>

          {/* Active file chip */}
          {fileName && (
            <span style={{ fontFamily:"'Courier New',monospace", fontSize:12, color:"var(--cyan)", border:"1px solid var(--cyan)", padding:"2px 8px", textShadow:"var(--glow-cyan)" }}>
              &gt; {fileName}
            </span>
          )}

          {/* Nav tabs */}
          <nav className="flex gap-1 ml-auto flex-wrap">
            {TABS.map((tab) => {
              const disabled = tab.id !== "upload" && tab.id !== "account" && tab.id !== "tutorial" && !parsedData;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => !disabled && setActiveTab(tab.id)}
                  disabled={disabled}
                  style={{
                    fontFamily: "'Press Start 2P',monospace",
                    fontSize: 8,
                    textTransform: "uppercase",
                    padding: "8px 10px",
                    border: "1px solid var(--green)",
                    background: isActive ? "var(--green)" : "transparent",
                    color: isActive ? "#0a0a0a" : "var(--green)",
                    boxShadow: isActive ? "inset 2px 2px 0 rgba(0,0,0,0.3)" : "2px 2px 0 var(--green-dk)",
                    transform: isActive ? "translate(2px,2px)" : "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.3 : 1,
                    transition: "all 0.08s",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span style={{ opacity:0.5, marginRight:4, fontSize:7 }}>{tab.key}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ══════════════════ UPLOAD TAB ══════════════════ */}
        {activeTab === "upload" && (
          <div className="max-w-2xl mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 style={{ fontFamily:"'Press Start 2P',monospace", fontSize:clamp(14,2.5,22), color:"var(--green)", textShadow:"var(--glow-green)", lineHeight:1.8, marginBottom:12 }}>
                CSV INTELLIGENCE
              </h1>
              <p style={{ fontFamily:"'VT323',monospace", fontSize:20, color:"var(--text-dim)" }}>
                &gt;&gt; UPLOAD ANY CSV — GET CLEANING, 10 CHARTS, PYTHON NOTEBOOK &lt;&lt;
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""} p-12 text-center`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById("csv-input")?.click()}
            >
              {/* ASCII art icon */}
              <pre style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"var(--green)", lineHeight:1.3, marginBottom:12, opacity:dragOver?1:0.6 }}>{
`  ██████████
  █  FILE  █
  █        █
  ██████████
     ████`}</pre>
              <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10, color:"var(--green)", textShadow:"var(--glow-green)", marginBottom:8 }}>
                INSERT FILE &gt;
              </p>
              <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)" }}>
                DRAG &amp; DROP  OR  CLICK TO BROWSE
              </p>
              <input id="csv-input" type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center mt-6">
                <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, color:"var(--green)", textShadow:"var(--glow-green)" }}
                   className="loading-text">PARSING</p>
              </div>
            )}

            {/* Sample datasets */}
            <div className="mt-10">
              <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--text-dim)", textAlign:"center", marginBottom:12 }}>
                — OR SELECT SAMPLE DATASET —
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_DATASETS.map((ds) => (
                  <button
                    key={ds.name}
                    onClick={() => parseCSV(ds.csv, ds.name + ".csv")}
                    className="card p-4 text-left"
                    style={{ cursor:"pointer", transition:"all 0.08s" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(0,255,65,0.06)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--glow-green)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-panel)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 var(--green-dk)";
                    }}
                  >
                    <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--green)", marginBottom:6 }}>
                      {ds.name}
                    </p>
                    <p style={{ fontFamily:"'VT323',monospace", fontSize:15, color:"var(--text-dim)" }}>
                      {ds.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ CLEAN TAB ══════════════════ */}
        {activeTab === "clean" && parsedData && (
          <div className="fade-in">
            {/* Header row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 style={{ fontFamily:"'Press Start 2P',monospace", fontSize:11, color:"var(--green)", textShadow:"var(--glow-green)", marginBottom:6 }}>
                  DATA CLEANING
                </h2>
                <p style={{ fontFamily:"'VT323',monospace", fontSize:17, color:"var(--text-dim)" }}>
                  {parsedData.rowCount} ROWS &nbsp;·&nbsp; {parsedData.columnNames.length} COLUMNS
                </p>
              </div>
              <button onClick={runCleaning} className="btn-primary">
                &gt; RUN PIPELINE
              </button>
            </div>

            {/* Type counts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "NUMERIC",     count: parsedData.numericColumns.length,     cls: "type-numeric" },
                { label: "CATEGORICAL", count: parsedData.categoricalColumns.length, cls: "type-categorical" },
                { label: "BOOLEAN",     count: parsedData.booleanColumns.length,     cls: "type-boolean" },
                { label: "DATETIME",    count: parsedData.datetimeColumns.length,    cls: "type-datetime" },
              ].map((item) => (
                <div key={item.label} className="card p-4 text-center">
                  <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:22, marginBottom:4 }}
                     className={item.cls}>{item.count}</p>
                  <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--text-dim)" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Column table */}
            <div className="card overflow-hidden mb-6">
              <div style={{ padding:"8px 14px", borderBottom:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.04)" }}>
                <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--green)" }}>
                  COLUMN MANIFEST
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="retro-table">
                  <thead>
                    <tr>
                      <th>COLUMN</th>
                      <th>TYPE</th>
                      <th>UNIQUE</th>
                      <th>SAMPLE VALUES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.columnNames.map((col) => {
                      const c = parsedData.columns[col];
                      return (
                        <tr key={col}>
                          <td style={{ fontFamily:"'Courier New',monospace", color:"var(--cyan)" }}>{col}</td>
                          <td>
                            <span className={`retro-tag ${c.type === "numeric" ? "type-numeric" : c.type === "categorical" ? "type-categorical" : c.type === "boolean" ? "type-boolean" : "type-datetime"}`}>
                              {c.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ color:"var(--green)" }}>{c.uniqueValues.length}</td>
                          <td style={{ fontFamily:"'Courier New',monospace", fontSize:12, color:"var(--text-dim)" }}>
                            {c.uniqueValues.slice(0, 3).join("  ")}
                            {c.uniqueValues.length > 3 && " …"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cleaning step checkboxes */}
            <div className="card overflow-hidden mb-6">
              <div style={{ padding:"8px 14px", borderBottom:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.04)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--green)" }}>
                  NOTEBOOK CLEANING STEPS
                </span>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setSelectedSteps(new Set(CLEANING_STEPS.map((s) => s.id)))}
                    style={{ fontFamily:"'Press Start 2P',monospace", fontSize:6, color:"var(--green)", background:"transparent", border:"1px solid var(--green)", padding:"3px 7px", cursor:"pointer" }}>
                    ALL
                  </button>
                  <button onClick={() => setSelectedSteps(new Set())}
                    style={{ fontFamily:"'Press Start 2P',monospace", fontSize:6, color:"var(--text-dim)", background:"transparent", border:"1px solid var(--green-dim)", padding:"3px 7px", cursor:"pointer" }}>
                    NONE
                  </button>
                </div>
              </div>
              <div style={{ padding:"12px 14px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:8 }}>
                {CLEANING_STEPS.map((step) => {
                  const checked = selectedSteps.has(step.id);
                  return (
                    <label key={step.id} style={{ display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStep(step.id)}
                        style={{ accentColor:"var(--green)", marginTop:2, flexShrink:0 }}
                      />
                      <div>
                        <span style={{ fontFamily:"'Courier New',monospace", fontSize:12, color: checked ? "var(--green)" : "var(--text-dim)" }}>
                          {step.label}
                        </span>
                        <p style={{ fontFamily:"'VT323',monospace", fontSize:13, color:"var(--text-dim)", margin:0 }}>
                          {step.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div style={{ padding:"6px 14px", borderTop:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.02)" }}>
                <span style={{ fontFamily:"'VT323',monospace", fontSize:14, color:"var(--text-dim)" }}>
                  {selectedSteps.size}/{CLEANING_STEPS.length} STEPS SELECTED — INCLUDED WHEN NOTEBOOK IS GENERATED
                </span>
              </div>
            </div>

            {/* Report */}
            {cleanReport && (
              <div className="card p-5 fade-in" style={{ borderColor:"var(--green)", boxShadow:"var(--glow-green)" }}>
                <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, color:"var(--green)", textShadow:"var(--glow-green)", marginBottom:12 }}>
                  &gt; PIPELINE COMPLETE
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {[
                    { label:"ORIGINAL ROWS",  val: cleanReport.originalRows,        color:"var(--text)" },
                    { label:"CLEAN ROWS",     val: cleanReport.cleanedRows,          color:"var(--green)" },
                    { label:"DUPES REMOVED",  val: cleanReport.duplicatesRemoved,    color:"var(--error)" },
                    { label:"NULL CELLS",     val: cleanReport.nullsFound,           color:"var(--amber)" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--text-dim)", marginBottom:4 }}>{s.label}</p>
                      <p style={{ fontFamily:"'VT323',monospace", fontSize:28, color:s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => setActiveTab("visualize")} className="btn-primary">
                    &gt; VISUALIZE
                  </button>
                  <button onClick={() => setActiveTab("notebook")} className="btn-secondary">
                    &gt; OPEN NOTEBOOK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ NOTEBOOK TAB ══════════════════ */}
        {activeTab === "notebook" && activeData && (
          <NotebookViewer
            csvData={cleanedCsvText}
            fileName={fileName}
            numericCols={activeData.numericColumns}
            categoricalCols={activeData.categoricalColumns}
          />
        )}

        {/* ══════════════════ VISUALIZE TAB ══════════════════ */}
        {activeTab === "visualize" && activeData && (
          <CsvVisualizations data={activeData} />
        )}

        {/* ══════════════════ TUTORIAL TAB ══════════════════ */}
        {activeTab === "tutorial" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 style={{ fontFamily:"'Press Start 2P',monospace", fontSize:11, color:"var(--green)", textShadow:"var(--glow-green)", marginBottom:6 }}>
                TUTORIAL VIEWER
              </h2>
              <p style={{ fontFamily:"'VT323',monospace", fontSize:17, color:"var(--text-dim)" }}>
                UPLOAD A .ipynb FILE TO VIEW ITS CELLS WITH CODE &amp; EXPLANATIONS
              </p>
            </div>

            {/* Upload zone */}
            <div className="card p-6 mb-6" style={{ borderStyle:"dashed" }}>
              <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--green)", marginBottom:10 }}>
                LOAD NOTEBOOK FILE
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div>
                  <label style={{ fontFamily:"'VT323',monospace", fontSize:15, color:"var(--text-dim)", display:"block", marginBottom:4 }}>
                    .ipynb FILE
                  </label>
                  <input
                    type="file"
                    accept=".ipynb,application/json"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) loadTutorialNotebook(f); }}
                    style={{ fontFamily:"'Courier New',monospace", fontSize:12, color:"var(--green)", background:"transparent", border:"1px solid var(--green-dim)", padding:"4px 8px" }}
                  />
                </div>
              </div>
              {tutorialError && (
                <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--error)", marginTop:10 }}>
                  &gt; {tutorialError}
                </p>
              )}
            </div>

            {/* Cells */}
            {tutorialNotebook.length === 0 ? (
              <div className="card p-10 text-center">
                <pre style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"rgba(0,255,65,0.35)", lineHeight:1.4 }}>{
`  ┌──────────────────────┐
  │  NO NOTEBOOK LOADED  │
  │  UPLOAD A .ipynb     │
  │  TO GET STARTED      │
  └──────────────────────┘`}</pre>
                <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)", marginTop:12 }}>
                  SUPPORTS STANDARD JUPYTER NOTEBOOK FORMAT (nbformat 4)
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--green)" }}>
                    {tutorialNotebook.length} CELLS LOADED
                  </span>
                  <button
                    onClick={() => { setTutorialNotebook([]); setTutorialError(""); }}
                    className="btn-danger"
                    style={{ fontSize:7 }}
                  >
                    CLEAR
                  </button>
                </div>
                {tutorialNotebook.map((cell, i) => (
                  <div key={i} className="card mb-4 overflow-hidden">
                    {/* Cell title bar */}
                    <div style={{ background:"var(--green)", padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"#0a0a0a" }}>
                        CELL_{String(i + 1).padStart(2, "0")} — {cell.title.toUpperCase()}
                      </span>
                    </div>

                    {/* Explanation */}
                    {cell.explanation && (
                      <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.03)" }}>
                        <p style={{ fontFamily:"'VT323',monospace", fontSize:15, color:"var(--text-dim)", whiteSpace:"pre-wrap" }}>
                          {cell.explanation}
                        </p>
                      </div>
                    )}

                    {/* Code */}
                    {cell.code && (
                      <div style={{ padding:"10px 14px" }}>
                        <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:6, color:"var(--text-dim)", marginBottom:6 }}>CODE</p>
                        <pre style={{
                          fontFamily:"'Courier New',monospace",
                          fontSize:12,
                          color:"var(--green)",
                          background:"rgba(0,0,0,0.4)",
                          padding:"10px 12px",
                          overflowX:"auto",
                          border:"1px solid var(--green-dim)",
                          margin:0,
                          lineHeight:1.5,
                        }}>
                          {cell.code}
                        </pre>
                      </div>
                    )}

                    {/* Output placeholder */}
                    <div style={{ padding:"8px 14px", borderTop:"1px solid var(--green-dim)", background:"rgba(0,0,0,0.25)" }}>
                      <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:6, color:"var(--text-dim)", marginBottom:4 }}>OUTPUT</p>
                      <p style={{ fontFamily:"'Courier New',monospace", fontSize:12, color:"rgba(0,255,65,0.35)", fontStyle:"italic" }}>
                        [ run in NOTEBOOK tab to see output ]
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ACCOUNT TAB ══════════════════ */}
        {activeTab === "account" && (
          <AccountPanel
            currentCsvText={cleanedCsvText}
            currentFileName={fileName}
            onLoadWork={(csv, name) => { parseCSV(csv, name); setActiveTab("clean"); }}
          />
        )}
      </main>

      {/* Status bar */}
      <footer style={{ borderTop:"1px solid var(--green-dim)", padding:"4px 16px", background:"rgba(0,255,65,0.03)", display:"flex", gap:16, alignItems:"center" }}>
        <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:6, color:"var(--green-dim)" }}>
          DATAMENTOR v1.0
        </span>
        <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"var(--green-dim)" }}>
          {fileName ? `FILE: ${fileName}` : "NO FILE LOADED"}
        </span>
        <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"var(--green-dim)", marginLeft:"auto" }}>
          {parsedData ? `${parsedData.rowCount} ROWS · ${parsedData.columnNames.length} COLS` : "READY"}
        </span>
      </footer>
    </div>
  );
}

function clamp(min: number, preferred: number, max: number): number {
  return Math.min(max, Math.max(min, preferred));
}
