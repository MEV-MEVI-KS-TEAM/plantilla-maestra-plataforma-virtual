import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteConfigProvider } from "@/components/site-config-provider";
import { getSiteConfig, toPublicSiteConfig } from "@/lib/site-config";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const description = "Estudia Secundaria o Preparatoria desde casa. Acompañamiento en la gestión de tu certificación con validez oficial. 100% en línea, a tu ritmo, sin examen final."

// "Personalizar mi página" (F1): themeColor, título y paleta salen de
// getSiteConfig() — config.ts + overrides de site_config —, por eso viewport y
// metadata son funciones async y no `export const`: un const se evalúa al
// cargar el módulo y no puede leer la fila. Con site_config vacía devuelven
// exactamente lo que devolvían los const de antes.
//
// Lección Bug 82: aquí NO va `export const revalidate = …` ni ninguna config
// de segmento no literal (se extrae estáticamente y se ignora en silencio). La
// frescura la da revalidateSiteConfig() desde la mutación del editor.
export async function generateViewport(): Promise<Viewport> {
  const cfg = await getSiteConfig()
  return {
    // Configurable por cliente en lib/config.ts (colores.themeColor) y, desde
    // F1, desde el editor. Estaba hardcodeado a un gris casi negro heredado de
    // un cliente con tema oscuro, que no corresponde al fondo claro de la
    // plantilla.
    themeColor: cfg.colores.themeColor,
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig()
  return {
    title: {
      default: `${cfg.nombre} | ${cfg.tagline}`,
      template: `%s | ${cfg.nombre}`,
    },
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: cfg.nombre,
      description,
      type: "website",
      locale: "es_MX",
      siteName: cfg.nombre,
    },
    twitter: {
      card: "summary",
      title: cfg.nombre,
      description,
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Una sola lectura para las CSS vars y para el provider: el recorte público
  // se toma de este mismo objeto en vez de pedir getPublicSiteConfig() (que
  // volvería a clonar).
  const cfg = await getSiteConfig()

  // Bug 31 fix: inyectar CSS vars desde CONFIG.colores para que páginas auth +
  // dashboard alumno + admin lean var(--color-*) en lugar de hex hardcoded.
  // Cliente solo configura src/lib/config.ts y la plataforma toma su paleta.
  // Desde F1 la paleta viene ya fusionada con los overrides del editor.
  const c = cfg.colores as typeof cfg.colores & Partial<Record<
    'sidebarActivo' | 'sidebarActivoTexto' | 'sidebarHover' | 'sidebarRealce'
    | 'sidebarBorde' | 'sidebarBordeFuerte', string>>

  const cssVars = {
    '--color-primario':           cfg.colores.primario,
    '--color-acento':             cfg.colores.acento,
    '--color-acento-hover':       cfg.colores.acentoHover,
    '--color-texto-sobre-acento': cfg.colores.textoSobreAcento,
    '--color-texto':              cfg.colores.texto,
    '--color-texto-secundario':   cfg.colores.textoSecundario,
    '--color-fondo':              cfg.colores.fondo,
    '--color-superficie':         cfg.colores.superficie,
    '--color-borde':              cfg.colores.borde,
    // Realces del sidebar. OPCIONALES: si el cliente no los declara quedan
    // undefined y sidebar.tsx cae en su fallback histórico, así que un cliente
    // que no los use ve exactamente el mismo panel de siempre. Existen porque
    // van ENCIMA de `primario`, y con dos colores de marca vecinos en el
    // círculo cromático el item activo dejaba de distinguirse del fondo.
    // No son editables desde F1: llegan tal cual del config.ts del cliente
    // (el merge clona la base entera).
    '--color-sidebar-activo':        c.sidebarActivo,
    '--color-sidebar-activo-texto':  c.sidebarActivoTexto,
    '--color-sidebar-hover':         c.sidebarHover,
    '--color-sidebar-realce':        c.sidebarRealce,
    '--color-sidebar-borde':         c.sidebarBorde,
    '--color-sidebar-borde-fuerte':  c.sidebarBordeFuerte,
  } as React.CSSProperties

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={cssVars}
      >
        <Providers>
          <SiteConfigProvider value={toPublicSiteConfig(cfg)}>
            {children}
          </SiteConfigProvider>
        </Providers>
      </body>
    </html>
  );
}
