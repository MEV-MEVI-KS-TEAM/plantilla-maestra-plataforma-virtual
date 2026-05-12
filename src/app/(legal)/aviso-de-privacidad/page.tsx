import Link from 'next/link'
import type { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `Aviso de Privacidad | ${CONFIG.nombre}`,
  description: `Aviso de privacidad de ${CONFIG.nombreCompleto} conforme a la LFPDPPP.`,
}

const FECHA_VIGENCIA = '11 de mayo de 2025'
const RAZON_SOCIAL  = CONFIG.nombreCompleto
const DOMINIO       = CONFIG.dominio
const EMAIL         = CONFIG.contactoEmail

export default function AvisoPrivacidadPage() {
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
            Aviso de Privacidad
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>
            Última actualización: {FECHA_VIGENCIA}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <Section title="1. Responsable del Tratamiento de Datos Personales">
            <p>
              <strong style={{ color: '#fff' }}>{RAZON_SOCIAL}</strong> (en adelante &quot;el Responsable&quot;),
              con presencia digital en <em>{DOMINIO}</em>, es responsable del uso y
              protección de sus datos personales, y al respecto le informamos lo siguiente,
              en cumplimiento con la <strong style={{ color: '#fff' }}>Ley Federal de Protección de Datos
              Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento.
            </p>
            <p>
              Para cualquier asunto relacionado con este Aviso de Privacidad, puede
              contactarnos en: <a href={`mailto:${EMAIL}`} style={{ color: '#60A5FA' }}>{EMAIL}</a>
            </p>
          </Section>

          <Section title="2. Datos Personales que Recabamos">
            <p>Para las finalidades señaladas en este aviso, recabamos los siguientes datos personales:</p>
            <ul>
              <li><strong style={{ color: '#fff' }}>Datos de identificación:</strong> nombre(s), apellido paterno, apellido materno.</li>
              <li><strong style={{ color: '#fff' }}>Datos de contacto:</strong> correo electrónico, número de teléfono/WhatsApp.</li>
              <li><strong style={{ color: '#fff' }}>Datos académicos:</strong> nivel educativo de interés, modalidad de estudio seleccionada.</li>
              <li><strong style={{ color: '#fff' }}>Documentos de inscripción:</strong> CURP, acta de nacimiento, certificados de estudios previos, identificación oficial, fotografía.</li>
              <li><strong style={{ color: '#fff' }}>Datos de acceso a plataforma:</strong> dirección de correo electrónico y contraseña cifrada.</li>
              <li><strong style={{ color: '#fff' }}>Datos de navegación:</strong> dirección IP, tipo de dispositivo, browser, páginas visitadas (ver sección Cookies).</li>
            </ul>
            <p>
              No recabamos datos personales sensibles en el sentido del artículo 3 fracción VI de la LFPDPPP
              (origen racial, estado de salud, vida sexual, creencias religiosas o filosóficas, afiliación sindical o política).
            </p>
          </Section>

          <Section title="3. Finalidades del Tratamiento">
            <p><strong style={{ color: '#fff' }}>Finalidades primarias</strong> (necesarias para la relación jurídica):</p>
            <ul>
              <li>Crear y administrar tu cuenta de alumno en la plataforma.</li>
              <li>Gestionar tu inscripción al programa de Secundaria o Preparatoria.</li>
              <li>Verificar y validar documentos académicos requeridos por las autoridades educativas.</li>
              <li>Brindar acompañamiento durante el proceso de acreditación ante la SEP.</li>
              <li>Emitir constancias de avance académico y gestionar el certificado oficial.</li>
              <li>Procesar pagos y gestionar cobranza.</li>
              <li>Atender solicitudes, aclaraciones y soporte técnico.</li>
            </ul>
            <p><strong style={{ color: '#fff' }}>Finalidades secundarias</strong> (puedes negarte sin afectar la relación):</p>
            <ul>
              <li>Envío de comunicaciones informativas sobre nuestros programas y servicios.</li>
              <li>Evaluación de la satisfacción del servicio mediante encuestas.</li>
              <li>Generación de estadísticas internas con fines de mejora.</li>
            </ul>
            <p>
              Si no deseas que tus datos sean tratados para finalidades secundarias, envíanos un correo
              a <a href={`mailto:${EMAIL}`} style={{ color: '#60A5FA' }}>{EMAIL}</a> con el asunto
              &quot;Oposición finalidades secundarias&quot;.
            </p>
          </Section>

          <Section title="4. Transferencias de Datos Personales">
            <p>
              Sus datos personales pueden ser transferidos y tratados dentro y fuera del país por
              terceros en los siguientes casos:
            </p>
            <ul>
              <li><strong style={{ color: '#fff' }}>Supabase Inc.</strong> — infraestructura de base de datos y autenticación (servidores en EE.UU.). Cumple con el marco SCCs / adecuación GDPR.</li>
              <li><strong style={{ color: '#fff' }}>Vercel Inc.</strong> — plataforma de hospedaje y distribución del sitio web.</li>
              <li><strong style={{ color: '#fff' }}>Autoridades educativas (SEP / instituciones convenio)</strong> — exclusivamente los datos necesarios para el trámite de certificación oficial.</li>
              <li><strong style={{ color: '#fff' }}>Proveedores de pago</strong> — datos de transacción para procesar pagos de inscripción y mensualidades.</li>
            </ul>
            <p>
              Las transferencias anteriores se realizan sin requerir su consentimiento expreso conforme
              al artículo 37 de la LFPDPPP, por ser necesarias para la relación jurídica o estar
              previstas en otras leyes.
            </p>
          </Section>

          <Section title="5. Derechos ARCO y Cómo Ejercerlos">
            <p>
              Tiene derecho a <strong style={{ color: '#fff' }}>Acceder</strong> a sus datos personales,{' '}
              <strong style={{ color: '#fff' }}>Rectificarlos</strong> cuando sean inexactos o incompletos,{' '}
              <strong style={{ color: '#fff' }}>Cancelarlos</strong> cuando no sean necesarios para las
              finalidades del tratamiento, u{' '}
              <strong style={{ color: '#fff' }}>Oponerse</strong> al tratamiento para finalidades
              secundarias (derechos ARCO).
            </p>
            <p>Para ejercer sus derechos ARCO, envíe su solicitud a:</p>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '20px 24px', margin: '12px 0' }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>Correo electrónico:</p>
              <a href={`mailto:${EMAIL}`} style={{ color: '#60A5FA', fontSize: '1rem' }}>{EMAIL}</a>
              <p style={{ margin: '12px 0 4px', color: '#fff', fontWeight: 600 }}>Asunto:</p>
              <p style={{ margin: 0, color: 'rgba(224,235,255,0.7)' }}>Ejercicio de Derechos ARCO — [Acceso / Rectificación / Cancelación / Oposición]</p>
              <p style={{ margin: '12px 0 4px', color: '#fff', fontWeight: 600 }}>Incluir en la solicitud:</p>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                <li>Nombre completo y correo registrado en la plataforma.</li>
                <li>Descripción clara del derecho que desea ejercer.</li>
                <li>Copia de identificación oficial (para acreditar identidad).</li>
              </ul>
            </div>
            <p>
              Responderemos en un plazo máximo de <strong style={{ color: '#fff' }}>20 días hábiles</strong> a
              partir de la recepción de su solicitud completa.
            </p>
          </Section>

          <Section title="6. Medidas de Seguridad">
            <p>
              Implementamos medidas técnicas, administrativas y físicas para proteger sus datos personales
              contra daño, pérdida, alteración, destrucción o acceso no autorizado:
            </p>
            <ul>
              <li>Transmisión cifrada mediante protocolo HTTPS/TLS.</li>
              <li>Contraseñas almacenadas con hash seguro (nunca en texto plano).</li>
              <li>Acceso restringido a datos personales, limitado al personal autorizado.</li>
              <li>Infraestructura con auditorías de seguridad (Supabase SOC 2).</li>
              <li>Copias de seguridad periódicas.</li>
            </ul>
          </Section>

          <Section title="7. Uso de Cookies y Tecnologías de Rastreo">
            <p>
              Nuestro sitio utiliza cookies y tecnologías similares para mejorar la experiencia
              de navegación. Estas pueden ser:
            </p>
            <ul>
              <li><strong style={{ color: '#fff' }}>Cookies esenciales:</strong> necesarias para la autenticación y funcionamiento de la plataforma. No pueden desactivarse.</li>
              <li><strong style={{ color: '#fff' }}>Cookies analíticas:</strong> nos permiten medir el tráfico y mejorar la plataforma (p. ej. Vercel Analytics).</li>
            </ul>
            <p>
              Puede configurar su navegador para rechazar o eliminar cookies no esenciales. Sin embargo,
              deshabilitar cookies esenciales puede impedir el correcto funcionamiento de su cuenta.
            </p>
          </Section>

          <Section title="8. Cambios a este Aviso de Privacidad">
            <p>
              Nos reservamos el derecho de actualizar este Aviso de Privacidad en cualquier momento.
              Cuando realicemos cambios materiales, lo notificaremos mediante un aviso visible en{' '}
              <strong style={{ color: '#fff' }}>{DOMINIO}</strong> y/o por correo electrónico al
              que registró en la plataforma. La fecha de la última actualización siempre se indicará
              al inicio de este documento.
            </p>
            <p>
              Si continúa usando nuestros servicios después de que los cambios entren en vigor,
              se entenderá que los acepta.
            </p>
          </Section>

          {/* Footer links */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/terminos-y-condiciones" style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.875rem' }}>
              Términos y Condiciones →
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
