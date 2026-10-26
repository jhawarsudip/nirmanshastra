import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Serif,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Devanagari,
  Fraunces,
  Public_Sans,
  Playfair_Display,
  Inter,
} from "next/font/google";
import "./globals.css";
import { PRICE } from "@/lib/tool-pricing";
import AIChatbox from "@/app/components/AIChatbox";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import Analytics from "@/components/analytics/Analytics";
import WhatsAppButton from "@/components/social/WhatsAppButton";
import InstallPrompt from "@/components/InstallPrompt";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  preload: false,
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  preload: false,
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
  preload: false,
  subsets: ["devanagari"],
  weight: ["400", "500"],
});

// Homepage editorial fonts — Fraunces (display serif) + Public Sans (body)
// Loaded globally for performance; applied only in app/page.tsx
const fraunces = Fraunces({
  variable: "--font-fraunces",
  preload: false,
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  preload: false,
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nirmanshastra.in'),
  title: {
    default: "NirmanShastra — IS-Code Material Quantity Estimator for Indian Homes",
    template: "%s | NirmanShastra",
  },
  description: `Work out how much concrete, steel, cement, bricks, sand, wire and pipe your house needs, to the Indian Standards, before you order. Quantity reports from ${PRICE.from} and free calculators, in Hindi and English.`,
  alternates: {
    canonical: './',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NirmanShastra',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.nirmanshastra.in',
    siteName: 'NirmanShastra',
    title: "NirmanShastra — IS-Code Material Quantity Estimator for Indian Homes",
    description: `Work out how much concrete, steel, cement, bricks, sand, wire and pipe your house needs, to the Indian Standards, before you order. Quantity reports from ${PRICE.from} and free calculators, in Hindi and English.`,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NirmanShastra — IS-Code Material Quantity Estimator for Indian Homes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NirmanShastra — IS-Code Material Quantity Estimator",
    description: `Exact material quantities for Indian homes, worked out to the IS codes. Quantity reports from ${PRICE.from}.`,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3EEE2' },
    { media: '(prefers-color-scheme: dark)', color: '#262523' },
  ],
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
    <html suppressHydrationWarning lang="en">
      <body
        className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable} ${plexDevanagari.variable} ${fraunces.variable} ${publicSans.variable} ${playfair.variable} ${inter.variable} antialiased`}
      >
        {/* Site-wide structured data: Organization + WebSite */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
        <AIChatbox />
        {/* floating WhatsApp button, bottom-left; the chat above is bottom-right */}
        <WhatsAppButton />
        <InstallPrompt />
        <ServiceWorkerRegistration />
        {/* Consent banner, and GA4 / Clarity / Meta Pixel after the visitor accepts (nothing loads before) */}
        <Analytics />
      </body>
    </html>
  );
}
