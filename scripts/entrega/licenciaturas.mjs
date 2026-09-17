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
 * Cada plan activo con lo que paga el alumno de principio a fin:
 * inscripción + mensualidad × meses + titulación. `[]` si la titulación no se
 * cobra aparte: entonces la tabla de siempre sigue siendo correcta.
 */
export function desglosesLicenciatura(lic, carreras) {
  if (!titulacionAparte(lic, carreras)) return []
  const inscripcion = Number(lic.inscripcion) || 0
  const titulacion = Number(lic.certificacion)
  return (lic.modalidades || [])
    .filter(m => m && m.activa !== false && Number(m.meses) > 0)
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
