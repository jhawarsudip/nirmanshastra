'use client'

import dynamic from 'next/dynamic'
import {
  MassingPreviewContainer,
  LoadingSlot,
} from '@/components/3d/MassingPreviewWrapper'
import type { FloorDatum } from '@/components/3d/types'

const PlumbMassingPreview3D = dynamic(() => import('./MassingPreview3D'), {
  ssr: false,
  loading: () => <LoadingSlot />,
})

interface Props {
  floors: FloorDatum[]
  numBathrooms: number
}

export default function PlumbMassingPreview3DWrapper({ floors, numBathrooms }: Props) {
  return (
    <MassingPreviewContainer>
      <PlumbMassingPreview3D floors={floors} numBathrooms={numBathrooms} />
    </MassingPreviewContainer>
  )
}
