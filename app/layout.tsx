import type { Metadata } from "next";
import {
  IBM_Plex_Serif,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexDevanagari = IBM_Plex_Sans_Devanagari({
  variable: "--font-plex-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NirmanShastra — Build With Certainty",
  description: "India's IS-code backed construction cost estimation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable} ${plexDevanagari.variable} antialiased`}
      >
        {/* Announcement bar */}
        <div style={{ background: '#1F4E79' }}>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: '#F4F4F0', letterSpacing: '0.03em', textAlign: 'center', padding: '10px 16px', fontWeight: 500 }}>
            NirmanShastra — India&rsquo;s first IS-code construction cost estimation platform
          </p>
        </div>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
