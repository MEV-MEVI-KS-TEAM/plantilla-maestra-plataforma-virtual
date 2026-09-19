/**
 * Pagina de verdad el Documento de Entrega Oficial.
 *
 * ⚠️ Cada `.page` mide once pulgadas y recorta lo que sobra SIN DECIR NADA.
 * Una sección que crece —una carrera más, un aviso legal nuevo, un cliente con
 * más oferta que el de ayer— se lleva por delante lo último que se escribió, y
 * el documento sale con una frase cortada a media línea. Nadie lo ve hasta que
 * lo ve el cliente.
 *
 * Aquí lo que no cabe se pasa a una página nueva, con su misma cabecera y su
 * mismo pie, y los números se renumeran al final. Así el diseño de página fija
 * se mantiene y ninguna sección obliga a adivinar cuánto texto entra.
 *
 * 🐞 HTI #205 (Bug 185): con 10 licenciaturas, la tabla «Contenido cargado» no
 * cabía junto a su título. Se movía sola a una página nueva, esa página recibía
 * su rótulo «(continúa)», volvía a no caber porque rótulo + tabla seguían siendo
 * dos hijos, y la tabla se movía otra vez… **408 páginas vacías** hasta agotar la
 * guardia, y todo lo que venía después se quedaba sin paginar. Por eso:
 *   - un rótulo «(continúa)» o un encabezado NO cuentan como contenido: una
 *     página que solo tiene eso más un bloque grande no se arregla moviéndolo;
 *   - una tabla de datos que no cabe ni sola se parte por filas, repitiendo su
 *     fila de encabezado;
 *   - cualquier otro bloque indivisible se queda donde está y se reporta.
 *
 * 🛑 Corre DENTRO del navegador (`pag.evaluate(repartirPaginas)`): Playwright
 * serializa la función, así que no puede usar nada de este módulo ni de Node.
 * Recibe el documento como parámetro solo para poder probarse con un DOM de
 * mentira (`tests/unit/entrega-paginador.spec.ts`); en el navegador se llama sin
 * argumentos y usa `document`.
 *
 * @returns {{ paginas: number, movidos: number, rebeldes: Array<{ pagina: number, titulo: string, sobra: number }> }}
 */
export function repartirPaginas(doc) {
  const d = doc || document
  const todas = () => [...d.querySelectorAll('.page')]
  const cabe = (pagina) => {
    const cuerpo = pagina.querySelector('.body')
    return cuerpo.scrollHeight - cuerpo.clientHeight <= 2
  }
  const esRelleno = (el) => el.classList.contains('cont') || /^H[1-4]$/.test(el.tagName)
  const sustantivos = (cuerpo) => [...cuerpo.children].filter(el => !esRelleno(el)).length

  /** Página nueva, calcada de `pagina` pero con el cuerpo vacío, justo después. */
  const paginaVacia = (pagina) => {
    const nueva = pagina.cloneNode(true)
    nueva.querySelector('.body').innerHTML = ''
    pagina.after(nueva)
    return nueva
  }

  /** Quien lea una página suelta tiene que saber de qué sección viene. */
  const rotular = (i, cuerpoNuevo) => {
    const deDonde = todas()
      .slice(0, i + 1).reverse()
      .map(p => p.querySelector('.body h2'))
      .find(Boolean)?.textContent?.trim()
    if (!deDonde) return
    const rotulo = d.createElement('p')
    rotulo.className = 'cont'
    rotulo.textContent = `${deDonde} (continúa)`
    cuerpoNuevo.insertBefore(rotulo, cuerpoNuevo.firstChild)
  }

  const movidos = []
  let guardia = 0
  for (let i = 0; i < todas().length; i++) {
    const pagina = todas()[i]
    const cuerpo = pagina.querySelector('.body')
    if (cabe(pagina)) continue

    // Un solo bloque de contenido y no cabe: moverlo no arregla nada. Si es una
    // tabla de datos se parte por filas; si no, se queda y se reporta abajo.
    if (sustantivos(cuerpo) < 2) {
      const tabla = [...cuerpo.children].find(el => !esRelleno(el))
      if (!tabla || !tabla.matches('table.dt')) continue
      const filas = [...tabla.querySelectorAll('tr')]
      if (filas.length < 3) continue
      const resto = tabla.cloneNode(false)
      resto.appendChild(filas[0].cloneNode(true))
      const encabezado = resto.firstChild
      // Siempre quedan arriba el encabezado y al menos una fila.
      while (!cabe(pagina) && tabla.querySelectorAll('tr').length > 2 && guardia++ < 5000) {
        const trs = tabla.querySelectorAll('tr')
        resto.insertBefore(trs[trs.length - 1], encabezado.nextSibling)
        movidos.push('tr')
      }
      if (resto.querySelectorAll('tr').length < 2) continue
      const nueva = paginaVacia(pagina)
      nueva.querySelector('.body').appendChild(resto)
      rotular(i, nueva.querySelector('.body'))
      continue
    }

    const nueva = paginaVacia(pagina)
    const cuerpoNuevo = nueva.querySelector('.body')

    // Se pasan bloques del final hasta que la de arriba respire. Siempre queda
    // al menos un bloque de CONTENIDO: un título o un rótulo solos no cuentan.
    while (!cabe(pagina) && cuerpo.children.length > 1 &&
           (sustantivos(cuerpo) > 1 || esRelleno(cuerpo.lastElementChild)) && guardia++ < 5000) {
      const ultimo = cuerpo.lastElementChild
      cuerpoNuevo.insertBefore(ultimo, cuerpoNuevo.firstChild)
      movidos.push(ultimo.tagName.toLowerCase())
    }

    // Un encabezado no se queda solo al pie de una página con su contenido en
    // la siguiente. Se va con él.
    while (cuerpo.children.length > 1 && /^H[2-4]$/.test(cuerpo.lastElementChild?.tagName ?? '')) {
      cuerpoNuevo.insertBefore(cuerpo.lastElementChild, cuerpoNuevo.firstChild)
    }

    if (!cuerpoNuevo.children.length) { nueva.remove(); continue }

    // Se rotula salvo que empiece por un título de SECCIÓN: un <h3> es un
    // subtítulo y no dice de dónde viene la página.
    if (!/^H[12]$/.test(cuerpoNuevo.firstElementChild?.tagName ?? '')) rotular(i, cuerpoNuevo)
  }

  // Renumerar: los números de página se escribieron antes de repartir.
  const paginas = todas()
  paginas.forEach((p, i) => {
    const pg = p.querySelector('.pg')
    if (pg) pg.textContent = `Pág. ${i + 1}`
  })
  // Lo que siga sin caber después de repartir es un bloque indivisible.
  const rebeldes = paginas.map((p, i) => {
    const c = p.querySelector('.body')
    const sobra = c.scrollHeight - c.clientHeight
    return sobra > 4
      ? { pagina: i + 1, titulo: p.querySelector('h2, h3')?.textContent?.trim().slice(0, 46) ?? '', sobra: Math.round(sobra) }
      : null
  }).filter(Boolean)
  return { paginas: paginas.length, movidos: movidos.length, rebeldes }
}
