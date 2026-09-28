import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  comoReabrir, cuandoSePublique, cuandoVeraTodo, finalFichaSinPrecio, llevaAvisoNoReembolsable, precioAntesDeAsignar,
  textoAbrirTodoSinPagoUnico, tituloCerrarMes, tituloNoActiva, tituloTopeAlcanzado,
} from '@/lib/cursos/textos-alumnos'
import { etiquetaRol, pluralMeses } from '@/lib/etiqueta-rol'
import { quienHizo, textoUltimoMovimiento } from '@/lib/cursos/bitacora'
import { errorRpcMes, textoUltimoMes } from '@/lib/meses-programa'
import { errorDeRpcCurso } from '@/lib/cursos/inscripciones'
import { avisoMes1 } from '@/lib/cursos/aviso-asignar'
import { saldoPendiente } from '@/components/admin/alumnos/CursosDelAlumno'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Bloque D · D21b — textos del panel (OS1–OS11 de la QA del Bloque D), OL1 y la entrega a
 * la escuela con los permisos nuevos del secretario (D21a: altas y «Marcar contactado»).
 * Presentación: ninguna regla de acceso cambia aquí.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const TAB = sinComentarios(leer('src/components/admin/cursos/AlumnosTab.tsx'))
/** Para buscar frases que el JSX parte en varias líneas. */
const plano = (s: string) => s.replace(/\s+/g, ' ')
const pg = (code: string, message: string) => ({ code, message, details: '', hint: '' }) as unknown as PostgrestError

test('OS1. «no reembolsable» SOLO con ficha de pago único; mensual y sin precio con texto neutro (y doble confirmación)', () => {
  expect(llevaAvisoNoReembolsable('unico')).toBe(true)
  expect(llevaAvisoNoReembolsable('mensual')).toBe(false)
  expect(llevaAvisoNoReembolsable('informes')).toBe(false)
  for (const t of ['mensual', 'informes'] as const) {
    const x = textoAbrirTodoSinPagoUnico(t)
    expect(x).not.toMatch(/reembols|pago único/)
    expect(x).toContain('«Quitar acceso total»')
  }
  expect(textoAbrirTodoSinPagoUnico('mensual')).toContain('aunque no haya pagado las mensualidades que faltan')
  expect(textoAbrirTodoSinPagoUnico('informes')).toContain('no tiene precio en su ficha')
  // La 2ª confirmación sigue existiendo para los tres tipos (decisión de Kevin).
  expect(TAB).toMatch(/open=\{confirmAbrirTodo\?\.paso === 2\}/)
  expect(TAB).toContain("textoAbrirTodoSinPagoUnico(tipoPrecio === 'mensual' ? 'mensual' : 'informes')")
  // La página del curso le pasa el tipo de la ficha.
  const curso = sinComentarios(leer('src/app/(dashboard)/admin/cursos/[id]/page.tsx'))
  expect(curso).toContain('tipoPrecio={precioCursoNumerico(curso).tipo}')
  // «Activar según la ficha» ya no repite el aviso con otras palabras.
  expect(TAB).not.toContain('ya no se reembolsa')
  // «verá todo el curso desde ya» solo si hoy lo vería (borrador o inscripción no vigente: cuándo).
  expect(cuandoVeraTodo(true, true, true)).toBe('desde ya')
  expect(cuandoVeraTodo(false, true, true)).toBe('cuando lo publiques')
  expect(cuandoVeraTodo(false, true, false)).toBe('cuando el administrador lo publique')
  expect(cuandoVeraTodo(true, false, false)).toBe('cuando su inscripción esté activa y vigente')
  expect(plano(TAB)).not.toContain('verá todo el curso desde ya')
  expect(TAB).toContain('cuandoVeraTodo(publicado, accesoVigente(confirmActivar.i, publicado), esAdmin)')
  expect(TAB).toContain('cuandoVeraTodo(publicado, accesoVigente(confirmAbrirTodo.i, publicado), esAdmin)')
  // La insignia «Acceso total» también sale en cursos mensuales o sin precio.
  expect(TAB).not.toContain('title="Pago único: ve el curso completo')
  expect(TAB).toContain('title="Acceso total: ve el curso completo, también los módulos que se agreguen"')
})

