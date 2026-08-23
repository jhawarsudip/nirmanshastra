import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NirmanShastra — Build With Certainty',
    short_name: 'NirmanShastra',
    description: "IS-code-traceable construction cost estimation and professional BOQ generation for Indian homes — every quantity tied to a BIS/IS clause, across structure, masonry, electrical, plumbing, and interior",
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F4F0',
    theme_color: '#1E2227',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
