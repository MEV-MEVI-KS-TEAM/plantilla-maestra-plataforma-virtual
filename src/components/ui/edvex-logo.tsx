'use client'

import Image from 'next/image'
// Logo y nombre son editables desde el panel (F1): se leen del provider, no
// de CONFIG, para que el cambio del admin llegue sin redeploy.
import { useSiteConfig } from '@/components/site-config-provider'

interface IVSLogoProps {
  size?: number
  innerFill?: string  // kept for API compatibility, unused
}

export function EdvexLogo({ size = 36 }: IVSLogoProps) {
  const cfg = useSiteConfig()
  return (
    <Image
      src={cfg.logo}
      alt={cfg.nombreCompleto}
      width={size}
      height={size}
      style={{ objectFit: 'contain', borderRadius: 6 }}
    />
  )
}
