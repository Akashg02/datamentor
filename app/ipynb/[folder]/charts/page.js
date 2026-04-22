"use client";
import { useEffect, useState } from "react";
import CsvVisualizations from "@/components/CsvVisualizations";
import { processCSVData } from "@/lib/chartDataProcessor";
import Papa from "papaparse";

export default function IpynbChartsPage() {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("datamentor_works") || "[]");
      if (saved.length > 0) {
        const work = saved[0];
        if (work.csvData) {
          Papa.parse(work.csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              setData(processCSVData(result.data));
              setReady(true);
            },
          });
          return;
        }
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
      <div style={{ maxWidth:1400, margin:"0 auto" }}>
        <p style={{ fontFamily:"'Press Start 2P',monospace", fontSize:9, color:"#00ff41", marginBottom:16 }}>
          /IPYNB/CHARTS
        </p>
        {data ? <CsvVisualizations data={data} /> : (
          <p style={{ fontFamily:"'VT323',monospace", fontSize:20, color:"rgba(0,255,65,0.5)", textAlign:"center", marginTop:80 }}>
            NO SAVED DATA FOUND — SAVE A CSV FROM THE MAIN APP FIRST
          </p>
        )}
      </div>
    </div>
  );
}
