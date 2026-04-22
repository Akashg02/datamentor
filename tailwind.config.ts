import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        green:  "var(--green)",
        cyan:   "var(--cyan)",
        amber:  "var(--amber)",
        error:  "var(--error)",
        panel:  "var(--bg-panel)",
      },
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
        vt:    ["'VT323'", "'Courier New'", "monospace"],
        mono:  ["'Courier New'", "monospace"],
      },
      boxShadow: {
        pixel:       "4px 4px 0 var(--green-dk)",
        "pixel-sm":  "2px 2px 0 var(--green-dk)",
        glow:        "0 0 8px var(--green), 0 0 20px rgba(0,255,65,0.3)",
        "glow-cyan": "0 0 8px var(--cyan), 0 0 18px rgba(0,207,255,0.3)",
      },
      borderColor: {
        DEFAULT: "var(--green-dim)",
        green:   "var(--green)",
        dim:     "var(--green-dim)",
        cyan:    "var(--cyan)",
        error:   "var(--error)",
      },
    },
  },
  plugins: [],
};
export default config;
