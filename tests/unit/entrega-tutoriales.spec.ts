import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { soporte } from '../../scripts/entrega/documento.mjs'

/**
 * Los enlaces de la Academia MEV en la entrega de un combo nuevo.
 *
 * La flota conserva la playlist anterior; aquí solo importa que un combo nuevo
 * reciba los cinco enlaces de oct-2026 en el PDF y en el WhatsApp, y que en el PDF
 * se puedan abrir: Chromium no convierte en enlace una URL escrita como texto.
 */

const ENLACES = [
  'https://youtu.be/5zpq32arAaE',
  'https://www.youtube.com/playlist?list=PLLNJywqLhB-w',
  'https://www.youtube.com/playlist?list=PLD_J6ltjvKYA',
  'https://youtu.be/v3XVBHS93rQ',
  'https://youtu.be/0bellPiURco',
]
const GENERADOR = fs.readFileSync(path.join(process.cwd(), 'scripts/entrega/generar-entrega.mjs'), 'utf8')

test('el generador trae los cinco enlaces y ya no los de la flota', () => {
  for (const url of ENLACES) expect(GENERADOR).toContain(`'${url}'`)
  expect(GENERADOR).not.toContain('yWtejlC2t_U')
  expect(GENERADOR).not.toContain('kyrMEqmbJcw')
  expect(GENERADOR).not.toContain("playlist?list=PLWcWYoZvoCwk'")
})

test('el mensaje de WhatsApp usa el bloque de combos nuevos', () => {
  for (const linea of [
    '🎬 *VIDEO TUTORIALES — ACADEMIA MEV*',
    'Aprende a manejar tu plataforma paso a paso, en videos de 2 minutos:',
    '▶️ Empieza aquí: ${TUTORIALES.bienvenida}',
    '▶️ Todos los tutoriales: ${TUTORIALES.playlist}',
    '▶️ POSTRIX (incluido, para difundir tu escuela en grupos): ${TUTORIALES.postrix}',
    '👩‍🎓 *Para tus alumnos nuevos* (compártelos tal cual, no llevan nuestra marca):',
    '• Así se estudia en tu plataforma: ${TUTORIALES.alumnoEstudio}',
    '• Actividades para practicar: ${TUTORIALES.alumnoActividades}',
  ]) expect(GENERADOR).toContain(linea)
})

test('en el PDF cada URL es un enlace, también las de los alumnos', () => {
  const html = soporte({
    soporte: { horario: 'L-V 9-18', respuesta: '24 h', canal: 'WhatsApp' },
    validez: false,
    tutoriales: ['Empieza aquí: https://youtu.be/uno', 'Todos: https://www.youtube.com/playlist?list=dos'],
    tutorialesAlumnos: ['Así se estudia: https://youtu.be/tres'],
    primerosPasos: ['Entra al panel'],
  })
  for (const url of ['https://youtu.be/uno', 'https://www.youtube.com/playlist?list=dos', 'https://youtu.be/tres'])
    expect(html).toContain(`<a href="${url}">${url}</a>`)
  expect(html).toContain('Para tus alumnos nuevos')
})

test('sin enlaces para alumnos no sale su encabezado', () => {
  const html = soporte({
    soporte: { horario: '', respuesta: '', canal: '' }, validez: false, tutoriales: [], primerosPasos: [],
  })
  expect(html).not.toContain('Para tus alumnos nuevos')
})
