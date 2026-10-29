'use client'

import { createContext, useContext } from 'react'
import type { DesgloseLicenciatura } from '@/lib/licenciatura-utils'

/**
 * El desglose de los planes de licenciatura con la tabla EFECTIVA (config.ts +
 * lo publicado en «Personalizar mi página»). Lo calcula el servidor en
 * `register/layout.tsx`: el config público del navegador no lleva los precios
 * de licenciatura. Vacío fuera de una escuela Solo-Licenciaturas.
 */
const Ctx = createContext<readonly DesgloseLicenciatura[]>([])

export function DesgloseLicenciaturaProvider({ value, children }: { value: readonly DesgloseLicenciatura[]; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDesgloseLicenciatura(): readonly DesgloseLicenciatura[] {
  return useContext(Ctx)
}
