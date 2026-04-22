# DataMentor — CSV Analytics Platform

A retro-themed CSV analytics platform built with Next.js 14. Upload any CSV and get automatic data cleaning, 10 interactive visualizations, and a 14-cell in-browser Python notebook powered by Pyodide.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The Python runtime (Pyodide) downloads ~30 MB on first use. It is cached afterward.

---

## Course Requirements Met

| Requirement | Implementation |
|---|---|
| CSV ingestion | Papa Parse — drag-and-drop or click-to-browse |
| Data cleaning pipeline | Null removal, dedup, header normalization, sanitization |
| Cleaning step selection | Checkboxes on CLEAN tab — choose which steps to include |
| 10 chart types | Bar, Line, Scatter, Pie/Doughnut, Histogram, Box, Violin, Heat Map, Pair Plot, Joint Plot |
| In-browser Python | Pyodide 0.25.0 — pandas, numpy, matplotlib, scipy |
| 14 notebook cells | Load → Info → Describe → Nulls → Dupes → Corr → Counts → Dist → Pie → Violin → Heatmap → Pair → Joint → Custom |
| Download notebook | DOWNLOAD .ipynb button exports Jupyter-compatible JSON |
| Tutorial viewer | TUTORIAL tab — upload any .ipynb and browse cells with explanations |
| Saved workspaces | localStorage — save/load/delete CSV sessions, no login required |
| Route structure | `/` main app · `/administrator` admin view · `/ipynb/[folder]` notebook · `/ipynb/[folder]/charts` charts |

---

## Dataset: Fake Job Postings

The platform is designed and tested with the **Fake Job Postings** dataset (from Kaggle / course materials).

**Relevant columns used by cleaning steps:**

| Column | Cleaning Step |
|---|---|
| `location` | `split_location` — splits `"City, State"` into `city` + `state` |
| `salary_range` | `parse_salary` — extracts numeric `salary_min` and `salary_max` |
| `telecommuting`, `has_company_logo`, `has_questions`, `fraudulent` | `normalize_binary` — maps `1/0` or `yes/no` → integer |
| All text columns | `normalize_text` — strips whitespace, lowercases |
| All rows | `drop_duplicates` — removes exact duplicate rows |

**To use it:**
1. Download `fake_job_postings.csv` from your course materials
2. Open [http://localhost:3000](http://localhost:3000)
3. Drag the CSV into the upload zone
4. Select cleaning steps on the CLEAN tab → click **RUN PIPELINE**
5. Open **NOTEBOOK** tab → click **LOAD PYTHON** → run cells individually

---

## Features

- **CRT retro aesthetic** — matrix green (#00ff41) on near-black (#0a0a0a), scanline overlay, screen flicker
- **Press Start 2P + VT323** Google Fonts for terminal feel
- **No cloud dependencies** — all data stays in your browser (localStorage)
- **Pyodide runtime** — full CPython 3.11 in the browser, no server needed

---

## Tech Stack

- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Chart.js 4 + react-chartjs-2
- Papa Parse (CSV parsing)
- Pyodide 0.25.0 (in-browser Python)

---

## Routes

| URL | Page |
|---|---|
| `/` | Main app (upload → clean → notebook → visualize) |
| `/administrator` | Administrator dashboard |
| `/ipynb/[folder]` | Notebook viewer (loads last saved CSV) |
| `/ipynb/[folder]/charts` | Chart viewer (loads last saved CSV) |
| `/tutorial` | Access via TUTORIAL tab in the main nav |