test('OS2. al secretario no se le pide «ponle precio»; en /admin/alumnos el texto es neutro', () => {
  expect(finalFichaSinPrecio(true)).toContain('ponle precio al curso en Contenido → Precios y ritmo')
  expect(finalFichaSinPrecio(false)).toBe('y pide al administrador que le ponga precio al curso.')
  expect(precioAntesDeAsignar(false)).toContain('pide al administrador')
  expect(TAB).not.toContain('y ponle precio al curso.`')
  expect(TAB.match(/\$\{finalFichaSinPrecio\(esAdmin\)\}`, AVISO_MS\)/g)?.length).toBe(2)
  const aviso = avisoMes1([{ nombre: 'ING-05', acceso_total: false, sin_precio: true }], null) ?? ''
  expect(aviso).not.toMatch(/ponle precio|Gestionar cursos/)
  expect(aviso).toContain('que el administrador le ponga precio')
  const alumnos = plano(sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx')))
  expect(alumnos).not.toContain('Gestionar cursos →')
  expect(alumnos).toContain('Los meses siguientes se abren en la pestaña Alumnos del curso.')
  expect(alumnos).not.toContain('cuando publiques')
  expect(alumnos).toContain("' (lo verá cuando el curso se publique)'")
})

test('OS3. cerrar un mes de curso: con acentos, dice que el avance no se borra, y «−» tiene nombre accesible', () => {
  expect(TAB).toContain('Cerrar el mes ${mesesActuales} de ${nombre}.')
  expect(TAB).toContain('Esto le quita acceso que ya tenía: los módulos de ese mes dejarán de verse.')
  expect(TAB).toContain("${comoReabrir(fila?.estado ?? 'activa', mesesActuales - 1, tope)}")
  expect(comoReabrir('activa', 1, 3)).toBe('Su avance no se borra y puedes volver a abrirlo con «+ Abrir mes».')
  expect(comoReabrir('activa', 1, null)).toContain('«+ Abrir mes»')
  expect(comoReabrir('suspendida', 1, 3)).toBe('Su avance no se borra; para volver a abrirlo, la inscripción tiene que estar activa.')
  expect(comoReabrir('activa', 3, 3)).toBe('Su avance no se borra.')   // el tope bajó: «+ Abrir mes» seguiría apagado
  // «−» apagado sin meses: no hay «mes 0».
  expect(tituloCerrarMes(0)).toBe('No tiene meses abiertos que cerrar')
  expect(tituloCerrarMes(2)).toBe('Cerrar el mes 2 (quita acceso)')
  expect(TAB).toContain('canceladaTitulo : tituloCerrarMes(i.meses_desbloqueados)}')
  expect(TAB).not.toMatch(/ya tenia|los modulos|dejaran de verse/)
  expect(TAB).toContain('aria-label="Cerrar mes"')
})

test('OS4. una sola etiqueta por rol y «cerró el mes» en todo el panel', () => {
  expect(etiquetaRol('admin')).toBe('Administrador')
  expect(etiquetaRol('SECRETARIO')).toBe('Secretario')
  expect(quienHizo({ actor_nombre: 'Ana', actor_rol: 'secretario' })).toBe('Ana (Secretario)')
  const ev = { accion: 'cerrar' as const, mes: 2, antes: 2, despues: 1, actor_nombre: 'Ana', actor_rol: 'secretario', created_at: '2026-09-27T12:00:00Z' }
  expect(textoUltimoMes(ev, () => 'F')).toBe('Último: cerró el mes 2 (2 → 1) · F · Ana (Secretario)')
  const ficha = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/[id]/page.tsx'))
  expect(ficha).toContain('Cerrar último mes (Mes {alumno.meses_desbloqueados})')
  expect(ficha).toContain('¿Cerrar el Mes {alumno.meses_desbloqueados}?')
  expect(ficha).toContain('Sí, cerrar el mes')
  expect(ficha).not.toMatch(/Quitar último mes|¿Quitar el Mes|Sí, quitar el mes|Mes \$\{mes_quitado\} quitado|Quitando/)
  expect(ficha).toContain('Cerrando...')
  const rutaCerrar = sinComentarios(leer('src/app/api/admin/alumnos/[id]/cerrar-mes/route.ts'))
  expect(rutaCerrar).not.toMatch(/que quitar|quitar el mes/)
  expect(rutaCerrar).toContain("'No hay meses que cerrar'")
  expect(errorRpcMes(pg('22023', 'No hay meses que quitar.')).mensaje).toBe('No hay meses que cerrar.')
  // Ningún texto del panel vuelve a «(secretaría)» / «(administración)».
  for (const f of ['src/lib/cursos/bitacora.ts', 'src/components/admin/alumnos/CursosDelAlumno.tsx', 'src/lib/meses-programa.ts']) {
    expect(sinComentarios(leer(f)), f).not.toMatch(/'secretaría'|'administración'/)
  }
})

test('OS5. la línea «Último: …» completa (qué, cuándo, quién), también en el title', () => {
  const m = { tipo: 'constancia_emitida', meses_antes: null, meses_despues: null, created_at: '2026-09-27T12:00:00Z', actor_nombre: 'Ana López', actor_rol: 'secretario', folio: 'CONST-00003' }
  expect(textoUltimoMovimiento(m, () => '27 sep 2026, 06:00')).toBe('Último: emitió la constancia CONST-00003 · 27 sep 2026, 06:00 · Ana López (Secretario)')
  expect(textoUltimoMovimiento({ ...m, actor_nombre: null, actor_rol: null }, () => '')).toBe('Último: emitió la constancia CONST-00003 · el sistema')
  expect(TAB).toMatch(/className="text-\[11px\] line-clamp-2 break-words"[\s\S]{0,80}title=\{textoUltimoMovimiento\(i\.ultimo_movimiento\)\}>/)
})

test('OS6. la lista de cursos le habla a quien la ve; plurales; «Nuevo curso» no aparece mientras carga', () => {
  const lista = sinComentarios(leer('src/app/(dashboard)/admin/cursos/page.tsx'))
  expect(lista).toContain('useState<boolean | null>(null)')
  expect(lista).toContain("'Asigna cursos a tus alumnos, abre sus meses y registra sus cobros.'")
  expect(lista).toContain("'Cuando el administrador cree un curso, aparecerá aquí para que asignes alumnos.'")
  expect(lista).toContain("{curso.numAlumnos === 1 ? 'alumno' : 'alumnos'}")
  expect(lista).toContain("{curso.numModulos === 1 ? 'módulo' : 'módulos'}")
  expect(lista).toContain("{curso.numLecciones === 1 ? 'lección' : 'lecciones'}")
  expect(lista).toContain('{cursos !== null && cursos.length === 0 && !falloCarga && (')
  expect(plano(lista)).toContain('No se pudieron cargar los cursos. </p>')
  expect(lista).toMatch(/\} catch \{\s*setCursos\(\[\]\)\s*setFalloCarga\(true\)/)
})

test('OS7. la ayuda bajo el buscador separa pago único, mensual y sin precio', () => {
  const i = TAB.indexOf("{apertura === 'total'")
  const bloque = TAB.slice(i, i + 900)
  expect(bloque).toMatch(/: tipoPrecio === 'mensual'\s*\?\s*<>«Asignar» le abre el <strong>mes 1<\/strong>\. Los meses siguientes/)
  expect(bloque).toContain('Si te pagó el curso completo de una vez, usa «Abrir todo» en su fila.')
  expect(bloque).toContain('Este curso no tiene precio en su ficha: «Asignar» le abre el <strong>mes 1</strong>.')
})

test('OS8. doble clic en «+ Abrir mes» / «−»: guarda síncrona antes del confirm; un 409 recarga y avisa en neutro', () => {
  const mover = TAB.slice(TAB.indexOf('const moverMes = async ('), TAB.indexOf('const cambiarAccesoTotal = async ('))
  expect(TAB).toContain('const moviendoMes = useRef<Set<string>>(new Set())')
  const guarda = mover.indexOf('if (moviendoMes.current.has(inscripcionId)) return')
  const confirm = mover.indexOf('window.confirm(')
  const toma = mover.indexOf('moviendoMes.current.add(inscripcionId)')
  expect(guarda).toBeGreaterThan(0)
  expect(guarda).toBeLessThan(confirm)
  // Se toma DESPUÉS del confirm y antes de cualquier await: cancelar no toca nada.
  expect(toma).toBeGreaterThan(confirm)
  expect(mover.slice(confirm, toma)).not.toContain('await')
  expect(mover.slice(confirm, toma)).not.toContain('setOcupadoId')
  expect(mover.indexOf('try {')).toBeGreaterThan(toma)
  expect(mover).toMatch(/if \(res\.status === 409\) \{\s*await onChanged\(\)/)
  expect(mover).toContain('if (onAviso) onAviso(aviso)')
  expect(mover).toContain('moviendoMes.current.delete(inscripcionId)')
  expect(mover).toContain('setOcupadoId(prev => (prev === inscripcionId ? null : prev))')
  const curso = sinComentarios(leer('src/app/(dashboard)/admin/cursos/[id]/page.tsx'))
  expect(curso).toContain("showToast(mensaje, 'info', 8000)")
  expect(curso).toContain('onAviso={onAviso}')
})

test('OS9. «+ Abrir mes» se apaga en el tope, que ahora viaja en la respuesta del curso', () => {
  expect(TAB).toContain("disabled={ocupadoId === i.inscripcion_id || i.estado !== 'activa' || (tope !== null && i.meses_desbloqueados >= tope)}")
  expect(TAB).toContain(': tope !== null && i.meses_desbloqueados >= tope ? tituloTopeAlcanzado(tope)')
  expect(tituloTopeAlcanzado(1)).toBe('Ya tiene abierto el único mes del curso: no hay más que abrir')
  expect(tituloTopeAlcanzado(4)).toBe('Ya tiene abiertos los 4 meses del curso: no hay más que abrir')
  const ruta = sinComentarios(leer('src/app/api/admin/cursos/[id]/route.ts'))
  expect(ruta).toContain('tope_meses: topeCurso,')
  expect(ruta.indexOf('const topeCurso =')).toBeLessThan(ruta.indexOf('if (alumnoIds.length > 0) {'))
  const curso = sinComentarios(leer('src/app/(dashboard)/admin/cursos/[id]/page.tsx'))
  expect(curso).toContain('tope={detalle.tope_meses ?? null}')
})

test('OS10. «Saldo pendiente» solo a quien ya tiene acceso y debe parte del pago único', () => {
  const base = { estado: 'activa', acceso_total: true, meses_desbloqueados: 0, resumen: { tipo: 'unico', regla: 'total', pagado: 0, saldo: 1800, mesesCubiertos: [], pagadoFaltaAbrir: false } } as Parameters<typeof saldoPendiente>[0]
  expect(saldoPendiente(base)).toBe(1800)
  expect(saldoPendiente({ ...base, acceso_total: false, meses_desbloqueados: 1 })).toBe(1800)
  expect(saldoPendiente({ ...base, acceso_total: false, meses_desbloqueados: 0 })).toBeNull()   // sin acceso todavía
  expect(saldoPendiente({ ...base, resumen: { ...base.resumen, saldo: 0 } })).toBeNull()       // ya pagó
  expect(saldoPendiente({ ...base, resumen: { ...base.resumen, saldo: null } })).toBeNull()    // mensual
  expect(saldoPendiente({ ...base, estado: 'cancelada' })).toBeNull()
  expect(saldoPendiente({ ...base, estado: 'completada' })).toBe(1800)
})

test('OS11. «mes(es) abierto(s)» se lee bien, sin migración', () => {
  expect(pluralMeses('ahora tiene 2 mes(es) abierto(s). Recarga.')).toBe('ahora tiene 2 meses abiertos. Recarga.')
  expect(pluralMeses('ahora tiene 1 mes(es) abierto(s).')).toBe('ahora tiene 1 mes abierto.')
  expect(pluralMeses('tiene 3 mes(es) abiertos')).toBe('tiene 3 meses abiertos')
  expect(pluralMeses('sin el patrón')).toBe('sin el patrón')
  expect(errorRpcMes(pg('PT409', 'El alumno cambió mientras tanto: ahora tiene 2 mes(es) abierto(s). Recarga la ficha.')).mensaje)
    .toBe('El alumno cambió mientras tanto: ahora tiene 2 meses abiertos. Recarga la ficha.')
  expect(errorDeRpcCurso(pg('PT409', 'La inscripción tiene 1 mes(es) abiertos')).mensaje).toBe('La inscripción tiene 1 mes abierto')
})

test('borrador: al secretario se le dice que lo publica el administrador', () => {
  expect(cuandoSePublique(true)).toBe('cuando lo publiques')
  expect(cuandoSePublique(false)).toBe('cuando el administrador lo publique')
  expect(TAB).not.toMatch(/'[^']*cuando (lo )?publiques[^']*'/)
  expect(TAB).not.toContain(' cuando publiques el curso')
})

test('reactivar: al secretario no se le pide «reactívala» (es del admin)', () => {
  expect(tituloNoActiva('cancelada', true)).toBe('Inscripción cancelada: reactívala primero')
  expect(tituloNoActiva('suspendida', true, true)).toBe('Inscripción suspendida: reactívala para abrir meses')
  for (const e of ['cancelada', 'suspendida', 'completada']) {
    expect(tituloNoActiva(e, false)).toBe(`Inscripción ${e}: solo el administrador puede reactivarla`)
    expect(tituloNoActiva(e, false, true)).not.toContain('reactívala')
  }
  expect(TAB).toContain("const canceladaTitulo = esAdmin ? CANCELADA_TITULO : tituloNoActiva('cancelada', false)")
  expect(TAB).not.toMatch(/title=\{[^}]*CANCELADA_TITULO/)
  expect(TAB.match(/title=\{i\.estado === 'cancelada' \? canceladaTitulo : /g)?.length).toBe(5)
  expect(TAB).toContain("title={i.estado !== 'activa' ? tituloNoActiva(i.estado, esAdmin, true)")
  expect(TAB).toContain("title={i.estado !== 'activa' ? tituloNoActiva(i.estado, esAdmin)")
  // El único «reactívala» literal que queda es el de la constante del admin.
  expect(TAB.match(/reactívala/g)?.length).toBe(1)
})

test('OL1. /alumno/pagar solo promete «Paga en línea» cuando hay enlaces que le aplican', () => {
  const p = sinComentarios(leer('src/app/(dashboard)/alumno/pagar/page.tsx'))
  expect(p).toMatch(/\{!cargando && cfgPagos\?\.activo && enlaces\.length > 0 && \(\s*<p[^>]*>\s*Paga en línea con tarjeta desde aquí/)
  // Sin enlaces (o mientras carga) no hay subtítulo que prometa algo: lo dice el recuadro.
  expect(p).not.toContain('Aquí verás cómo pagar')
  expect(p).not.toMatch(/enlaces\.length > 0 \? \(/)
})

test('entrega e instrucciones: el secretario da altas y marca contactados; borrar alumnos es del admin', () => {
  const gen = leer('scripts/entrega/generar-entrega.mjs')
  const doc = leer('scripts/entrega/documento.mjs')
  for (const t of [gen, doc]) expect(t).toContain('da de alta alumnos y los marca como contactados')
  expect(gen).toContain('borrado de pagos y de alumnos, «Personalizar mi página» y las cuentas del personal (Usuarios) quedan solo en tu cuenta')
  expect(gen).not.toContain('y alta de usuarios quedan solo en tu cuenta')
  expect(doc).toContain('borrar pagos y borrar alumnos quedan solo en tu cuenta.')
  // La doble confirmación no es siempre por el reembolso: solo en pago único.
  expect(doc).toContain('piden doble confirmación; en un curso de pago único, desde ese momento ya no se reembolsa.')
  expect(doc).not.toContain('porque desde ese momento el pago único ya no se reembolsa')
  const ins = leer('INSTRUCCIONES-SOLO-CURSOS.md')
  expect(ins).toContain('o el admin o el secretario lo da de\n   alta desde `/admin/alumnos` (D21a).')
  expect(ins).not.toContain('- **Secretario**: solo Alumnos, desde donde registra los pagos del diplomado.')
  expect(ins).toContain('Da de alta alumnos y los marca como\n  contactados (D21a)')
  expect(ins).toContain('→ WhatsApp → el admin o el secretario lo inscribe')
  expect(ins).not.toMatch(/WhatsApp → el admin lo inscribe/)
})
