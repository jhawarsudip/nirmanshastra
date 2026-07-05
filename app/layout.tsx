import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Serif,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Devanagari,
  Fraunces,
  Public_Sans,
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

// Homepage editorial fonts — Fraunces (display serif) + Public Sans (body)
// Loaded globally for performance; applied only in app/page.tsx
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nirmanshastra.in'),
  title: {
    default: "NirmanShastra — IS-Code Construction Cost Estimator | Stop Contractor Overcharging",
    template: "%s | NirmanShastra",
  },
  description: "Get exact material quantities and IS-code verified construction cost estimates for your home. StructurePro, MasonryPro, ElectricalPro tools. ₹499/report, homeowners across India.",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NirmanShastra',
  },
  icons: {
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://nirmanshastra.in',
    siteName: 'NirmanShastra',
    title: "NirmanShastra — IS-Code Construction Cost Estimator | Stop Contractor Overcharging",
    description: "Get exact material quantities and IS-code verified construction cost estimates for your home. StructurePro, MasonryPro, ElectricalPro tools. ₹499/report, homeowners across India.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — India’s IS-Code Construction Cost Estimator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NirmanShastra — IS-Code Construction Cost Estimator",
    description: "Exact material quantities and IS-code verified construction cost estimates for Indian homeowners. ₹499/report.",
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
        className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable} ${plexDevanagari.variable} ${fraunces.variable} ${publicSans.variable} antialiased`}
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
