import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { queAbre, type FilaCursoAlumno, type PrecargaCobro } from '@/lib/cursos/cobro'
import { accesoDeCurso, precioDeReferencia } from '@/components/admin/alumnos/CursosDelAlumno'

/**
 * Bloque D · D17 — #207-6: la tarjeta «Cursos» de la ficha, el modal «Cobrar»
 * y «¿A qué se aplica?» en el modal del programa (decisiones 1, 4, 6 y 10).
 * Escribe por POST /pago → curso_cobrar (D16).
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const pre = (o: Partial<PrecargaCobro>): PrecargaCobro => ({
  concepto: 'curso_mensualidad', monto: 1500, mes: 2, puedeAbrir: true, abrirPorDefecto: true, regla: 'mes1', aviso: null, ...o,
})

test('1. qué abre la casilla: solo con ESE concepto y ese mes; «todo» pide doble confirmación', () => {
  expect(queAbre({ por_activar: false, precarga: pre({}) }, 'curso_mensualidad', 2)).toEqual({ texto: 'Abrir el mes 2', todo: false })
  // Otro mes u otro concepto que la precarga: no hay casilla (la base lo rechazaría).
  expect(queAbre({ por_activar: false, precarga: pre({}) }, 'curso_mensualidad', 3)).toBeNull()
  expect(queAbre({ por_activar: false, precarga: pre({}) }, 'curso_otro', null)).toBeNull()
  expect(queAbre({ por_activar: false, precarga: pre({ puedeAbrir: false }) }, 'curso_mensualidad', 2)).toBeNull()
  expect(queAbre({ por_activar: false, precarga: pre({ concepto: 'curso_pago_unico', mes: null, regla: 'total' }) }, 'curso_pago_unico', null))
    .toEqual({ texto: 'Abrir TODO el curso (pago único)', todo: true })
  // Por activar: la activación según la ficha.
  expect(queAbre({ por_activar: true, precarga: pre({ concepto: 'curso_pago_unico', mes: null, regla: 'total' }) }, 'curso_pago_unico', null))
    .toEqual({ texto: 'Activar según la ficha: abre TODO el curso', todo: true })
  expect(queAbre({ por_activar: true, precarga: pre({ concepto: 'curso_inscripcion', mes: null, regla: 'mes1' }) }, 'curso_inscripcion', null))
    .toEqual({ texto: 'Activar según la ficha: abre el mes 1', todo: false })
})

test('2. la tarjeta: acceso y precio de referencia con su origen', () => {
  expect(accesoDeCurso({ estado: 'activa', acceso_total: true, meses_desbloqueados: 0, por_activar: false })).toBe('Acceso total')
  expect(accesoDeCurso({ estado: 'activa', acceso_total: false, meses_desbloqueados: 0, por_activar: true })).toBe('Por activar')
  expect(accesoDeCurso({ estado: 'activa', acceso_total: false, meses_desbloqueados: 1, por_activar: false })).toBe('1 mes abierto')
  expect(accesoDeCurso({ estado: 'activa', acceso_total: false, meses_desbloqueados: 3, por_activar: false })).toBe('3 meses abiertos')
  expect(accesoDeCurso({ estado: 'cancelada', acceso_total: false, meses_desbloqueados: 3, por_activar: false })).toBe('Cancelada')
  const fmt = (n: number) => `$${n}`
  const resumen = { tipo: 'unico', regla: 'total', pagado: 0, saldo: 2490, mesesCubiertos: [], pagadoFaltaAbrir: false } as FilaCursoAlumno['resumen']
  expect(precioDeReferencia({ precio_referencia: { inscripcion: 2490, mensualidad: 0, origen: 'inscripcion' }, resumen }, fmt)).toBe('$2490 pago único · precio al asignar')
  expect(precioDeReferencia({ precio_referencia: { inscripcion: 500, mensualidad: 1500, origen: 'ficha' }, resumen: { ...resumen, tipo: 'mensual' } }, fmt))
    .toBe('$500 + $1500/mes · ficha de hoy')
  expect(precioDeReferencia({ precio_referencia: { inscripcion: 0, mensualidad: 0, origen: 'ficha' }, resumen: { ...resumen, tipo: 'informes' } }, fmt))
    .toBe('Sin precio en la ficha de hoy')
  expect(precioDeReferencia({ precio_referencia: { inscripcion: 0, mensualidad: 0, origen: 'inscripcion' }, resumen: { ...resumen, tipo: 'informes' } }, fmt))
    .toBe('Sin precio al asignar')
})

test('3. el modal: un pago_id por apertura, lo que la pantalla vio, la casilla que sigue al monto y la doble confirmación', () => {
  const m = sinComentarios(leer('src/components/admin/alumnos/CobrarCursoModal.tsx'))
  expect(m).toContain('const [pagoId] = useState(nuevoId)')
  expect(m).toContain('fetch(`/api/admin/inscripciones/${fila.inscripcion_id}/pago`, {')
  expect(m).toContain('pago_id: pagoId,')
  expect(m).toContain('meses_esperados: fila.meses_desbloqueados,')
  expect(m).toContain('regla_esperada: p.regla,')
  // Sin tocar la casilla sigue a lo que cubre el monto (un abono no abre).
  expect(m).toContain('const abrir = abre !== null && (abrirTocado ? abrirMarcado : cubreElCobro(fila.cobro, concepto, montoNum) && p.abrirPorDefecto)')
  // Abrir TODO: doble confirmación con el aviso del pago único.
  expect(m).toContain('if (abrir && abre?.todo) { setConfirmar(1); return }')
  expect(m).toMatch(/open=\{confirmar === 2\}\s*danger[\s\S]{0,300}?\{AVISO_PAGO_UNICO\}/)
  // El segundo clic de un doble clic no confirma el paso 2; no se cierra a medio envío.
  expect(m).toContain('busy={enviando || !paso2Listo}')
  expect(m).toContain('const t = setTimeout(() => setPaso2Listo(true), 600)')
  expect(m).toContain('<button onClick={onClose} disabled={enviando}')
  // Repetido: se dice, no se cobra dos veces.
  expect(m).toContain('Ese cobro ya estaba registrado (no se cobró dos veces).')
})

test('4. la ficha: tarjeta «Cursos» antes de Pagos, el modal y «¿A qué se aplica?» en el del programa', () => {
  const f = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  const tarjeta = f.indexOf('<CursosDelAlumno filas={cursosAlumno} fmt={fmtMoneda} onCobrar={f => setCobroCurso(f)} />')
  expect(tarjeta).toBeGreaterThan(0)
  expect(tarjeta).toBeLessThan(f.indexOf('Total pagado:'))
  expect(f).toContain('const res = await fetch(`/api/admin/alumnos/${id}/cursos`)')
  expect(f).toContain('<CobrarCursoModal')
  expect(f).toContain('await Promise.all([cargarCursos(), cargarPagos()])')
  // «¿A qué se aplica?»: solo si tiene cursos; elegir uno lleva a «Cobrar» de ese curso.
  expect(f).toMatch(/\{cursosAlumno\.length > 0 && \(\s*<div className="space-y-1\.5">\s*<label[^>]*>¿A qué se aplica\?<\/label>/)
  expect(f).toContain('if (f) { setModalRegistrarPago(false); setPagoError(null); setCobroCurso(f) }')
  // El modal del programa sigue escribiendo SOLO al programa.
  expect(f).toContain("const res = await fetch('/api/admin/pagos', {")
  // El select ya no salta de modal al moverse con el teclado: elegir un curso cambia el
  // formulario por el paso explícito «Cobrar este curso», y el programa no registra nada.
  expect(f).toContain('onChange={e => setDestinoPago(e.target.value)}')
  expect(f).toContain("if (destinoPago !== 'programa') return")
  expect(f).toMatch(/\{destinoPago !== 'programa' \? \([\s\S]{0,1600}?Cobrar este curso/)
  // Sin programa escolar (curso o sin nivel), por omisión su curso.
  expect(f).toContain("setDestinoPago(sinPrograma && cursosAlumno.length > 0 ? cursosAlumno[0].inscripcion_id : 'programa')")
  // La tarjeta se relee al cerrar el modal (también tras un error) y al borrar un pago.
  expect(f).toContain('onClose={() => { setCobroCurso(null); void cargarCursos() }}')
  expect(f).toMatch(/await cargarPagos\(\)\s*void cargarCursos\(\)/)
})
