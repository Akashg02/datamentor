"use client";
import { useState, useRef, useCallback } from "react";

type PyodideStatus = "idle" | "loading" | "ready" | "error";

interface UsePyodideReturn {
  status: PyodideStatus;
  loadPyodide: () => Promise<void>;
  runCode: (code: string, csvData?: string, fileName?: string) => Promise<string>;
}

declare global {
  interface Window {
    loadPyodide: (opts: { indexURL: string }) => Promise<unknown>;
    _pyodideInstance: unknown;
  }
}

export function usePyodide(): UsePyodideReturn {
  const [status, setStatus] = useState<PyodideStatus>("idle");
  const pyRef = useRef<unknown>(null);

  const loadPyodide = useCallback(async () => {
    if (status === "ready" || status === "loading") return;
    setStatus("loading");

    try {
      if (window._pyodideInstance) {
        pyRef.current = window._pyodideInstance;
        setStatus("ready");
        return;
      }

      // Load Pyodide script
      await new Promise<void>((resolve, reject) => {
        if (document.getElementById("pyodide-script")) { resolve(); return; }
        const script = document.createElement("script");
        script.id = "pyodide-script";
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });

      const py = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      });

      // Load required packages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (py as any).loadPackage(["pandas", "numpy", "matplotlib", "scipy"]);

      window._pyodideInstance = py;
      pyRef.current = py;
      setStatus("ready");
    } catch (err) {
      console.error("Pyodide load error:", err);
      setStatus("error");
    }
  }, [status]);

  const runCode = useCallback(
    async (code: string, csvData?: string, fileName = "data.csv"): Promise<string> => {
      if (!pyRef.current) {
        return "Error: Pyodide is not loaded. Click 'Load Python' first.";
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const py = pyRef.current as any;
      try {
        // Inject CSV data as a global variable
        if (csvData) {
          py.globals.set("__csv_data__", csvData);
          py.globals.set("__csv_filename__", fileName);
        }

        // Redirect stdout
        py.runPython(`
import sys
import io
__stdout__ = io.StringIO()
sys.stdout = __stdout__
`);

        py.runPython(code);

        // Capture output
        const output: string = py.runPython(`
sys.stdout = sys.__stdout__
__stdout__.getvalue()
`);
        return output || "(no output)";
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errMsg = err instanceof Error ? err.message : String((err as any));
        try { py.runPython("import sys; sys.stdout = sys.__stdout__"); } catch {}
        return `Error:\n${errMsg}`;
      }
    },
    []
  );

  return { status, loadPyodide, runCode };
}
