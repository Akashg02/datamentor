import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DATAMENTOR v1.0 — CSV Intelligence",
  description: "In-browser CSV analysis with Python notebook, 10 chart types, domain-aware insights, and Firebase sync.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
