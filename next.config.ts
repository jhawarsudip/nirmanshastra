import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // the finish-tier cost calculator became the paint and tile quantity calculator
      { source: '/tools/finish-tier-cost-calculator', destination: '/tools/paint-tile-calculator', permanent: true },
    ]
  },
}

export default withNextIntl(nextConfig)
