'use client'

import dynamic from 'next/dynamic'
import {
  MassingPreviewContainer,
  LoadingSlot,
} from '@/components/3d/MassingPreviewWrapper'
import type { FloorDatum } from '@/components/3d/types'

const ElectroMassingPreview3D = dynamic(() => import('./MassingPreview3D'), {
  ssr: false,
  loading: () => <LoadingSlot />,
})

interface Props {
  floors: FloorDatum[]
  dbPanelPerFloor: boolean
}

export default function ElectroMassingPreview3DWrapper({ floors, dbPanelPerFloor }: Props) {
  return (
    <MassingPreviewContainer>
      <ElectroMassingPreview3D floors={floors} dbPanelPerFloor={dbPanelPerFloor} />
    </MassingPreviewContainer>
  )
}
