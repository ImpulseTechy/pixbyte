import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SerialProvider } from "@/context/SerialContext";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
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
