/**
 * cuentas.mjs — las cuentas del cliente que van en el Documento de Entrega.
 *
 * El cliente se queda con su correo, su cuenta de Supabase y la del registrador
 * del dominio (GoDaddy): son suyas, y sin sus contraseñas no puede renovar el
 * dominio ni entrar a su base de datos. Por eso van en el PDF, en la página de
 * Infraestructura, junto al servicio que abre cada una.
 *
 * Lo que NO va nunca, ni aunque alguien lo pegue en `entrega.local.json`: el
 * access token de Supabase (`sbp_…`), las llaves anon/service_role y la cadena
 * de conexión de la base de datos. Un PDF de entrega se reenvía y se guarda en
 * cualquier parte, y un token ahí abre la cuenta entera sin contraseña ni
 * segundo factor. El generador aborta si encuentra uno.
 */

/** Cuentas que el documento sabe presentar, en el orden en que se imprimen. */
export const CUENTAS = ['correo', 'supabase', 'godaddy']

// Se reconocen por FORMA, no por el nombre de la clave: un token pegado en
// "password" es igual de peligroso que uno en "accessToken".
const SECRETOS = [
  { nombre: 'access token de Supabase', patron: /\bsbp_[A-Za-z0-9]{20,}/ },
  { nombre: 'llave secreta de Supabase', patron: /\bsb_secret_[A-Za-z0-9_-]{10,}/ },
  { nombre: 'llave publicable de Supabase', patron: /\bsb_publishable_[A-Za-z0-9_-]{10,}/ },
  { nombre: 'JWT (llave anon o service_role)', patron: /\beyJ[\w-]{10,}\.[\w-]{10,}\./ },
  { nombre: 'cadena de conexión de la base de datos', patron: /postgres(?:ql)?:\/\/\S+@/i },
  { nombre: 'token de GitHub', patron: /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/ },
]

/**
 * Rutas (`cuentas.supabase.password`) de los valores de `datos` con forma de
 * secreto. Devuelve la ruta y el tipo, NUNCA el valor: el aviso sale por consola,
 * y la consola también se copia y se pega.
 */
export function secretosEn(datos, ruta = '') {
  if (typeof datos === 'string') {
    const s = SECRETOS.find((x) => x.patron.test(datos))
    return s ? [`${ruta || '(raíz)'} (${s.nombre})`] : []
  }
  if (Array.isArray(datos)) return datos.flatMap((v, i) => secretosEn(v, `${ruta}[${i}]`))
  if (datos && typeof datos === 'object')
    return Object.entries(datos).flatMap(([k, v]) => secretosEn(v, ruta ? `${ruta}.${k}` : k))
  return []
}

const ACCESO_CORREO = [
  { dominios: ['outlook.com', 'outlook.es', 'hotmail.com', 'hotmail.es', 'live.com', 'live.com.mx'], url: 'https://outlook.live.com' },
  { dominios: ['gmail.com'], url: 'https://mail.google.com' },
  { dominios: ['yahoo.com', 'yahoo.com.mx'], url: 'https://mail.yahoo.com' },
]

/**
 * Normaliza `entrega.local.json → cuentas`. Cada cuenta es `{ email, password }`
 * y nada más, y una cuenta vacía se omite. Lanza un Error con el motivo si una
 * cuenta viene a medias o trae un campo de más: un `accessToken` pegado «por si
 * acaso» es justo lo que no puede llegar al PDF.
 *
 * @returns {null | Record<string, { email: string, password: string, acceso?: string }>}
 *   `acceso` solo en el correo y solo con un proveedor conocido: no se inventa.
 */
export function cuentasDeEntrega(cuentas) {
  if (cuentas == null) return null
  if (typeof cuentas !== 'object' || Array.isArray(cuentas))
    throw new Error('"cuentas" debe ser un objeto: { "correo": {…}, "supabase": {…}, "godaddy": {…} }')
  const salida = {}
  for (const [clave, cuenta] of Object.entries(cuentas)) {
    if (clave.startsWith('_') || cuenta == null) continue
    if (!CUENTAS.includes(clave))
      throw new Error(`"cuentas.${clave}" no es una cuenta que vaya en la entrega (van: ${CUENTAS.join(', ')}).`)
    if (typeof cuenta !== 'object' || Array.isArray(cuenta))
      throw new Error(`"cuentas.${clave}" debe ser { "email": "…", "password": "…" }.`)
    const sobran = Object.keys(cuenta).filter((k) => !k.startsWith('_') && k !== 'email' && k !== 'password')
    if (sobran.length)
      throw new Error(`"cuentas.${clave}" solo lleva email y password; sobra ${sobran.map((k) => `"${k}"`).join(', ')}. El access token y las llaves nunca van en la entrega.`)
    const email = String(cuenta.email ?? '').trim()
    const password = String(cuenta.password ?? '')
    if (!email && !password) continue
    if (!email || !password)
      throw new Error(`"cuentas.${clave}" viene a medias: falta ${email ? 'password' : 'email'}.`)
    // El ejemplo trae «••••••••»: copiado sin llenar, el PDF imprimiría puntos.
    if (/^[•*·.\s]+$/.test(password))
      throw new Error(`"cuentas.${clave}.password" sigue con el marcador del ejemplo: pon la contraseña real.`)
    salida[clave] = { email, password }
  }
  if (salida.correo) {
    const dominio = salida.correo.email.split('@')[1]?.toLowerCase()
    const acceso = ACCESO_CORREO.find((p) => p.dominios.includes(dominio))?.url
    if (acceso) salida.correo.acceso = acceso
  }
  return Object.keys(salida).length ? salida : null
}

/** «tu correo, Supabase y GoDaddy»: las cuentas entregadas, dichas en una frase. */
export function nombresDeCuentas(cuentas, registrador = 'GoDaddy') {
  if (!cuentas) return ''
  const n = [cuentas.correo && 'tu correo', cuentas.supabase && 'Supabase', cuentas.godaddy && registrador].filter(Boolean)
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n.at(-1)}` : n[0] || ''
}
