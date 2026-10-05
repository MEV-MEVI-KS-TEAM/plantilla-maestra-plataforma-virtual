import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'

/** `CONFIG.firmante` (opcional, #254): constancia y recibo con nombre y cargo; sin la clave, lo de fábrica. */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

test('1. la plantilla no declara firmante: constancia «Dirección Académica» y recibo sin firma', () => {
  expect((CONFIG as { firmante?: unknown }).firmante).toBeUndefined()
  const c = leer('src/app/(dashboard)/alumno/constancia/page.tsx')
  expect(c).toContain("{FIRMANTE?.cargo?.trim() || 'Dirección Académica'}")
})

test('2. el recibo pinta «Nombre — Cargo» solo si hay firmante', () => {
  const r = leer('src/lib/pdf/recibo-pago.tsx')
  expect(r).toContain(".filter(Boolean).join(' — ')")
  expect(r).toContain("{LINEA_FIRMANTE !== '' && <Text style={styles.firmante}>{LINEA_FIRMANTE}</Text>}")
})
