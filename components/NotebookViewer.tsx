"use client";
import { useState } from "react";
import CodeCell from "./CodeCell";
import { usePyodide } from "@/hooks/usePyodide";

interface Props {
  csvData: string;
  fileName: string;
  numericCols: string[];
  categoricalCols: string[];
}

function buildCells(fileName: string, numericCols: string[], categoricalCols: string[]) {
  const numCol  = numericCols[0]  || "value";
  const catCol  = categoricalCols[0] || "category";

  // Retro neon matplotlib setup — #050505 background, matrix green + cyan
  const imgSetup = `import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from io import BytesIO
import base64

BG   = '#050505'
C1   = '#00ff41'   # matrix green
C2   = '#00cfff'   # cyan
C3   = '#ff9900'   # amber
GRID = '#0a2a0a'

def save_fig():
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor=BG, edgecolor='none')
    buf.seek(0)
    img = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    print(f'__IMG_BASE64__:{img}')
`;

  return [
    {
      title: "1. Load CSV",
      explanation: "Load CSV from the injected variable __csv_data__ using pandas.\nDataMentor automatically injects your uploaded file as a string.",
      code: `import pandas as pd
from io import StringIO

df = pd.read_csv(StringIO(__csv_data__))
print(f"Loaded {len(df)} rows x {len(df.columns)} columns")
print("Columns:", list(df.columns))
print(df.head().to_string())`,
    },
    {
      title: "2. Shape & Info",
      explanation: "df.shape returns (rows, cols). df.dtypes shows each column's inferred type.\nUseful for verifying the parse was correct.",
      code: `print("Shape:", df.shape)
print()
print("Data types:")
print(df.dtypes.to_string())
print()
print("Column names:", list(df.columns))`,
    },
    {
      title: "3. Descriptive Statistics",
      explanation: "df.describe() gives count, mean, std, min, quartiles and max for numeric columns.",
      code: `desc = df.describe()
print(desc.to_string())`,
    },
    {
      title: "4. Missing Values",
      explanation: "df.isnull().sum() counts NaN/None per column.\nPercentage = null_count / total_rows * 100.",
      code: `null_counts = df.isnull().sum()
null_pct = (null_counts / len(df) * 100).round(2)
result = pd.DataFrame({'null_count': null_counts, 'null_%': null_pct})
msg = result[result['null_count'] > 0].to_string()
print(msg if msg else ">> NO MISSING VALUES FOUND")`,
    },
    {
      title: "5. Duplicate Rows",
      explanation: "Detect and remove exact duplicate rows.\ndf.duplicated() returns a boolean Series — sum() gives the count.",
      code: `dups = df.duplicated().sum()
print(f"Duplicate rows: {dups}")
if dups > 0:
    df = df.drop_duplicates()
    print(f"Removed. New shape: {df.shape}")
else:
    print(">> NO DUPLICATES FOUND")`,
    },
    {
      title: "6. Correlation Matrix",
      explanation: "Pearson correlation between all numeric columns.\nValues near ±1 = strong linear relationship; near 0 = weak.",
      code: `numeric_df = df.select_dtypes(include='number')
corr = numeric_df.corr().round(3)
print(corr.to_string())`,
    },
    {
      title: "7. Value Counts",
      explanation: `Count occurrences of unique values in categorical columns.\nUseful for class balance analysis and spotting rare categories.`,
      code: `cat_cols = df.select_dtypes(include=['object','category']).columns
if len(cat_cols) > 0:
    col = cat_cols[0]
    print(f"Value counts for '{col}':")
    print(df[col].value_counts().head(20).to_string())
else:
    print(">> NO CATEGORICAL COLUMNS FOUND")`,
    },
    {
      title: "8. Distribution Plot",
      explanation: `KDE histogram for column "${numCol}".\nHistogram bins count occurrences; KDE estimates probability density.`,
      code: `${imgSetup}
import numpy as np
from scipy.stats import gaussian_kde

col = '${numCol}'
if col not in df.columns:
    col = df.select_dtypes(include='number').columns[0]

vals = df[col].dropna().values
fig, ax = plt.subplots(figsize=(10, 5))
ax.set_facecolor(BG); fig.patch.set_facecolor(BG)

ax.hist(vals, bins=25, color=C1, alpha=0.55, edgecolor='#003a0f', linewidth=0.5)
kde = gaussian_kde(vals)
xs = np.linspace(vals.min(), vals.max(), 200)
ax.plot(xs, kde(xs) * len(vals) * (vals.max()-vals.min())/25, color=C2, lw=2, label='KDE')

ax.set_title(f'DISTRIBUTION: {col.upper()}', color=C1, fontsize=11)
ax.set_xlabel(col, color='#7fff7f')
ax.set_ylabel('FREQUENCY', color='#7fff7f')
ax.tick_params(colors='#3a6a3a')
ax.grid(True, color=GRID, linewidth=0.5)
ax.legend(facecolor='#050505', labelcolor=C2)
save_fig()`,
    },
    {
      title: "9. Pie Chart",
      explanation: "Pie chart for the first low-cardinality categorical column.\nAuto-detects columns with ≤15 unique values.",
      code: `${imgSetup}

cat_cols = [c for c in df.columns if df[c].nunique() <= 15 and df[c].dtype == object]
if not cat_cols:
    print(">> NO SUITABLE CATEGORICAL COLUMN FOUND")
else:
    col = cat_cols[0]
    counts = df[col].value_counts().head(8)
    colors = [C1,'#00a032',C2,'#0066aa',C3,'#cc7700','#ff00ff','#aa00aa']

    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(BG); ax.set_facecolor(BG)

    wedges, texts, autotexts = ax.pie(counts.values, labels=counts.index,
                                       autopct='%1.1f%%', colors=colors[:len(counts)],
                                       startangle=90, pctdistance=0.82)
    for t in texts: t.set_color('#b8ffcc')
    for a in autotexts: a.set_color(BG); a.set_fontsize(9)
    ax.set_title(f'DISTRIBUTION: {col.upper()}', color=C1, fontsize=11)
    save_fig()`,
    },
    {
      title: "10. Violin / Box Plot",
      explanation: "Grouped distribution by categorical column.\nShows median, IQR, and tails per category.",
      code: `${imgSetup}

num_cols = df.select_dtypes(include='number').columns
cat_cols = [c for c in df.columns if df[c].dtype == object and df[c].nunique() <= 10]

if len(num_cols) == 0 or len(cat_cols) == 0:
    print(">> NEED AT LEAST ONE NUMERIC AND ONE CATEGORICAL COLUMN")
else:
    num_col, cat_col = num_cols[0], cat_cols[0]
    groups = [df[df[cat_col]==v][num_col].dropna().values for v in df[cat_col].unique()[:8]]
    labels = list(df[cat_col].unique()[:8])

    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor(BG); ax.set_facecolor(BG)

    parts = ax.violinplot(groups, showmedians=True)
    for pc in parts['bodies']: pc.set_facecolor(C1); pc.set_alpha(0.55)
    parts['cmedians'].set_colors(C2)
    parts['cbars'].set_colors('#003a0f')
    parts['cmins'].set_colors('#003a0f')
    parts['cmaxes'].set_colors('#003a0f')
    ax.set_xticks(range(1, len(labels)+1))
    ax.set_xticklabels(labels, color='#7fff7f', rotation=30)
    ax.tick_params(colors='#3a6a3a')
    ax.grid(True, color=GRID, linewidth=0.5)
    ax.set_title(f'{num_col.upper()} BY {cat_col.upper()}', color=C1, fontsize=11)
    ax.set_xlabel(cat_col, color='#7fff7f')
    ax.set_ylabel(num_col, color='#7fff7f')
    save_fig()`,
    },
    {
      title: "11. Correlation Heat Map",
      explanation: "Color-coded correlation matrix.\nAnnotated values help identify strong positive/negative correlations.",
      code: `${imgSetup}
import numpy as np

numeric_df = df.select_dtypes(include='number')
if numeric_df.shape[1] < 2:
    print(">> NEED AT LEAST 2 NUMERIC COLUMNS")
else:
    corr = numeric_df.corr()
    n = len(corr)

    fig, ax = plt.subplots(figsize=(max(6,n), max(5,n-1)))
    fig.patch.set_facecolor(BG); ax.set_facecolor(BG)

    # Custom colormap: red→black→green
    from matplotlib.colors import LinearSegmentedColormap
    cmap = LinearSegmentedColormap.from_list('retro', ['#ff0055', BG, C1])

    im = ax.imshow(corr.values, cmap=cmap, vmin=-1, vmax=1)
    plt.colorbar(im, ax=ax)

    ax.set_xticks(range(n)); ax.set_xticklabels(corr.columns, rotation=45, ha='right', color='#7fff7f', fontsize=8)
    ax.set_yticks(range(n)); ax.set_yticklabels(corr.columns, color='#7fff7f', fontsize=8)

    for i in range(n):
        for j in range(n):
            ax.text(j, i, f'{corr.values[i,j]:.2f}', ha='center', va='center',
                   color='#0a0a0a' if abs(corr.values[i,j]) > 0.5 else '#3a5a3a', fontsize=8)

    ax.set_title('CORRELATION MATRIX', color=C1, fontsize=11)
    save_fig()`,
    },
    {
      title: "12. Pair Plot",
      explanation: "NxN scatter matrix for up to 5 numeric columns.\nDiagonal shows histograms; off-diagonal shows scatter plots.",
      code: `${imgSetup}
import numpy as np

num_cols = df.select_dtypes(include='number').columns[:5]
n = len(num_cols)
if n < 2:
    print(">> NEED AT LEAST 2 NUMERIC COLUMNS")
else:
    fig, axes = plt.subplots(n, n, figsize=(3*n, 3*n))
    fig.patch.set_facecolor(BG)

    for i, ci in enumerate(num_cols):
        for j, cj in enumerate(num_cols):
            ax = axes[i][j] if n > 1 else axes
            ax.set_facecolor('#020a02')
            if i == j:
                ax.hist(df[ci].dropna(), bins=15, color=C1, alpha=0.65, edgecolor='#003a0f')
            else:
                ax.scatter(df[cj], df[ci], alpha=0.4, s=6, color=C2)
            ax.grid(True, color=GRID, linewidth=0.3)
            ax.tick_params(colors='#3a5a3a', labelsize=6)
            if i == n-1: ax.set_xlabel(cj, color='#7fff7f', fontsize=7)
            if j == 0:   ax.set_ylabel(ci, color='#7fff7f', fontsize=7)

    fig.suptitle('PAIR PLOT', color=C1, fontsize=11, y=1.01)
    plt.tight_layout()
    save_fig()`,
    },
    {
      title: "13. Joint Plot",
      explanation: "Scatter + marginal histograms for two numeric columns.\nReveals bivariate distribution and each variable's marginal density.",
      code: `${imgSetup}
import numpy as np

num_cols = df.select_dtypes(include='number').columns
if len(num_cols) < 2:
    print(">> NEED AT LEAST 2 NUMERIC COLUMNS")
else:
    xc, yc = num_cols[0], num_cols[1]
    xv = df[xc].dropna().values[:500]
    yv = df[yc].dropna().values[:500]
    n  = min(len(xv), len(yv))
    xv, yv = xv[:n], yv[:n]

    fig = plt.figure(figsize=(8, 8))
    fig.patch.set_facecolor(BG)
    gs = fig.add_gridspec(2, 2, width_ratios=[4,1], height_ratios=[1,4], hspace=0.05, wspace=0.05)

    ax_top  = fig.add_subplot(gs[0,0])
    ax_main = fig.add_subplot(gs[1,0])
    ax_rgt  = fig.add_subplot(gs[1,1])

    for ax in [ax_top, ax_main, ax_rgt]:
        ax.set_facecolor('#020a02')

    ax_main.scatter(xv, yv, alpha=0.45, s=8, color=C1)
    ax_main.set_xlabel(xc, color='#7fff7f')
    ax_main.set_ylabel(yc, color='#7fff7f')
    ax_main.tick_params(colors='#3a5a3a')
    ax_main.grid(True, color=GRID, linewidth=0.4)

    ax_top.hist(xv, bins=20, color=C1, alpha=0.65); ax_top.axis('off')
    ax_rgt.hist(yv, bins=20, color=C2, alpha=0.65, orientation='horizontal'); ax_rgt.axis('off')

    fig.suptitle(f'JOINT PLOT: {xc.upper()} vs {yc.upper()}', color=C1, fontsize=10)
    save_fig()`,
    },
    {
      title: "14. Custom Code",
      explanation: "Write your own Python code.\nThe DataFrame 'df' is available. pandas, numpy, matplotlib, scipy all loaded.",
      code: `# ══════════════════════════════
# CUSTOM ANALYSIS CELL
# DataFrame 'df' is available.
# ══════════════════════════════

print("Columns:", list(df.columns))
print("Shape  :", df.shape)

# Example: print first 5 rows
print()
print(df.head().to_string())`,
    },
  ];
}

