import Link from 'next/link'
import type { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `Términos y Condiciones | ${CONFIG.nombre}`,
  description: `Términos y condiciones de uso de los servicios de ${CONFIG.nombreCompleto}.`,
}

const FECHA_VIGENCIA = '11 de mayo de 2025'
const RAZON_SOCIAL  = CONFIG.nombreCompleto
const DOMINIO       = CONFIG.dominio
const EMAIL         = CONFIG.contactoEmail

export default function TerminosCondicionesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: 'rgba(224,235,255,0.85)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Inicio
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>{RAZON_SOCIAL}</span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Title block */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(0,102,255,0.15)', border: '1px solid rgba(0,102,255,0.3)', color: '#60A5FA', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 16 }}>
            DOCUMENTO LEGAL
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
            Términos y Condiciones
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>
            Última actualización: {FECHA_VIGENCIA}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="1. Aceptación de los Términos">
            <p>
              Al acceder y utilizar la plataforma educativa de{' '}
              <strong style={{ color: '#fff' }}>{RAZON_SOCIAL}</strong> (en adelante &quot;la Plataforma&quot;),
              disponible en <em>{DOMINIO}</em>, usted acepta quedar vinculado por estos Términos y Condiciones,
              nuestra Política de Privacidad y todas las leyes y reglamentos aplicables.
            </p>
            <p>
              Si no está de acuerdo con alguno de estos términos, le pedimos que se abstenga de utilizar
              nuestros servicios. El uso continuado de la Plataforma tras la publicación de modificaciones
              constituye su aceptación de los términos revisados.
            </p>
          </Section>

          <Section title="2. Descripción del Servicio">
            <p>
              {RAZON_SOCIAL} ofrece programas de educación a distancia para la obtención de certificados
              oficiales de <strong style={{ color: '#fff' }}>Secundaria</strong> y{' '}
              <strong style={{ color: '#fff' }}>Preparatoria</strong> avalados por la Secretaría de Educación
              Pública (SEP) de México, mediante convenio con instituciones incorporadas. Nuestros servicios incluyen:
            </p>
            <ul>
              <li>Acceso a la plataforma de aprendizaje en línea.</li>
              <li>Acompañamiento académico y seguimiento personalizado.</li>
              <li>Gestión y trámite del proceso de acreditación ante la SEP.</li>
              <li>Emisión de constancias de avance y certificado oficial al término del programa.</li>
              <li>Soporte técnico y atención al alumno.</li>
            </ul>
          </Section>

          <Section title="3. Garantía de Certificación">
            <p>
              {RAZON_SOCIAL} ofrece una <strong style={{ color: '#fff' }}>garantía de certificación</strong>:
              si el alumno cumple con todos los requisitos del programa, se compromete a gestionar la obtención
              del certificado oficial hasta su entrega. Esta garantía aplica bajo las siguientes condiciones:
            </p>
            <ul>
              <li>El alumno debe completar el <strong style={{ color: '#fff' }}>100% de las actividades</strong> y evaluaciones de su programa.</li>
              <li>La documentación requerida por la SEP debe ser entregada correcta y oportunamente.</li>
              <li>El alumno debe estar al corriente en sus pagos durante todo el programa.</li>
              <li>La información proporcionada al inscribirse debe ser veraz y auténtica.</li>
            </ul>
            <p>
              Los tiempos de emisión del certificado oficial dependen de los plazos administrativos de la SEP
              y las instituciones de convenio, los cuales están fuera del control directo de {RAZON_SOCIAL}.
              Nuestro compromiso es el acompañamiento completo del proceso hasta la entrega.
            </p>
          </Section>

          <Section title="4. Inscripción y Cuenta de Usuario">
            <p>
              Para acceder a los servicios de la Plataforma, el usuario debe crear una cuenta proporcionando
              información veraz, completa y actualizada. El usuario es responsable de:
            </p>
            <ul>
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Todas las actividades que ocurran bajo su cuenta.</li>
              <li>Notificar inmediatamente a {RAZON_SOCIAL} de cualquier uso no autorizado de su cuenta.</li>
              <li>Proporcionar documentación académica auténtica y legible en los formatos solicitados.</li>
            </ul>
            <p>
              {RAZON_SOCIAL} se reserva el derecho de suspender o cancelar cuentas que proporcionen
              información falsa, fraudulenta o que incumplan estos Términos.
            </p>
          </Section>

          <Section title="5. Pagos y Política de Reembolsos">
            <p>
              Los precios de los programas se publican en el sitio web y pueden actualizarse. El pago de la
              inscripción y mensualidades debe realizarse en los plazos acordados al momento del registro.
            </p>
            <p><strong style={{ color: '#fff' }}>Política de reembolsos:</strong></p>
            <ul>
              <li>
                <strong style={{ color: '#fff' }}>Cancelación antes del inicio:</strong> reembolso del 100%
                de la inscripción si se solicita dentro de los 3 días hábiles siguientes al pago.
              </li>
              <li>
                <strong style={{ color: '#fff' }}>Cancelación durante el programa:</strong> no se realizan
                reembolsos de mensualidades ya pagadas. Los créditos obtenidos se conservan en el expediente
                del alumno por 12 meses para posible reanudación.
              </li>
              <li>
                <strong style={{ color: '#fff' }}>Incumplimiento de pago:</strong> puede resultar en la
                suspensión temporal del acceso a la Plataforma hasta regularizar el adeudo.
              </li>
            </ul>
            <p>
              Para solicitudes de reembolso, contáctenos en{' '}
              <a href={`mailto:${EMAIL}`} style={{ color: '#60A5FA' }}>{EMAIL}</a> con el asunto
              &quot;Solicitud de Reembolso&quot; dentro de los plazos indicados.
            </p>
          </Section>

          <Section title="6. Conducta del Usuario">
            <p>El usuario se compromete a utilizar la Plataforma de manera responsable y a no:</p>
            <ul>
              <li>Compartir sus credenciales de acceso con terceros.</li>
              <li>Presentar documentos académicos falsificados o alterados.</li>
              <li>Reproducir, distribuir o comercializar el contenido de la Plataforma sin autorización.</li>
              <li>Realizar actividades que interfieran con el funcionamiento técnico de la Plataforma.</li>
              <li>Acosar, amenazar o perjudicar a otros usuarios o al personal de {RAZON_SOCIAL}.</li>
              <li>Utilizar la Plataforma para actividades ilegales o contrarias a la moral.</li>
            </ul>
            <p>
              El incumplimiento de estas normas puede resultar en la baja inmediata del programa
              sin derecho a reembolso.
            </p>
          </Section>

          <Section title="7. Propiedad Intelectual">
            <p>
              Todo el contenido disponible en la Plataforma — incluyendo textos, imágenes, videos,
              materiales de estudio, logotipos y diseño — es propiedad de{' '}
              <strong style={{ color: '#fff' }}>{RAZON_SOCIAL}</strong> o de sus proveedores de contenido,
              y está protegido por las leyes mexicanas e internacionales de derechos de autor y propiedad intelectual.
            </p>
            <p>
              Se otorga al usuario una licencia <strong style={{ color: '#fff' }}>personal, no exclusiva
              e intransferible</strong> para acceder y utilizar el contenido exclusivamente para sus
              fines educativos dentro del programa. Queda prohibida cualquier reproducción,
              distribución o explotación comercial sin autorización expresa por escrito.
            </p>
          </Section>

          <Section title="8. Limitación de Responsabilidad">
            <p>
              {RAZON_SOCIAL} no será responsable por:
            </p>
            <ul>
              <li>Interrupciones del servicio por mantenimiento, fuerza mayor o fallas de terceros.</li>
              <li>
                Demoras en la emisión del certificado oficial causadas por los plazos de la SEP
                o instituciones de convenio.
              </li>
              <li>Pérdida de datos causada por el usuario o por circunstancias fuera de nuestro control.</li>
              <li>Daños indirectos, incidentales o consecuentes derivados del uso de la Plataforma.</li>
            </ul>
            <p>
              La responsabilidad máxima de {RAZON_SOCIAL} frente al usuario estará limitada al monto
              efectivamente pagado por el programa en los últimos 3 meses.
            </p>
          </Section>

          <Section title="9. Privacidad y Protección de Datos">
            <p>
              El tratamiento de sus datos personales se rige por nuestro{' '}
              <Link href="/aviso-de-privacidad" style={{ color: '#60A5FA' }}>
                Aviso de Privacidad
              </Link>
              , el cual forma parte integrante de estos Términos y Condiciones, y cumple con la
              Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </Section>

          <Section title="10. Modificaciones al Servicio y a los Términos">
            <p>
              {RAZON_SOCIAL} se reserva el derecho de modificar, suspender o descontinuar cualquier
              aspecto de la Plataforma o de estos Términos en cualquier momento. Los cambios materiales
              serán notificados con al menos <strong style={{ color: '#fff' }}>15 días naturales</strong> de
              anticipación mediante aviso en la Plataforma y/o correo electrónico.
            </p>
            <p>
              Si el usuario no acepta los nuevos términos, podrá solicitar la cancelación de su cuenta
              antes de la fecha de entrada en vigor, sin penalización adicional.
            </p>
          </Section>

          <Section title="11. Legislación Aplicable y Jurisdicción">
            <p>
              Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de los
              <strong style={{ color: '#fff' }}> Estados Unidos Mexicanos</strong>. Para cualquier
              controversia derivada de su interpretación o cumplimiento, las partes se someten a la
              jurisdicción de los tribunales competentes de la Ciudad de México, renunciando expresamente
              a cualquier otro fuero que pudiera corresponderles.
            </p>
            <p>
              Para consultas o aclaraciones sobre estos Términos, contáctenos en:{' '}
              <a href={`mailto:${EMAIL}`} style={{ color: '#60A5FA' }}>{EMAIL}</a>
            </p>
          </Section>

          {/* Footer links */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/aviso-de-privacidad" style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.875rem' }}>
              Aviso de Privacidad →
            </Link>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.875rem' }}>
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9375rem', lineHeight: 1.75, color: 'rgba(224,235,255,0.75)' }}>
        {children}
      </div>
    </section>
  )
}
