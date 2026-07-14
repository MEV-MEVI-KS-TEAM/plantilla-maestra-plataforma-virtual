import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { deflateSync } from 'zlib'
import {
  svc, mintSession, storageStateFromSession,
  ALUMNO_EMAIL, ALUMNO_PASSWORD, ADMIN_EMAIL, DIPLOMA_NOMBRE,
} from './_helpers'

const ROOT = process.cwd()
const AUTH_DIR = join(ROOT, 'e2e', '.auth')
const FIX_DIR = join(ROOT, 'e2e', '.fixtures')
const SHOT_DIR = join(ROOT, 'e2e', 'screenshots')

// ── CRC32 (para PNG) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/** Portada 1200x675 (16:9): degradado slate neutro (placeholder de QA, sin marca). */
function generarPortada(path: string) {
  const W = 1200, H = 675
  const top = [0x33, 0x41, 0x55], bot = [0x1e, 0x29, 0x3b], crema = [0xcb, 0xd5, 0xe1]
  const raw = Buffer.alloc(H * (1 + W * 3))
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 3)
    raw[rowStart] = 0 // filtro none
    const t = y / (H - 1)
    const enFranja = y >= Math.floor(H * 0.80) && y <= Math.floor(H * 0.855)
    const r = enFranja ? crema[0] : Math.round(top[0] + (bot[0] - top[0]) * t)
    const g = enFranja ? crema[1] : Math.round(top[1] + (bot[1] - top[1]) * t)
    const b = enFranja ? crema[2] : Math.round(top[2] + (bot[2] - top[2]) * t)
    for (let x = 0; x < W; x++) {
      const p = rowStart + 1 + x * 3
      raw[p] = r; raw[p + 1] = g; raw[p + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0 // 8-bit RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(path, png)
}

/** PDF de ~6MB (válido, una página) para validar el fix del límite 4.5MB de Vercel. */
function generarPdf(path: string, targetBytes = 6 * 1024 * 1024) {
  const header = '%PDF-1.4\n'
  const objs = [
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n',
  ].join('')
  const preludeLen = header.length + objs.length
  const padLen = Math.max(0, targetBytes - preludeLen - 200)
  // Comentario PDF gigante (líneas '%' — ignorado por lectores) para el relleno
  const pad = '%' + 'M'.repeat(padLen) + '\n'
  const tail = 'trailer<</Root 1 0 R>>\n%%EOF\n'
  writeFileSync(path, Buffer.from(header + objs + pad + tail, 'latin1'))
}

export default async function globalSetup() {
  // La suite es agnóstica de cliente: exige las credenciales de QA por env vars.
  const faltantes = [
    !ALUMNO_EMAIL && 'QA_ALUMNO_EMAIL',
    !ALUMNO_PASSWORD && 'QA_ALUMNO_PASSWORD',
    !ADMIN_EMAIL && 'QA_ADMIN_EMAIL',
  ].filter(Boolean)
  if (faltantes.length) {
    throw new Error(`[globalSetup] faltan variables de QA en .env.local: ${faltantes.join(', ')}. Ver e2e/README-QA.md`)
  }

  for (const d of [AUTH_DIR, FIX_DIR, SHOT_DIR]) mkdirSync(d, { recursive: true })

  const s = svc()

  // 1. Password del alumno de prueba = 12345678 (para el login REAL por UI)
  const { data: alu } = await s.from('usuarios').select('id').eq('email', ALUMNO_EMAIL).single()
  if (!alu) throw new Error(`No existe ${ALUMNO_EMAIL} en usuarios`)
  const { error: pwErr } = await s.auth.admin.updateUserById(alu.id, { password: ALUMNO_PASSWORD })
  if (pwErr) throw new Error('updateUserById(password): ' + pwErr.message)

  // 2. Limpieza de diplomas de prueba de corridas anteriores (cascade borra todo)
  const { data: viejos } = await s.from('cursos').select('id').eq('nombre', DIPLOMA_NOMBRE)
  for (const c of viejos ?? []) {
    // storage: borrar objetos del curso y sus portadas
    for (const prefix of [c.id as string, `portadas/${c.id}`]) {
      const { data: subs } = await s.storage.from('cursos').list(prefix, { limit: 1000 })
      for (const sub of subs ?? []) {
        if (!sub.id) { const { data: fs } = await s.storage.from('cursos').list(`${prefix}/${sub.name}`, { limit: 1000 }); if (fs?.length) await s.storage.from('cursos').remove(fs.map(f => `${prefix}/${sub.name}/${f.name}`)) }
        else await s.storage.from('cursos').remove([`${prefix}/${sub.name}`])
      }
    }
    await s.from('cursos').delete().eq('id', c.id)
  }

  // 3. Fixtures (portada + PDF 6MB)
  generarPortada(join(FIX_DIR, 'portada.png'))
  generarPdf(join(FIX_DIR, 'material.pdf'))

  // 4. storageState del admin (sesión acuñada sin contraseña)
  const adminSession = await mintSession(ADMIN_EMAIL)
  writeFileSync(join(AUTH_DIR, 'admin.json'), JSON.stringify(storageStateFromSession(adminSession), null, 2))

  console.log('[globalSetup] OK: password alumno, limpieza, fixtures y admin.json listos')
}
