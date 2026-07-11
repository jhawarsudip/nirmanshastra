'use client'

import dynamic from 'next/dynamic'
import {
  MassingPreviewContainer,
  LoadingSlot,
} from '@/components/3d/MassingPreviewWrapper'
import type { FloorDatum } from '@/components/3d/types'

const MasonryMassingPreview3D = dynamic(() => import('./MassingPreview3D'), {
  ssr: false,
  loading: () => <LoadingSlot />,
})

interface Props {
  floors: FloorDatum[]
}

export default function MasonryMassingPreview3DWrapper({ floors }: Props) {
  return (
    <MassingPreviewContainer>
      <MasonryMassingPreview3D floors={floors} />
    </MassingPreviewContainer>
  )
}
