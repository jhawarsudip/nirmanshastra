import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NirmanShastra — Build With Certainty',
    short_name: 'NirmanShastra',
    description: "Material quantities for Indian homes, worked out to the Indian Standards: structure, masonry, electrical, plumbing and interior, each with the clause behind it",
    start_url: '/',
    display: 'standalone',
    background_color: '#F3EEE2',
    theme_color: '#F3EEE2',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
