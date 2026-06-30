import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NirmanShastra — Build With Certainty',
    short_name: 'NirmanShastra',
    description: "India's first IS-code construction cost estimation platform",
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
