import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SerialProvider } from "@/context/SerialContext";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// Resolve the absolute origin so og:image / twitter:image links work when
// scrapers (LinkedIn, X, WhatsApp) fetch the page. Vercel auto-populates
// VERCEL_PROJECT_PRODUCTION_URL on every deploy.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "0x1306 — oled animations for esp32",
  description: "open source oled animation tool for esp32 makers. browse, preview and generate C++/MicroPython schemas.",
  openGraph: {
    images: ["/og-image.jpg"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.className} antialiased`}>
        <SerialProvider>
          {children}
        </SerialProvider>
      </body>
    </html>
  );
}
