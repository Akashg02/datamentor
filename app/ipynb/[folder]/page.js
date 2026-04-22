"use client";
import { useEffect, useState } from "react";
import NotebookViewer from "@/components/NotebookViewer";

export default function IpynbPage() {
  const [ready, setReady] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [fileName, setFileName] = useState("notebook.csv");
  const [numericCols, setNumericCols] = useState([]);
  const [categoricalCols, setCategoricalCols] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("datamentor_works") || "[]");
      if (saved.length > 0) {
        const work = saved[0];
        setCsvData(work.csvData || "");
        setFileName(work.fileName || "notebook.csv");
      }
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:10, color:"#00ff41" }}>LOADING...</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", padding:"24px 16px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, color:"#00ff41", marginBottom:16 }}>
          /IPYNB/NOTEBOOK
        </p>
        <NotebookViewer
          csvData={csvData}
          fileName={fileName}
          numericCols={numericCols}
          categoricalCols={categoricalCols}
        />
      </div>
    </div>
  );
}
