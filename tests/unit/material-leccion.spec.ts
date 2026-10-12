import { test, expect } from '@playwright/test'
import {
  contentTypeMaterial, firmaMaterialValida, formatoMaterial, validarMaterialLeccion,
} from '@/lib/cursos/material-leccion'

/**
 * Material de lección de Cursos: además de PDF, Word/Excel/PowerPoint,
 * AutoCAD y Power BI (TICKET-2026-10-12-06). El navegador no manda MIME para
 * dwg/pbix, así que la extensión + la firma de los primeros bytes deciden.
 */

const MB = 1024 * 1024
const bytes = (...xs: number[]) => new Uint8Array([...xs, ...new Array(16).fill(0)])
const texto = (s: string) => new TextEncoder().encode(s)

test('acepta los formatos nuevos con el MIME real o sin MIME', () => {
  expect(validarMaterialLeccion({ name: 'plantilla.docx', size: MB, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }).ok).toBe(true)
  expect(validarMaterialLeccion({ name: 'cronograma.xlsx', size: MB, type: '' }).ok).toBe(true)
  expect(validarMaterialLeccion({ name: 'plano.dwg', size: MB, type: '' }).ok).toBe(true)
  expect(validarMaterialLeccion({ name: 'tablero.pbix', size: MB, type: 'application/octet-stream' }).ok).toBe(true)
  expect(validarMaterialLeccion({ name: 'Guía.PDF', size: MB, type: 'application/pdf' }).ok).toBe(true)
})

test('rechaza extensiones fuera de la lista, MIME incoherente y más de 10MB', () => {
  expect(validarMaterialLeccion({ name: 'virus.exe', size: MB, type: '' }).ok).toBe(false)
  expect(validarMaterialLeccion({ name: 'foto.docx', size: MB, type: 'image/png' }).ok).toBe(false)
  expect(validarMaterialLeccion({ name: 'grande.xlsx', size: 11 * MB, type: '' }).ok).toBe(false)
})

test('la firma de los primeros bytes tiene que corresponder a la extensión', () => {
  expect(firmaMaterialValida('a.pdf', texto('%PDF-1.7\n'))).toBe(true)
  expect(firmaMaterialValida('a.docx', bytes(0x50, 0x4b, 0x03, 0x04))).toBe(true)
  expect(firmaMaterialValida('a.pbix', bytes(0x50, 0x4b, 0x03, 0x04))).toBe(true)
  expect(firmaMaterialValida('a.xls', bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1))).toBe(true)
  expect(firmaMaterialValida('a.dwg', texto('AC1032\0\0\0'))).toBe(true)
  expect(firmaMaterialValida('a.dxf', texto('  0\nSECTION\n  2\nHEADER\n'))).toBe(true)
  expect(firmaMaterialValida('a.dxf', texto('999\r\nhecho con AutoCAD\r\n  0\r\nSECTION'))).toBe(true)
  // Un PDF renombrado a .docx, un ejecutable renombrado a .dwg, un binario como .dxf.
  expect(firmaMaterialValida('a.docx', texto('%PDF-1.7\n'))).toBe(false)
  expect(firmaMaterialValida('a.dwg', bytes(0x4d, 0x5a))).toBe(false)
  expect(firmaMaterialValida('a.dxf', bytes(0x00, 0x01, 0x02))).toBe(false)
  expect(firmaMaterialValida('a.exe', bytes(0x4d, 0x5a))).toBe(false)
})

test('etiqueta y Content-Type salen de la extensión', () => {
  expect(formatoMaterial('curso/leccion/1700-plantilla.docx')).toBe('Word')
  expect(formatoMaterial('x/y/plano.dwg')).toBe('AutoCAD')
  expect(formatoMaterial('x/y/z.pbix')).toBe('Power BI')
  expect(formatoMaterial(null)).toBeNull()
  expect(contentTypeMaterial('plano.dwg', '')).toBe('application/acad')
  expect(contentTypeMaterial('a.pdf', 'application/pdf')).toBe('application/pdf')
})
