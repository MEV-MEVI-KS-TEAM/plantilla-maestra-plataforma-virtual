import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * "Regenerar calendario" en /admin/cobranza (Fase 2, F2-2).
 *
 * La RPC borra las semanas PENDIENTES y VENCIDAS del alumno y las vuelve a crear
 * con la cuota que haya en `ajustes` en ese momento (migración
 * 20260910130000_periodicidad_semanal.sql). Desde el Bug 165 esa cuota es la
 * PUBLICADA en Personalizar mi página, así que regenerar a un alumno inscrito
 * puede cambiarle el monto de lo que aún debe. El aviso tiene que salir ANTES
 * de pedir la fecha y de llamar a la API, no en el mensaje de éxito.
 *
 * Se revisa el fuente, como corregir-plan.spec.ts: la página es un componente
 * de cliente con `window.confirm`/`window.prompt`, sin lógica pura que probar.
 */

const raiz = process.cwd()
const leer = (p: string) => readFileSync(join(raiz, p), 'utf8').replace(/\r\n/g, '\n')
const PAGINA = 'src/app/(dashboard)/admin/cobranza/page.tsx'

/**
 * El manejador de "Regenerar": desde el `window.confirm` más cercano ANTES de
 * la acción `regenerar` hasta la acción misma. La página tiene otros `prompt`
 * (pagar, condonar), así que se ancla hacia atrás desde la acción.
 */
function manejadorRegenerar() {
  const fuente = leer(PAGINA)
  const accion = fuente.indexOf("accion: 'regenerar'")
  const confirm = fuente.lastIndexOf('window.confirm(', accion)
  const prompt = fuente.lastIndexOf('window.prompt(', accion)
  return { fuente, accion, confirm, prompt, bloque: fuente.slice(confirm, accion) }
}

test('1. el aviso va ANTES de pedir la fecha y de regenerar, y cancelarlo corta', () => {
  const { fuente, accion, confirm, prompt, bloque } = manejadorRegenerar()
  expect(accion, 'no se encontró la acción regenerar').toBeGreaterThan(-1)
  expect(confirm, 'regenerar sin window.confirm').toBeGreaterThan(-1)
  expect(prompt).toBeGreaterThan(confirm)
  expect(accion).toBeGreaterThan(prompt)
  // Mismo manejador: entre el confirm y la acción no empieza otro onClick.
  expect(bloque).not.toContain('onClick')
  // "Cancelar" en el aviso no pide fecha ni llama a la API: `if (!confirm(…)) return`
  // y lo siguiente ya es el prompt de la fecha.
  expect(fuente.slice(confirm - 'if (!'.length, confirm)).toBe('if (!')
  expect(fuente.slice(confirm, prompt)).toMatch(/\)\)\s*return\s*\n\s*const f = $/)
})

test('2. el aviso dice qué se recalcula y con qué cuota', () => {
  const { fuente, confirm, prompt } = manejadorRegenerar()
  const aviso = fuente.slice(confirm, prompt)
  expect(aviso).toContain('PENDIENTES y VENCIDAS')
  expect(aviso).toContain('cuota semanal vigente')
  expect(aviso).toContain('pagadas o condonadas no cambian')
  expect(aviso).toContain('plan a medida')
})

test('3. la fecha sigue siendo "vacío = hoy" y el éxito ya no promete de más', () => {
  const { fuente, accion, bloque } = manejadorRegenerar()
  expect(bloque).toContain('Fecha de la SEMANA 1 (AAAA-MM-DD). Vacío = hoy.')
  // Vacío sigue mandando "sin fecha" y la RPC usa hoy.
  expect(fuente.slice(accion, accion + 80)).toContain('fecha_inicio: f.trim() || undefined')
  expect(fuente).toContain(
    'Calendario regenerado: las semanas pendientes y vencidas quedaron con la cuota vigente. Las pagadas y condonadas no cambiaron.',
  )
  // Los textos viejos decían solo lo que se conservaba, no lo que se recalculaba.
  expect(fuente).not.toContain('Fecha de inicio del calendario (AAAA-MM-DD). Vacío = hoy:')
  expect(fuente).not.toContain('Calendario regenerado. Las semanas ya pagadas o condonadas se conservaron.')
})
