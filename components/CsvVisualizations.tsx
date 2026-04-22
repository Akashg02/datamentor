"use client";
import { useState, useMemo } from "react";
import { ProcessedData } from "@/lib/chartDataProcessor";
import { aggregateByCategory, computeFrequencies } from "@/lib/advancedDataProcessors";
import {
  generateDistPlotAnalysis, generatePieChartAnalysis,
  generateHeatMapAnalysis, generatePairPlotAnalysis, generateGenericAnalysis,
} from "@/lib/visualizationAnalysis";
import { CHART_TYPES } from "@/lib/chartTypes";
import AnalysisPanel from "./charts/AnalysisPanel";
import UniversalDistPlot from "./charts/UniversalDistPlot";
import UniversalPieChart from "./charts/UniversalPieChart";
import UniversalBarChart from "./charts/UniversalBarChart";
import UniversalHistogram from "./charts/UniversalHistogram";
import UniversalScatterChart from "./charts/UniversalScatterChart";
import UniversalLineChart from "./charts/UniversalLineChart";
import UniversalHeatMap from "./charts/UniversalHeatMap";
import UniversalViolinPlot from "./charts/UniversalViolinPlot";
import UniversalPairPlot from "./charts/UniversalPairPlot";
import UniversalJointPlot from "./charts/UniversalJointPlot";

interface Props { data: ProcessedData; }

function RetroLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--text-dim)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>
      {children}
    </p>
  );
}

