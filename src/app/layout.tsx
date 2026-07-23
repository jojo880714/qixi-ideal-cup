import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

export const metadata: Metadata = {
  // Absolute base for OG images / canonical URLs. Resolves to
  // NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost (see lib/siteUrl).
  metadataBase: new URL(getSiteUrl()),
  title: "七夕理想型世界盃｜單身限定",
  description: "從上百個理想型條件一路淘汰到底，測出你最在意什麼——貼出來，讓符合的人自己來找你。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;800;900&family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
