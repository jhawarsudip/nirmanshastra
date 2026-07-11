'use client'

import dynamic from 'next/dynamic'
import {
  MassingPreviewContainer,
  LoadingSlot,
} from '@/components/3d/MassingPreviewWrapper'
import type { FloorDatum } from '@/components/3d/types'
import type { InteriorGrade } from '../interiorpro-engine'

const InteriorMassingPreview3D = dynamic(() => import('./MassingPreview3D'), {
  ssr: false,
  loading: () => <LoadingSlot />,
})

interface Props {
  floors: FloorDatum[]
  grade: InteriorGrade
}

export default function InteriorMassingPreview3DWrapper({ floors, grade }: Props) {
  return (
    <MassingPreviewContainer>
      <InteriorMassingPreview3D floors={floors} grade={grade} />
    </MassingPreviewContainer>
  )
}
