import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
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
        className={`${hankenGrotesk.className} bg-[#121314] text-white antialiased`}
      >
        <ClerkProvider>
          <Navbar />
          <main className="pt-[72px]">{children}</main>
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
