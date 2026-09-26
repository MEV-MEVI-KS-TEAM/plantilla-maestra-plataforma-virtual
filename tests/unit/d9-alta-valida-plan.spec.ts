import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import {
  MENSAJES_PLAN_ADMIN, MENSAJES_PLAN_REGISTRO, errorDePlanDeRegistro, motivoPlanInvalido, type CatalogoRegistro,
} from '@/lib/registro-reglas'
import { catalogoDeRegistro, getOpcionesNivelAdmin } from '@/lib/niveles'
import { planesPorNivel, getModalidadesLicenciatura, type ModalidadPrograma } from '@/lib/modalidades'
import { getCarreras } from '@/lib/licenciatura-utils'

/**
 * Bloque D · D9 — #199 del lado del admin (decisión 16):
 *  - el alta («Nuevo alumno») valida el plan con la MISMA regla estructural que el
 *    registro público, ANTES de crear la cuenta de Auth, y el modal solo ofrece
 *    los planes de ese nivel;
 *  - PATCH /datos deja de escribir nivel, modalidad y carrera: el plan se cambia
 *    solo con «Corregir plan», que valida y tiene candados.
 */
const leer = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const CAT: CatalogoRegistro = {
  niveles: ['secundaria', 'preparatoria', 'licenciatura'],
  planes: { secundaria: ['3_meses'], preparatoria: ['3_meses', '6_meses'], licenciatura: ['12_meses'] },
  carreras: ['derecho'],
}

test('1. el motivo es la regla del registro, sin mensaje; el registro conserva sus mensajes', () => {
  expect(motivoPlanInvalido({ nivel: 'secundaria', modalidad: '6_meses', carrera: null }, CAT)).toBe('modalidad')
  expect(motivoPlanInvalido({ nivel: 'maestria', modalidad: '3_meses', carrera: null }, CAT)).toBe('nivel')
  expect(motivoPlanInvalido({ nivel: 'preparatoria', modalidad: null, carrera: null }, CAT)).toBe('sinModalidad')
  expect(motivoPlanInvalido({ nivel: 'licenciatura', modalidad: '12_meses', carrera: null }, CAT)).toBe('sinCarrera')
  expect(motivoPlanInvalido({ nivel: 'licenciatura', modalidad: '12_meses', carrera: 'x' }, CAT)).toBe('carrera')
  expect(motivoPlanInvalido({ nivel: 'licenciatura', modalidad: '12_meses', carrera: 'derecho' }, CAT)).toBeNull()
  expect(motivoPlanInvalido({ nivel: 'diplomado', modalidad: null, carrera: null }, CAT)).toBeNull()
  // El registro dice lo mismo que antes (D5).
  expect(errorDePlanDeRegistro({ nivel: 'secundaria', modalidad: '6_meses', carrera: null }, CAT)).toBe(MENSAJES_PLAN_REGISTRO.modalidad)
  // El admin, con sus palabras: corrige el formulario (no hay cuenta creada todavía).
  for (const m of Object.values(MENSAJES_PLAN_ADMIN)) expect(m).not.toMatch(/comunícate con la escuela|[Rr]ecarga/)
})

test('2. el alta valida ANTES de crear la cuenta de Auth, con el catálogo estructural', () => {
  const api = sinComentarios(leer('src/app/api/admin/alumnos/route.ts'))
  const post = api.slice(api.indexOf('export async function POST'))
  const i = post.indexOf('const motivo = motivoPlanInvalido({')
  expect(i).toBeGreaterThan(0)
  expect(i).toBeLessThan(post.indexOf('admin.auth.admin.createUser('))
  expect(post).toContain('}, catalogoDeRegistro())')
  expect(post).toContain('if (motivo) return NextResponse.json({ error: MENSAJES_PLAN_ADMIN[motivo] }, { status: 400 })')
  // Un alumno de curso (o solo_cursos) no tiene plan escolar: no se juzga aquí.
  expect(post).toContain("if (!nivelForzado && nivelElegido !== 'diplomado') {")
})

test('3. el modal solo ofrece los planes de ESE nivel, y todo lo que ofrece pasa la validación', () => {
  const page = sinComentarios(leer('src/app/(dashboard)/admin/alumnos/page.tsx'))
  expect(page).toContain("form.nivel === 'licenciatura' ? getModalidadesLicenciatura() : planesPorNivel(form.nivel, cfg.modalidades)")
  expect(page).not.toContain('getModalidadesActivas(cfg.modalidades)')
  // Con todo lo que el panel pueda encender, cada combinación del modal pasa el servidor.
  const cat = catalogoDeRegistro()
  const todo = (CONFIG.modalidades as readonly ModalidadPrograma[]).map(m => ({ ...m, activa: true }))
  let n = 0
  for (const o of getOpcionesNivelAdmin(true)) {
    if (o.nivel === 'diplomado') continue
    const planes = o.nivel === 'licenciatura' ? getModalidadesLicenciatura() : planesPorNivel(o.nivel, todo)
    const carreras = o.nivel === 'licenciatura' ? getCarreras().map(c => c.slug) : [null]
    for (const p of planes) for (const c of carreras) {
      n++
      expect(motivoPlanInvalido({ nivel: o.nivel, modalidad: p.id, carrera: c }, cat), `${o.nivel}/${p.id}/${c}`).toBeNull()
    }
  }
  expect(n).toBeGreaterThan(0)
})

test('4. PATCH /datos ya no escribe el plan: lo rechaza antes de tocar Auth, y no hay update a alumnos', () => {
  const r = sinComentarios(leer('src/app/api/admin/alumnos/[id]/datos/route.ts'))
  expect(r).toContain("const CAMPOS_PLAN = ['nivel', 'modalidad', 'carrera'] as const")
  const rechazo = r.indexOf('if (CAMPOS_PLAN.some(campo => campo in body)) {')
  expect(rechazo).toBeGreaterThan(0)
  expect(rechazo).toBeLessThan(r.indexOf('admin.auth.admin.updateUserById('))
  expect(r).toContain('se cambia con «Corregir plan», no aquí.')
  expect(r).not.toContain(".from('alumnos')")
  expect(r).not.toContain('CAMPOS_ALUMNO')
  // El editor de datos del panel nunca mandó el plan: sigue sin mandarlo.
  const editor = leer('src/components/admin/EditarDatosAlumno.tsx')
  expect(editor).toContain("for (const campo of ['nombre', 'apellidos', 'email', 'telefono'] as const)")
})
