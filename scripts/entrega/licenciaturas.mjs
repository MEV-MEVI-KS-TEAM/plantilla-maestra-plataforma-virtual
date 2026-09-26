/**
 * licenciaturas.mjs — el costo de una licenciatura contado como lo paga el
 * alumno, para el Documento de Entrega Oficial y el mensaje de WhatsApp.
 *
 * Existe porque el generador anunciaba «Total del plan» a lo que era solo la
 * colegiatura (mensualidad × meses) y dejaba la titulación en una fila suelta
 * de «Certificación profesional». En una licenciatura con titulación de precio
 * propio esa cifra es la MAYOR parte del costo: en INSPIRA #203 el 62–65 %, en
 * UVEP #209 el 56–59 %. Las dos escuelas lo publican en su página con el
 * desglose completo, y el documento que archivan decía otra cosa. Se arregló a
 * mano en los dos clones; aquí queda para todos.
 *
 * JS puro y sin importar nada: `documento.mjs` lo importa y un `import` de
 * vuelta haría el ciclo. Los montos salen en números; formatear es de quien
 * llama. `tests/unit/entrega-licenciaturas.spec.ts` lo prueba.
 */

/** «A», «A y B», «A, B y C». Con tres carreras, «A y B y C» parece un error de dedo. */
export const unirConY = (xs) => xs.length > 1
  ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`
  : (xs[0] ?? '')

const tipoDe = (c) => c?.tipo || 'licenciatura'

/** ¿Todo lo vendido es licenciatura? Decide el género y el sustantivo de las frases. */
export const soloLicenciaturas = (carreras = []) =>
  carreras.length > 0 && carreras.every(c => tipoDe(c) === 'licenciatura')

/**
 * ¿La titulación se cobra aparte y hay que sumarla al costo del plan?
 *
 * No, si viene incluida en el plan (`titulacionIncluida`), si hay rutas de
 * titulación (cada ruta trae su propio precio y su propia tabla) o si lo
 * vendido no incluye ninguna licenciatura: `certificacion` en una escuela de
 * puros diplomados no es una titulación.
 */
export function titulacionAparte(lic, carreras = lic?.carreras || []) {
  if (!lic || lic.titulacionIncluida) return false
  if (!(Number(lic.certificacion) > 0)) return false
  if ((lic.rutas || []).some(r => r && r.activa !== false)) return false
  return carreras.some(c => tipoDe(c) === 'licenciatura')
}

/**
 * ¿Se vende este plan de licenciatura? La MISMA regla que la landing
 * (`getDesglosesLicenciatura` en src/lib/licenciatura-utils.ts): activo, con
 * meses y con mensualidad. Un plan con mensualidad 0 la página lo esconde, y el
 * documento lo anunciaba como «6 × Gratis» (`mxn(0)` es «Gratis»): un plan gratis
 * que nadie quiso vender (#194). Copiada, no importada —este archivo no importa
 * nada—; `tests/unit/entrega-lic-vendible.spec.ts` prueba la paridad con la de
 * la landing.
 */
export const planLicVendible = (m) =>
  !!m && m.activa !== false && Number(m.meses) > 0 && Number(m.mensualidad) > 0

/**
 * Los planes activos y con meses que NO se venden por falta de mensualidad: el
 * documento y la página los omiten, pero el registro los sigue ofreciendo
 * (filtra solo `activa`). Para avisarlo en «REVISA ANTES DE ENVIAR».
 *
 * Sin los `*_dip`: son el plan de los diplomados del riel, y su precio vive en
 * la carrera (`precio`), no en esta tabla. Avisar de ellos sería un falso
 * positivo, y apagarlos le quitaría el plan al registro de los diplomados.
 */
export const planesLicSinMensualidad = (lic) =>
  (lic?.modalidades || []).filter(m => m && m.activa !== false && !/_dip$/.test(String(m.id ?? ''))
    && Number(m.meses) > 0 && !(Number(m.mensualidad) > 0))

/**
 * Cada plan que se vende con lo que paga el alumno de principio a fin:
 * inscripción + mensualidad × meses + titulación. `[]` si la titulación no se
 * cobra aparte: entonces la tabla de siempre sigue siendo correcta.
 */
export function desglosesLicenciatura(lic, carreras) {
  if (!titulacionAparte(lic, carreras)) return []
  const inscripcion = Number(lic.inscripcion) || 0
  const titulacion = Number(lic.certificacion)
  return (lic.modalidades || [])
    .filter(planLicVendible)
    .map(m => {
      const meses = Number(m.meses)
      const mensualidad = Number(m.mensualidad) || 0
      const colegiatura = mensualidad * meses
      const total = inscripcion + colegiatura + titulacion
      return {
        id: m.id, label: m.label || m.id, meses, mensualidad,
        inscripcion, colegiatura, titulacion, total,
        porcentaje: Math.round((titulacion / total) * 100),
      }
    })
}

/** «el 59 %» · «entre el 56 y el 59 %» · '' sin planes. */
export function porcentajeTitulacionTexto(desgloses = []) {
  const ps = [...new Set(desgloses.map(d => d.porcentaje))].sort((a, b) => a - b)
  if (!ps.length) return ''
  return ps.length === 1 ? `el ${ps[0]} %` : `entre el ${ps[0]} y el ${ps[ps.length - 1]} %`
}

/**
 * «tus 3 licenciaturas», «tu programa», «tus 2 programas de pago único».
 *
 * La frase decía «de pago único» a TODO programa, y una licenciatura se paga
 * mes a mes: se le anunciaba al cliente un modelo de cobro que no vendió. Solo
 * se dice cuando todos tienen precio único y ninguno mensualidad.
 */
export function nombrarProgramas(carreras = []) {
  const n = carreras.length
  if (!n) return ''
  const base = soloLicenciaturas(carreras)
    ? (n === 1 ? 'tu licenciatura' : `tus ${n} licenciaturas`)
    : (n === 1 ? 'tu programa' : `tus ${n} programas`)
  const pagoUnico = carreras.every(c => Number(c.precio?.publico) > 0 && !Number(c.precio?.mensual))
  return pagoUnico ? `${base} de pago único` : base
}

/**
 * Las carreras con el nombre VISIBLE publicado en «Personalizar mi página»
 * (`landing.licenciaturas_carreras`, casado por `slug`), con la MISMA regla que
 * la tarjeta de la landing (`resolverTextosLicenciaturas`): el nombre publicado
 * se recorta; vacío o ausente, queda el de config.ts; un slug que ya no existe
 * se ignora; un diplomado del riel (`esDiplomado`) no tiene tarjeta y no cambia.
 * `interp` sustituye los comodines ({nombre}…) como la landing. Si después queda
 * alguno sin resolver ({duracion}, {whatsapp}…, que la landing llena con sus
 * propios datos), el nombre publicado NO se usa: queda el de config.ts y se marca
 * con `comodinSinResolver` (el nombre publicado tal cual) para avisarlo.
 *
 * Antes el documento y el WhatsApp decían el nombre de config.ts aunque el admin
 * lo hubiera cambiado en su página. Lo que cambia se marca con `nombreConfig`
 * (el de config.ts), para avisar en «REVISA»: el registro, el panel y las
 * constancias siguen usando el de config.ts.
 *
 * 🛑 `tipo` tiene que venir YA decidido: el tipo de programa se deduce del
 * nombre de config.ts, y un nombre publicado no lo cambia. Copiada de la regla
 * de la landing, no importada —este archivo no importa nada—;
 * `tests/unit/entrega-remate-d.spec.ts` prueba la paridad.
 */
export function conNombresPublicados(carreras = [], publicadas, interp = (s) => s) {
  const porSlug = new Map((Array.isArray(publicadas) ? publicadas : [])
    .filter(p => p && typeof p.slug === 'string')
    .map(p => [p.slug, p]))
  return carreras.map(c => {
    const p = c?.esDiplomado === true ? null : porSlug.get(c?.slug)
    const propio = typeof p?.nombre === 'string' ? p.nombre.trim() : ''
    if (!propio) return c
    const nombre = interp(propio)
    // «Derecho ({duracion})» impreso tal cual es peor que el nombre de config.ts.
    if (/\{[A-Za-z_][A-Za-z0-9_]*\}/.test(nombre)) return { ...c, comodinSinResolver: propio }
    // El mismo nombre publicado otra vez no es un cambio: sin aviso.
    return nombre === c.nombre ? c : { ...c, nombre, nombreConfig: c.nombre }
  })
}

/**
 * «4 materias por mes» · «1 materia por mes» · «2.67 materias por mes, en promedio».
 *
 * 32 materias en 12 meses dan 2.67 al mes: la plataforma abre 3, 6, 9… y la
 * última cae en el mes 12 (Bug 115). Sin el «en promedio», «2.67 materias por
 * mes» se lee como un error de captura en el papel que el cliente archiva.
 */
export function ritmoDeApertura(materiasPorMes) {
  const n = Number(materiasPorMes)
  if (!(n > 0)) return ''
  if (Number.isInteger(n)) return `${n} materia${n === 1 ? '' : 's'} por mes`
  return `${n} materias por mes, en promedio`
}