export default function NotebookViewer({ csvData, fileName, numericCols, categoricalCols }: Props) {
  const { status, loadPyodide, runCode } = usePyodide();
  const [allRunning, setAllRunning] = useState(false);

  const cells = buildCells(fileName, numericCols, categoricalCols);

  async function runCell(code: string): Promise<string> {
    if (status !== "ready") return "Error: Pyodide not loaded. Click LOAD PYTHON first.";
    return runCode(code, csvData, fileName);
  }

  function downloadIpynb() {
    const notebook = {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
        language_info: { name: "python", version: "3.11.0" },
      },
      cells: cells.map((cell) => ({
        cell_type: "code",
        source: cell.code,
        metadata: { tags: [], title: cell.title },
        outputs: [],
        execution_count: null,
      })),
    };
    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.csv$/i, "") + ".ipynb";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* ── Retro notebook toolbar ── */}
      <div className="card mb-6 p-0 overflow-hidden">
        {/* Title bar */}
        <div style={{ background:"var(--green)", padding:"6px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"#0a0a0a" }}>
            PYTHON NOTEBOOK
          </span>
          <span style={{ fontFamily:"'Courier New',monospace", fontSize:11, color:"rgba(0,0,0,0.55)", marginLeft:"auto" }}>
            {fileName.toUpperCase()}  ·  {cells.length} CELLS
          </span>
        </div>

        {/* Status row */}
        <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Courier New',monospace", fontSize:12, color:"var(--text-dim)" }}>
              RUNTIME STATUS:&nbsp;
              <span style={{
                color: status === "ready" ? "var(--green)" : status === "loading" ? "var(--amber)" : status === "error" ? "var(--error)" : "var(--text-dim)",
                textShadow: status === "ready" ? "var(--glow-green)" : undefined,
              }}>
                {status.toUpperCase()}
              </span>
            </p>
            <p style={{ fontFamily:"'VT323',monospace", fontSize:14, color:"var(--text-dim)" }}>
              PYODIDE 0.25.0  ·  PANDAS  ·  NUMPY  ·  MATPLOTLIB  ·  SCIPY
            </p>
          </div>

          {status !== "ready" && (
            <button
              onClick={loadPyodide}
              disabled={status === "loading"}
              className="btn-primary"
              style={{ fontSize:8 }}
            >
              {status === "loading" ? (
                <><span className="spinner" style={{ width:10, height:10 }} />&nbsp;LOADING<span className="loading-text" style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8 }} /></>
              ) : status === "error" ? (
                "&gt; RETRY LOAD"
              ) : (
                "&gt; LOAD PYTHON"
              )}
            </button>
          )}
          {status === "ready" && (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--green)", boxShadow:"var(--glow-green)", display:"inline-block" }} />
              <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"var(--green)", textShadow:"var(--glow-green)" }}>
                ONLINE
              </span>
            </div>
          )}
          <button onClick={downloadIpynb} className="btn-secondary" style={{ fontSize:7 }}>
            &gt; DOWNLOAD .ipynb
          </button>
        </div>
      </div>

      {/* Loading hint */}
      {status === "loading" && (
        <div className="card p-5 text-center mb-5 fade-in">
          <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"var(--amber)", marginBottom:8 }}
             className="loading-text">BOOTING PYTHON RUNTIME</p>
          <p style={{ fontFamily:"'VT323',monospace", fontSize:16, color:"var(--text-dim)" }}>
            DOWNLOADING PYODIDE + PANDAS + NUMPY + MATPLOTLIB + SCIPY
          </p>
          <p style={{ fontFamily:"'VT323',monospace", fontSize:14, color:"var(--text-dim)", marginTop:4 }}>
            30-60 SECONDS ON FIRST LOAD — CACHED AFTERWARD
          </p>
        </div>
      )}

      {/* Cells */}
      {cells.map((cell, i) => (
        <CodeCell key={i} index={i} title={cell.title} code={cell.code}
          explanation={cell.explanation} onRun={runCell} />
      ))}

      {/* Footer tip */}
      <div style={{ marginTop:8, padding:"6px 14px", borderTop:"1px dashed var(--green-dim)" }}>
        <p style={{ fontFamily:"'VT323',monospace", fontSize:14, color:"var(--text-dim)" }}>
          TIP: CLICK EXPLAIN ON ANY CELL FOR A LINE-BY-LINE BREAKDOWN. EDITS TO CODE ARE LIVE.
        </p>
      </div>

      {void allRunning}
    </div>
  );
}
