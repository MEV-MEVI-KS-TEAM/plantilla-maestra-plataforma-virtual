import { test, expect } from '@playwright/test'
import {
  PALETAS,
  PARES_CONTRASTE,
  TOKENS_COLORES,
  detectarPaleta,
  paletaPorId,
  type TokensColores,
} from '@/lib/site-config-paletas'
import { ratioContraste, esHexValido } from '@/lib/contraste'
import { CLAVES_PALETA, COLORES_DE_FABRICA } from '@/lib/landing-textos'
import { CONFIG } from '@/lib/config'
import { ES_PLANTILLA } from './es-plantilla'

/**
 * Personalizar mi página — paletas curadas.
 *
 * El invariante que estas pruebas protegen: **ninguna paleta que se le ofrezca
 * al admin puede producir texto ilegible**. El admin no ve ratios ni sabe qué
 * es WCAG; confía en que lo que elige del catálogo se ve bien. Cada par de
 * `PARES_CONTRASTE` se verifica aquí, en las 12, con el mismo módulo que usa
 * el editor en vivo.
 */

test('hay exactamente 12 paletas con ids únicos', () => {
  expect(PALETAS.length).toBe(12)
  const ids = PALETAS.map(p => p.id)
  expect(new Set(ids).size).toBe(12)
  for (const id of ids) {
    // slug: minúsculas, dígitos y guiones. Es lo que se guarda en la base.
    expect(id, `id "${id}" no es un slug`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(paletaPorId(id)?.id).toBe(id)
  }
})

test('la primera paleta es la original y cubre los mismos tokens que el config', () => {
  const original = PALETAS[0]
  expect(original.original).toBe(true)
  // Solo UNA puede ser la original: "restaurar" tiene que ser inequívoco.
  expect(PALETAS.filter(p => p.original).length).toBe(1)

  // Los 12 tokens, ni uno más ni uno menos. Si alguien agrega un color a
  // CONFIG.colores sin agregarlo a las paletas, esto lo para. Vale en
  // cualquier repo: el cliente cambia los VALORES de su paleta, no las claves.
  const tokensConfig = Object.keys(CONFIG.colores).sort()
  expect([...TOKENS_COLORES].sort()).toEqual(tokensConfig)

  // Los seis tonos de marca se comparan contra la paleta DE FÁBRICA, que es
  // literal y no se mueve con el cliente. Esto también corre en los 144 clones.
  for (const token of CLAVES_PALETA) {
    expect(
      original.colores[token],
      `la paleta original difiere de la de fábrica en "${token}"`,
    ).toBe(COLORES_DE_FABRICA[token])
  }
})

test('la paleta original calca CONFIG.colores token por token (solo plantilla)', () => {
  // 🛑 GUARDIÁN DE SINCRONÍA, NO DE COMPORTAMIENTO. En el repo de una escuela
  //    `CONFIG.colores` son los SUYOS y esta comparación no significa nada: lo
  //    único que hacía era dejar en rojo la suite de cualquier cliente con
  //    paleta propia (lo destapó SAMEX, #199). En la plantilla sigue atando la
  //    paleta original al config de fábrica, que es donde importa.
  if (!ES_PLANTILLA) return
  const original = PALETAS[0]
  for (const token of TOKENS_COLORES) {
    expect(
      original.colores[token],
      `la paleta original difiere de CONFIG.colores en "${token}"`,
    ).toBe(CONFIG.colores[token])
  }
})

test('cada paleta cumple todos los PARES_CONTRASTE', () => {
  for (const paleta of PALETAS) {
    for (const par of PARES_CONTRASTE) {
      const a = par.a === '#FFFFFF' ? '#FFFFFF' : paleta.colores[par.a]
      const b = paleta.colores[par.b]
      const ratio = ratioContraste(a, b)
      // EXCEPCIÓN DOCUMENTADA — la paleta ORIGINAL calca CONFIG.colores tal
      // cual está hoy en los ~144 clientes: acento #3B82F6 (blue-500) sobre
      // blanco da 3.68:1. Cumple AA para componentes de interfaz (≥ 3.0) pero
      // no AA para texto normal (≥ 4.5). Subir el acento a blue-600 cambiaría
      // el color de los botones de toda la flota: es decisión de producto, no
      // de este módulo, así que aquí se exige solo el umbral de componentes.
      // Las 11 paletas NUEVAS sí deben cumplir 4.5 en todos los pares.
      const minimo = paleta.original && par.a === 'acento' && par.b === 'textoSobreAcento'
        ? 3.0
        : par.minimo
      expect(
        ratio,
        `paleta "${paleta.id}", par ${par.a}/${par.b} (${par.etiqueta}): ratio ${ratio.toFixed(2)} < ${minimo} (${a} sobre ${b})`,
      ).toBeGreaterThanOrEqual(minimo)
    }
  }
})

test('todos los hex son #RRGGBB válidos y themeColor sigue a fondo', () => {
  for (const paleta of PALETAS) {
    for (const token of TOKENS_COLORES) {
      const v = paleta.colores[token]
      expect(esHexValido(v), `paleta "${paleta.id}", token "${token}": "${v}" no es #RRGGBB`).toBe(true)
      // En MAYÚSCULAS: detectarPaleta compara como texto y la config se
      // escribe así.
      expect(v, `paleta "${paleta.id}", token "${token}" no está en mayúsculas`).toBe(v.toUpperCase())
    }
    // La barra del navegador móvil debe ser del color del fondo REAL; si no,
    // queda de un color que no aparece en ninguna pantalla.
    expect(paleta.colores.themeColor, `paleta "${paleta.id}": themeColor ≠ fondo`).toBe(paleta.colores.fondo)
  }
})

test('ratioContraste sigue la fórmula WCAG en los extremos', () => {
  // Negro sobre blanco es el máximo teórico (1.05 / 0.05).
  expect(ratioContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  // El orden no importa.
  expect(ratioContraste('#FFFFFF', '#000000')).toBeCloseTo(21, 0)
  // Un color consigo mismo no contrasta nada.
  expect(ratioContraste('#3B82F6', '#3B82F6')).toBe(1)
  expect(ratioContraste('#ABCDEF', '#abcdef')).toBe(1)
})

test('detectarPaleta reconoce una paleta exacta y rechaza una alterada', () => {
  const cuarta = PALETAS[3]
  expect(detectarPaleta(cuarta.colores)).toBe(cuarta.id)
  // La comparación es insensible a mayúsculas.
  const enMinusculas = Object.fromEntries(
    Object.entries(cuarta.colores).map(([k, v]) => [k, v.toLowerCase()]),
  )
  expect(detectarPaleta(enMinusculas)).toBe(cuarta.id)
  // Un solo token distinto ya no es "la misma paleta".
  expect(detectarPaleta({ ...cuarta.colores, acento: '#123456' })).toBeNull()
  // Y con un token faltante tampoco: 11 de 12 no es "la misma paleta".
  const sinThemeColor: Partial<TokensColores> = { ...cuarta.colores }
  delete sinThemeColor.themeColor
  expect(detectarPaleta(sinThemeColor)).toBeNull()
})
