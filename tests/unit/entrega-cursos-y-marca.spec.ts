import { test, expect } from '@playwright/test'
// El generador es JS puro, sin tipos: se prueba tal cual corre.
import { cursos, personalizar, paleta } from '../../scripts/entrega/documento.mjs'

/**
 * Dos páginas del Documento de Entrega Oficial.
 *
 * ── `cursos()`: lo que el cliente YA tiene publicado ────────────────────────
 *
 * 🛑 La página decía «módulo vacío» y «crea tu primer curso» **aunque hubiera
 * cursos publicados**, y en el mismo párrafo imprimía «con 2 curso(s)
 * cargado(s)». Se contradecía a sí misma y le negaba por escrito al cliente lo
 * que acababa de comprar: con el add-on de Cursos de Ingreso los cursos están
 * publicados y a la venta el día de la entrega. Salió con AULA RAÍZ (#208).
 *
 * De paso se va el `curso(s)` con paréntesis, que en un documento oficial se
 * lee como una plantilla a medio llenar.
 *
 * ── `personalizar()`: la página que faltaba ─────────────────────────────────
 *
 * «Personalizar mi página» es el ÚNICO módulo que el cliente opera solo, sin
 * pedirnos nada y sin redeploy, y el documento no lo mencionaba en ninguna de
 * sus páginas: el cliente acababa la lectura sin saber que puede cambiar su
 * eslogan, sus colores y su logo.
 *
 * Y en una escuela que entrega **sin WhatsApp** es el único camino para
 * encender sus botones. Callarlo le cuesta su canal principal.
 */

const BASE = {
  url: 'https://escuela.online',
  P: paleta(undefined),
  modalidadesCols: ['Modalidad', 'Duración'],
  modalidadesFilas: [['Plan 3 meses', '3 meses']],
}

const DOS_CURSOS = [
  { nombre: 'Curso de ingreso al EXANI-II', precio: '$1,500 de pago único' },
  { nombre: 'Curso de ingreso a la UNAM', precio: '$1,500 de pago único' },
]

test('módulo vacío: invita a crear el primero y avisa de que la sección no se muestra', () => {
  const html = cursos({ ...BASE, cursosPublicados: 0, cursosLista: [] })
  expect(html).toContain('Crea tus propios cursos')
  expect(html).toContain('vacío')
  expect(html).toContain('crea tu primer curso')
  // No puede haber una tabla de «lo que ya está a la venta» si no hay nada.
  expect(html).not.toContain('Lo que ya está a la venta')
})

test('con cursos publicados: los nombra con su precio y NO dice que esté vacío', () => {
  const html = cursos({ ...BASE, cursosPublicados: 2, cursosLista: DOS_CURSOS })
  expect(html).toContain('Tus cursos, ya publicados')
  expect(html).toContain('2 cursos ya publicados y a la venta')
  for (const c of DOS_CURSOS) {
    expect(html).toContain(c.nombre)
  }
  expect(html).toContain('$1,500 de pago único')
  // 🛑 Lo que se contradecía.
  expect(html).not.toContain('vacío')
  expect(html).not.toContain('crea tu primer curso')
  expect(html).not.toContain('no se muestra en tu página pública')
})

test('nunca se imprime el «curso(s)» de plantilla a medio llenar', () => {
  for (const d of [
    { cursosPublicados: 0, cursosLista: [] },
    { cursosPublicados: 1, cursosLista: [DOS_CURSOS[0]] },
    { cursosPublicados: 2, cursosLista: DOS_CURSOS },
  ]) {
    expect(cursos({ ...BASE, ...d })).not.toContain('curso(s)')
  }
})

test('un solo curso va en singular', () => {
  const html = cursos({ ...BASE, cursosPublicados: 1, cursosLista: [DOS_CURSOS[0]] })
  expect(html).toContain('1 curso ya publicado y a la venta')
  expect(html).toContain('este curso')
})

test('personalizar: dice dónde está, qué se cambia y que se puede volver atrás', () => {
  const html = personalizar({ ...BASE, sinWhatsApp: false })
  expect(html).toContain('Personalizar mi página')
  expect(html).toContain('https://escuela.online/admin/configuracion')
  expect(html).toContain('Restaurar diseño original')
  // Una escuela CON WhatsApp no recibe el aviso de que no tiene botones.
  expect(html).not.toContain('sin botones de WhatsApp')
})

test('personalizar: la escuela sin WhatsApp recibe el aviso de cómo encender sus botones', () => {
  const html = personalizar({ ...BASE, sinWhatsApp: true })
  expect(html).toContain('sin botones de WhatsApp')
  expect(html).toContain('aparecen solos')
})
