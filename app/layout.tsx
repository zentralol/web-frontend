import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { inter } from "@/app/ui/fonts"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Navbar />
      <body className = {`${inter.className} antialiased`}>{children}</body>
      <SpeedInsights />
    </html>
  );
}
