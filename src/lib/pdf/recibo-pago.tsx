import { existsSync } from 'fs'
import path from 'path'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { CONFIG } from '@/lib/config'
import { getSiteConfig, type SiteConfig } from '@/lib/site-config'

/**
 * Lo que el recibo toma de la config fusionada (defaults + overrides del
 * admin). `urlBase` NO está aquí: no es editable y sigue saliendo de CONFIG.
 */
type ReciboBranding = Pick<SiteConfig, 'nombreCompleto' | 'whatsappDisplay' | 'logo' | 'logoOscuro'>

export interface ReciboData {
  folio: string
  alumnoNombre: string
  matricula: string | null
  concepto: string
  mesDesbloqueado: number | null
  monto: number
  metodoPago: string
  referencia: string | null
  fechaPago: string // YYYY-MM-DD (fecha_pago) o ISO (fallback created_at)
  registradoPor: string
}

const CONCEPTO_LABELS: Record<string, string> = {
  inscripcion: 'Inscripción',
  mensualidad: 'Mensualidad',
  otro:        'Otro',
}

const fmtMoneda = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

const fmtFecha = (fecha: string) => {
  // fecha_pago llega como YYYY-MM-DD (date puro): anclar a mediodía evita el
  // corrimiento de día al formatear en America/Mexico_City. created_at (ISO con
  // hora) ya trae su propio instante y se formatea igual.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? new Date(`${fecha}T12:00:00`) : new Date(fecha)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Mexico_City' })
}

const styles = StyleSheet.create({
  page:      { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#111827' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logo:      { height: 40, objectFit: 'contain' },
  escuela:   { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  tagline:   { fontSize: 9, color: '#6B7280', marginTop: 2 },
  divider:   { borderBottomWidth: 2, borderBottomColor: '#111827', marginVertical: 12 },
  titulo:    { fontSize: 13, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  folioRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 },
  folio:     { fontSize: 10, color: '#374151' },
  row:       { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  label:     { width: 150, color: '#6B7280' },
  value:     { flex: 1, fontFamily: 'Helvetica-Bold' },
  montoBox:  { marginTop: 20, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  montoLbl:  { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  monto:     { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  footer:    { position: 'absolute', bottom: 36, left: 40, right: 40, fontSize: 8, color: '#9CA3AF', textAlign: 'center' },
})

function logoSrc(cfg: ReciboBranding): string | null {
  // El recibo se imprime sobre papel BLANCO: va la variante para fondo claro.
  // Antes se prefería `logoOscuro`, lo cual daba igual mientras ambos campos
  // apuntaran al mismo archivo; con un logo oscuro real el recibo salía en blanco.
  const logo = cfg.logo || cfg.logoOscuro
  if (!logo) return null
  // Logo subido desde "Personalizar mi página": URL http(s) al bucket público.
  // No está en disco; react-pdf la descarga al renderizar.
  //
  // MISMO FILTRO DE EXTENSIÓN QUE PARA LAS RUTAS LOCALES. El `<Image>` de
  // react-pdf solo rasteriza PNG y JPG: con un SVG o un WebP no pinta el logo
  // — revienta el render, y con él la descarga del recibo. La ruta de subida
  // ya solo deja PNG/JPEG en el bucket (rasteriza todo lo demás), así que esto
  // es defensa en profundidad para una fila escrita antes de ese cambio o a
  // mano. Ante la duda, recibo SIN logo: nunca un recibo que no sale.
  if (/^https?:\/\//i.test(logo)) {
    let ruta: string
    try {
      ruta = new URL(logo).pathname
    } catch {
      return null
    }
    return /\.(png|jpe?g)$/i.test(ruta) ? logo : null
  }
  // Ruta local de public/ (el default '/logo.png' de la plantilla).
  if (!/\.(png|jpe?g)$/i.test(logo)) return null
  const abs = path.join(process.cwd(), 'public', logo)
  return existsSync(abs) ? abs : null
}

export function ReciboPagoPDF({ data, cfg }: { data: ReciboData; cfg: ReciboBranding }) {
  const logo = logoSrc(cfg)
  return (
    <Document title={`Recibo ${data.folio}`} author={cfg.nombreCompleto}>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.escuela}>{cfg.nombreCompleto}</Text>
            {/* Sin número no se escribe la etiqueta: el recibo del alumno
                decía "…online · WhatsApp " con la palabra colgando. */}
            <Text style={styles.tagline}>
              {CONFIG.urlBase}{cfg.whatsappDisplay ? ` · WhatsApp ${cfg.whatsappDisplay}` : ''}
            </Text>
          </View>
          {/* Image de @react-pdf/renderer, no <img> de HTML: no acepta `alt`. */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logo && <Image src={logo} style={styles.logo} />}
        </View>

        <View style={styles.divider} />

        <View style={styles.folioRow}>
          <Text style={styles.titulo}>RECIBO DE PAGO</Text>
          <View>
            <Text style={styles.folio}>Folio: {data.folio}</Text>
            <Text style={styles.folio}>Fecha: {fmtFecha(data.fechaPago)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Alumno</Text>
          <Text style={styles.value}>{data.alumnoNombre}{data.matricula ? `  (${data.matricula})` : ''}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Concepto</Text>
          <Text style={styles.value}>
            {CONCEPTO_LABELS[data.concepto] ?? data.concepto}
            {data.mesDesbloqueado ? ` — Mes ${data.mesDesbloqueado}` : ''}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Método de pago</Text>
          <Text style={styles.value}>{data.metodoPago}</Text>
        </View>
        {data.referencia && (
          <View style={styles.row}>
            <Text style={styles.label}>Referencia</Text>
            <Text style={styles.value}>{data.referencia}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Registrado por</Text>
          <Text style={styles.value}>{data.registradoPor}</Text>
        </View>

        <View style={styles.montoBox}>
          <Text style={styles.montoLbl}>MONTO PAGADO</Text>
          <Text style={styles.monto}>{fmtMoneda(data.monto)}</Text>
        </View>

        <Text style={styles.footer}>
          {cfg.nombreCompleto} — Comprobante interno de pago. Folio {data.folio}. Documento generado electrónicamente.
        </Text>
      </Page>
    </Document>
  )
}

export async function renderReciboPdf(data: ReciboData): Promise<Buffer> {
  // La config se resuelve aquí (y no dentro del componente) porque react-pdf
  // no renderiza componentes async.
  const cfg = await getSiteConfig()
  return renderToBuffer(<ReciboPagoPDF data={data} cfg={cfg} />)
}
