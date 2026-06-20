import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import SmartAppBanner from "@/components/SmartAppBanner";
import { hankenGrotesk, jetbrainsMono, spaceGrotesk } from "@/app/ui/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${hankenGrotesk.variable}`}
    >
      <body
        className={`${hankenGrotesk.className} bg-surface text-foreground antialiased`}
      >
        <ClerkProvider>
          <Navbar />
          <SmartAppBanner />
          <main className="pt-[var(--viewport-top)]">{children}</main>
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
