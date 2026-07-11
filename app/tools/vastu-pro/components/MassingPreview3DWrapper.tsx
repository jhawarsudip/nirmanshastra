'use client'

import dynamic from 'next/dynamic'
import {
  MassingPreviewContainer,
  LoadingSlot,
} from '@/components/3d/MassingPreviewWrapper'

const VastuMassingPreview3D = dynamic(() => import('./MassingPreview3D'), {
  ssr: false,
  loading: () => <LoadingSlot />,
})

interface Props {
  northDeg: number
}

export default function VastuMassingPreview3DWrapper({ northDeg }: Props) {
  return (
    <MassingPreviewContainer>
      <VastuMassingPreview3D northDeg={northDeg} />
    </MassingPreviewContainer>
  )
}
