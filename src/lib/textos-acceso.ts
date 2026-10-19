/**
 * Textos del panel lateral de /login y /register.
 *
 * Estaban escritos a mano: «Acompañamiento para tu certificado SEP», «Centro de
 * Apoyo para la Acreditación de Conocimientos», «Secundaria y Preparatoria». En
 * una escuela solo_cursos o que no certifica (`ofreceCertificacion: false`)
 * eso promete un certificado que la escuela no gestiona (encontrado en CAAIV #288).
 *
 * 🛑 DE FÁBRICA (certifica y modo tradicional) SALEN LOS LITERALES DE SIEMPRE,
 *    letra por letra: lo vigila tests/unit/textos-acceso.spec.ts.
 * Puro: recibe lo que necesita; `textosAccesoDeConfig()` lo arma con CONFIG.
 */
import { CONFIG } from '@/lib/config'
import { esSoloCursos } from '@/lib/modo'

export type TextosAcceso = {
  /** Las cuatro (o tres) viñetas con palomita. */
  beneficios: string[]
  /** Párrafo bajo el título del login. */
  lemaLogin: string
  /** Párrafo bajo el título del registro. */
  lemaRegistro: string
  /** Insignia inferior: línea chica en mayúsculas y línea fuerte. */
  insignia: { arriba: string; abajo: string }
}

export function textosAcceso(o: {
  soloCursos: boolean
  certifica: boolean
  /** Lo que vende la escuela («Secundaria y Preparatoria»); lo calcula cada pantalla. */
  oferta: string
  nombreCompleto: string
}): TextosAcceso {
  if (!o.soloCursos && o.certifica) {
    return {
      beneficios: [
        'Acompañamiento para tu certificado SEP',
        'Estudia desde casa, a tu ritmo',
        'Centro de Apoyo para la Acreditación de Conocimientos',
        o.oferta,
      ],
      lemaLogin: 'Estudia desde la comodidad de tu hogar y obtén acompañamiento en tu certificación.',
      lemaRegistro: 'Únete a alumnos que han completado su trayectoria educativa con nosotros.',
      insignia: { arriba: 'CENTRO DE APOYO', abajo: 'Acreditación de Conocimientos' },
    }
  }
  return {
    beneficios: o.soloCursos
      ? ['Cursos en línea con lecciones en video', 'Estudia desde casa, a tu ritmo', 'Acceso desde cualquier dispositivo, las 24 horas']
      : ['Acompañamiento académico en línea', 'Estudia desde casa, a tu ritmo', o.oferta],
    lemaLogin: 'Estudia desde la comodidad de tu hogar, a tu ritmo.',
    lemaRegistro: o.soloCursos
      ? 'Crea tu cuenta y empieza a prepararte a tu ritmo.'
      : 'Crea tu cuenta y estudia desde casa, a tu ritmo.',
    insignia: { arriba: '100% EN LÍNEA', abajo: o.nombreCompleto },
  }
}

export function textosAccesoDeConfig(oferta: string, nombreCompleto: string): TextosAcceso {
  return textosAcceso({ soloCursos: esSoloCursos(), certifica: Boolean(CONFIG.ofreceCertificacion), oferta, nombreCompleto })
}
