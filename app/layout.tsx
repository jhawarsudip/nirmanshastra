import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Serif,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar"
import AIChatbox from "@/app/components/AIChatbox";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";

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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NirmanShastra',
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1E2227',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
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
        <div style={{ background: '#1F4E79', border: 'none', borderTop: 'none', borderBottom: 'none', outline: 'none', boxShadow: 'none' }}>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: '#ffffff', letterSpacing: '0.02em', textAlign: 'center', padding: '14px 24px', fontWeight: 500, margin: 0, border: 'none', outline: 'none', boxShadow: 'none' }}>
            NirmanShastra — India&rsquo;s first IS-code construction cost estimation and professional BOQ generation platform
          </p>
        </div>
        <Navbar />
        {children}
        <AIChatbox />
        <InstallPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