function ColumnDropdown({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <RetroLabel>{label}</RetroLabel>
      <select className="select-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MultiColumnSelector({ label, selected, onChange, options, max }: {
  label: string; selected: string[]; onChange: (v: string[]) => void; options: string[]; max: number;
}) {
  function toggle(col: string) {
    if (selected.includes(col)) onChange(selected.filter((c) => c !== col));
    else if (selected.length < max) onChange([...selected, col]);
  }
  return (
    <div>
      <RetroLabel>{label} (MAX {max})</RetroLabel>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:6, border:"1px solid var(--green-dim)", maxHeight:100, overflowY:"auto" }}>
        {options.map((o) => (
          <button key={o} onClick={() => toggle(o)}
            className={selected.includes(o) ? "pill-active" : "pill-inactive"}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChartPanel({ chartId, data }: { chartId: string; data: ProcessedData }) {
  const [col1, setCol1] = useState(data.numericColumns[0] || "");
  const [col2, setCol2] = useState(data.numericColumns[1] || data.categoricalColumns[0] || "");
  const [multiCols, setMultiCols] = useState<string[]>(data.numericColumns.slice(0, 4));

  const analysis = useMemo(() => {
    const numData: Record<string, number[]> = {};
    for (const c of data.numericColumns) numData[c] = data.columns[c]?.numericValues || [];
    switch (chartId) {
      case "DistPlot": return generateDistPlotAnalysis(col1, numData);
      case "PieChart": return generatePieChartAnalysis(col1, computeFrequencies(data.columns[col1]?.values || []));
      case "HeatMap":  return generateHeatMapAnalysis(multiCols);
      case "PairPlot": return generatePairPlotAnalysis(multiCols);
      default:         return generateGenericAnalysis(chartId, [col1, col2].filter(Boolean));
    }
  }, [chartId, col1, col2, multiCols, data]);

  function renderChart() {
    const col1Data = data.columns[col1];
    const col2Data = data.columns[col2];
    const numData: Record<string, number[]> = {};
    for (const c of data.numericColumns) numData[c] = data.columns[c]?.numericValues || [];

    switch (chartId) {
      case "DistPlot":
        return <><ColumnDropdown label="Numeric column" value={col1} onChange={setCol1} options={data.numericColumns} />
          <UniversalDistPlot values={col1Data?.numericValues || []} label={col1} /></>;

      case "PieChart": {
        const catOptions = [...data.categoricalColumns, ...data.booleanColumns];
        const cats = Array.from(new Set((col1Data?.values || []).map(String))).slice(0, 20);
        const freq = computeFrequencies(col1Data?.values || []);
        return <><ColumnDropdown label="Categorical column" value={col1} onChange={setCol1} options={catOptions.length ? catOptions : data.columnNames} />
          <UniversalPieChart labels={cats} values={cats.map((c) => freq[c] || 0)} label={col1} /></>;
      }

      case "ViolinPlot":
        return <><div className="grid grid-cols-2 gap-3">
          <ColumnDropdown label="Numeric column" value={col1} onChange={setCol1} options={data.numericColumns} />
          <ColumnDropdown label="Category column" value={col2} onChange={setCol2} options={[...data.categoricalColumns, ...data.booleanColumns]} />
        </div>
          <UniversalViolinPlot numericValues={col1Data?.numericValues || []} categoryValues={(col2Data?.values || []).map(String)} numericLabel={col1} categoryLabel={col2} /></>;

      case "HeatMap":
        return <><MultiColumnSelector label="Numeric columns" selected={multiCols} onChange={setMultiCols} options={data.numericColumns} max={8} />
          <UniversalHeatMap data={numData} cols={multiCols} /></>;

      case "PairPlot":
        return <><MultiColumnSelector label="Numeric columns" selected={multiCols} onChange={setMultiCols} options={data.numericColumns} max={10} />
          <UniversalPairPlot data={numData} cols={multiCols} /></>;

      case "JointPlot":
        return <><div className="grid grid-cols-2 gap-3">
          <ColumnDropdown label="X column" value={col1} onChange={setCol1} options={data.numericColumns} />
          <ColumnDropdown label="Y column" value={col2} onChange={setCol2} options={data.numericColumns} />
        </div>
          <UniversalJointPlot xValues={col1Data?.numericValues || []} yValues={col2Data?.numericValues || []} xLabel={col1} yLabel={col2} /></>;

      case "BarChart": {
        const catCols = [...data.categoricalColumns, ...data.booleanColumns];
        const agg = aggregateByCategory((col1Data?.values || []).map(String), col2Data?.numericValues || []);
        return <><div className="grid grid-cols-2 gap-3">
          <ColumnDropdown label="Category column" value={col1} onChange={setCol1} options={catCols.length ? catCols : data.columnNames} />
          <ColumnDropdown label="Numeric column" value={col2} onChange={setCol2} options={data.numericColumns} />
        </div>
          <UniversalBarChart labels={agg.labels} values={agg.values} xLabel={col1} yLabel={col2} /></>;
      }

      case "Histogram":
        return <><ColumnDropdown label="Numeric column" value={col1} onChange={setCol1} options={data.numericColumns} />
          <UniversalHistogram values={col1Data?.numericValues || []} label={col1} /></>;

      case "ScatterPlot":
        return <><div className="grid grid-cols-2 gap-3">
          <ColumnDropdown label="X column" value={col1} onChange={setCol1} options={data.numericColumns} />
          <ColumnDropdown label="Y column" value={col2} onChange={setCol2} options={data.numericColumns} />
        </div>
          <UniversalScatterChart xValues={col1Data?.numericValues || []} yValues={col2Data?.numericValues || []} xLabel={col1} yLabel={col2} /></>;

      case "LineChart":
        return <><div className="grid grid-cols-2 gap-3">
          <ColumnDropdown label="X column" value={col1} onChange={setCol1} options={[...data.numericColumns, ...data.datetimeColumns]} />
          <ColumnDropdown label="Y column" value={col2} onChange={setCol2} options={data.numericColumns} />
        </div>
          <UniversalLineChart xValues={(col1Data?.values || []).map(String)} yValues={col2Data?.numericValues || []} xLabel={col1} yLabel={col2} /></>;

      default:
        return <p style={{ color:"var(--text-dim)" }}>Unknown chart type</p>;
    }
  }

  return (
    <div className="space-y-3">
      {renderChart()}
      <AnalysisPanel analysis={analysis} />
    </div>
  );
}

export default function CsvVisualizations({ data }: Props) {
  const [activeChart, setActiveChart] = useState("DistPlot");

  if (!data.rowCount) {
    return (
      <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, color:"var(--text-dim)", textAlign:"center", padding:40 }}>
        &gt; NO DATA LOADED — UPLOAD A CSV FIRST
      </p>
    );
  }

  const activeDef = CHART_TYPES.find((c) => c.id === activeChart);

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <h2 style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10, color:"var(--green)", textShadow:"var(--glow-green)", marginBottom:6 }}>
          VISUALIZATION MATRIX
        </h2>
        <p style={{ fontFamily:"'VT323',monospace", fontSize:17, color:"var(--text-dim)" }}>
          SELECT CHART TYPE  ·  CONFIGURE COLUMNS  ·  ANALYZE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── Chart type sidebar ── */}
        <div className="card p-0 overflow-hidden">
          <div style={{ padding:"8px 12px", borderBottom:"1px solid var(--green-dim)", background:"rgba(0,255,65,0.05)" }}>
            <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--green)" }}>CHART TYPES</p>
          </div>
          <div style={{ padding:4 }}>
            {CHART_TYPES.map((ct) => {
              const isActive = activeChart === ct.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => setActiveChart(ct.id)}
                  style={{
                    width:"100%", textAlign:"left", padding:"8px 10px", display:"block",
                    fontFamily:"'Courier New',monospace", fontSize:13,
                    color: isActive ? "#0a0a0a" : "var(--green)",
                    background: isActive ? "var(--green)" : "transparent",
                    border: "none",
                    borderLeft: isActive ? "3px solid var(--green-dk)" : "3px solid transparent",
                    cursor:"pointer", transition:"all 0.1s",
                    textTransform:"uppercase",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(0,255,65,0.08)"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ marginRight:6, opacity:0.7 }}>{ct.icon}</span>
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chart panel ── */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          {/* Panel title bar */}
          <div style={{ background:"var(--green)", padding:"6px 12px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"#0a0a0a" }}>
              {activeDef?.icon} {activeDef?.label?.toUpperCase()}
            </span>
            <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"rgba(0,0,0,0.6)", marginLeft:"auto" }}>
              {data.rowCount} ROWS
            </span>
          </div>
          <div style={{ padding:16 }}>
            <p style={{ fontFamily:"'VT323',monospace", fontSize:15, color:"var(--text-dim)", marginBottom:12 }}>
              &gt; {activeDef?.description}
            </p>
            <ChartPanel key={activeChart} chartId={activeChart} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
