/**
 * Supabase FALSO en memoria para el arnés de rutas (#187).
 *
 * Imita lo que usan las rutas: from(tabla) con select/eq/neq/in/is/ilike/order/
 * limit/range/single/maybeSingle/update/delete/insert/upsert, rpc(), storage y
 * auth (getUser del actor; admin.updateUserById/deleteUser/createUser).
 * Cada escritura y cada operación de Auth queda en `bitacora`: las pruebas
 * comprueban que una respuesta 403 no dejó NADA escrito.
 *
 * NO simula RLS: la sesión y el servicio ven las mismas filas. Las guardas que
 * se prueban aquí son las de la app (van con el service role), no las de la BD.
 */

const METODOS_DESCONOCIDOS = new Set()

function copia(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v))
}

/** Como Postgres con una columna uuid: acepta mayúsculas, llaves y la forma sin guiones. */
function uuidComoPostgres(v) {
  const c = String(v).trim().replace(/[{}-]/g, '').toLowerCase()
  return /^[0-9a-f]{32}$/.test(c) ? c : null
}

function igual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  const ua = uuidComoPostgres(a)
  const ub = uuidComoPostgres(b)
  if (ua && ub) return ua === ub
  return String(a) === String(b)
}

class Consulta {
  constructor(bd, tabla, bitacora, cliente) {
    this.bd = bd
    this.tabla = tabla
    this.bitacora = bitacora
    this.cliente = cliente
    this.filtros = []
    this.op = 'select'
    this.valores = null
    this.devolver = false
    this.modo = null
    this.opcionesSelect = {}
    this.opcionesUpsert = {}
    this.limite = null
  }

  select(_columnas, opciones) {
    if (this.op === 'select') this.opcionesSelect = opciones ?? {}
    else this.devolver = true
    return this
  }
  eq(c, v) { this.filtros.push((f) => igual(f[c], v)); return this }
  neq(c, v) { this.filtros.push((f) => !igual(f[c], v)); return this }
  in(c, lista) { this.filtros.push((f) => (lista ?? []).some((v) => igual(f[c], v))); return this }
  is(c, v) { this.filtros.push((f) => (v === null ? f[c] == null : f[c] === v)); return this }
  ilike(c, patron) {
    const re = new RegExp('^' + String(patron).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i')
    this.filtros.push((f) => re.test(String(f[c] ?? '')))
    return this
  }
  gt(c, v) { this.filtros.push((f) => f[c] > v); return this }
  gte(c, v) { this.filtros.push((f) => f[c] >= v); return this }
  lt(c, v) { this.filtros.push((f) => f[c] < v); return this }
  lte(c, v) { this.filtros.push((f) => f[c] <= v); return this }
  not(c, op, v) {
    if (op === 'is') this.filtros.push((f) => (v === null ? f[c] != null : f[c] !== v))
    else this.filtros.push((f) => !igual(f[c], v))
    return this
  }
  order() { return this }
  limit(n) { this.limite = n; return this }
  range(a, b) { this.limite = b - a + 1; return this }
  single() { this.modo = 'single'; return this }
  maybeSingle() { this.modo = 'maybe'; return this }
  update(v) { this.op = 'update'; this.valores = v; return this }
  delete() { this.op = 'delete'; return this }
  insert(v) { this.op = 'insert'; this.valores = v; return this }
  upsert(v, o) { this.op = 'upsert'; this.valores = v; this.opcionesUpsert = o ?? {}; return this }

  filas() {
    const t = this.bd[this.tabla] ?? (this.bd[this.tabla] = [])
    return t.filter((f) => this.filtros.every((p) => p(f)))
  }

  ejecutar() {
    const tabla = this.bd[this.tabla] ?? (this.bd[this.tabla] = [])
    let data = null
    if (this.op === 'select') {
      data = copia(this.filas())
      if (this.limite != null) data = data.slice(0, this.limite)
      if (this.opcionesSelect.head) {
        return { data: null, error: null, count: data.length }
      }
    } else if (this.op === 'update') {
      const tocadas = this.filas()
      for (const f of tocadas) Object.assign(f, copia(this.valores))
      this.bitacora.push({ cliente: this.cliente, op: 'update', tabla: this.tabla, ids: tocadas.map((f) => f.id), valores: copia(this.valores) })
      data = this.devolver ? copia(tocadas) : null
    } else if (this.op === 'delete') {
      const borrar = this.filas()
      this.bd[this.tabla] = tabla.filter((f) => !borrar.includes(f))
      this.bitacora.push({ cliente: this.cliente, op: 'delete', tabla: this.tabla, ids: borrar.map((f) => f.id) })
      data = this.devolver ? copia(borrar) : null
    } else {
      const lista = Array.isArray(this.valores) ? this.valores : [this.valores]
      const clave = this.opcionesUpsert.onConflict ?? 'id'
      const escritas = []
      for (const v of lista) {
        const existente = this.op === 'upsert' ? tabla.find((f) => igual(f[clave], v[clave])) : null
        if (existente) Object.assign(existente, copia(v))
        else tabla.push({ id: v.id ?? `fila-${this.tabla}-${tabla.length + 1}`, ...copia(v) })
        escritas.push(copia(existente ?? tabla[tabla.length - 1]))
      }
      this.bitacora.push({ cliente: this.cliente, op: this.op, tabla: this.tabla, ids: escritas.map((f) => f.id), valores: copia(this.valores) })
      data = this.devolver ? escritas : null
    }
    if (this.modo === 'single') {
      const arr = Array.isArray(data) ? data : data == null ? [] : [data]
      if (arr.length !== 1) return { data: null, error: { code: 'PGRST116', message: `se esperaba 1 fila y hubo ${arr.length}` } }
      return { data: arr[0], error: null }
    }
    if (this.modo === 'maybe') {
      const arr = Array.isArray(data) ? data : data == null ? [] : [data]
      if (arr.length > 1) return { data: null, error: { code: 'PGRST116', message: 'más de una fila' } }
      return { data: arr[0] ?? null, error: null }
    }
    return { data, error: null, count: Array.isArray(data) ? data.length : null }
  }

  then(resolver, rechazar) {
    try {
      return Promise.resolve(this.ejecutar()).then(resolver, rechazar)
    } catch (e) {
      return Promise.reject(e).then(resolver, rechazar)
    }
  }
}

/** Proxy que avisa de cualquier método que la consulta no conoce. */
function consultaVigilada(c) {
  return new Proxy(c, {
    get(obj, prop) {
      if (prop in obj || typeof prop === 'symbol') return obj[prop]
      METODOS_DESCONOCIDOS.add(String(prop))
      throw new Error(`[arnés] método de consulta no soportado: ${String(prop)}`)
    },
  })
}

/**
 * Crea un escenario: una BD en memoria, las cuentas de Auth y el actor de la
 * sesión. Devuelve los dos clientes y la bitácora.
 */
export function crearEscenario({ bd, auth, actorId, rpc = {} }) {
  const bitacora = []
  const cuentas = new Map((auth ?? []).map((u) => [u.id, { ...u }]))

  function cliente(tipo) {
    return {
      from(tabla) {
        return consultaVigilada(new Consulta(bd, tabla, bitacora, tipo))
      },
      rpc(nombre, args) {
        bitacora.push({ cliente: tipo, op: 'rpc', nombre, args: copia(args) })
        const r = rpc[nombre]
        return Promise.resolve(typeof r === 'function' ? r(args, bd) : r ?? { data: null, error: null })
      },
      storage: {
        from(bucket) {
          return {
            remove(rutas) { bitacora.push({ cliente: tipo, op: 'storage.remove', bucket, rutas }); return Promise.resolve({ data: [], error: null }) },
            list() { return Promise.resolve({ data: [], error: null }) },
            upload(ruta) { bitacora.push({ cliente: tipo, op: 'storage.upload', bucket, ruta }); return Promise.resolve({ data: { path: ruta }, error: null }) },
            createSignedUrl() { return Promise.resolve({ data: { signedUrl: 'https://arnes/firmada' }, error: null }) },
            getPublicUrl(ruta) { return { data: { publicUrl: `https://arnes/${bucket}/${ruta}` } } },
          }
        },
      },
      auth: {
        async getUser() {
          const u = actorId ? cuentas.get(actorId) : null
          return { data: { user: u ? { id: u.id, email: u.email } : null }, error: null }
        },
        admin: {
          async updateUserById(id, atributos) {
            bitacora.push({ cliente: tipo, op: 'auth.updateUserById', id, campos: Object.keys(atributos ?? {}) })
            const u = cuentas.get(id)
            if (!u) return { data: { user: null }, error: { message: 'User not found', status: 404 } }
            Object.assign(u, atributos)
            return { data: { user: { id } }, error: null }
          },
          async deleteUser(id) {
            bitacora.push({ cliente: tipo, op: 'auth.deleteUser', id })
            if (!cuentas.has(id)) return { data: null, error: { message: 'User not found', status: 404 } }
            cuentas.delete(id)
            return { data: {}, error: null }
          },
          async createUser(opciones) {
            const correo = String(opciones?.email ?? '').toLowerCase()
            const ya = [...cuentas.values()].find((u) => String(u.email).toLowerCase() === correo)
            bitacora.push({ cliente: tipo, op: 'auth.createUser', email: correo })
            if (ya) return { data: { user: null }, error: { message: 'A user with this email address has already been registered', status: 422, code: 'email_exists' } }
            const id = `00000000-0000-4000-8000-${String(cuentas.size + 100).padStart(12, '0')}`
            cuentas.set(id, { id, email: correo })
            return { data: { user: { id, email: correo } }, error: null }
          },
          async listUsers() {
            return { data: { users: [...cuentas.values()] }, error: null }
          },
          async generateLink() {
            return { data: null, error: { message: 'no soportado en el arnés' } }
          },
        },
      },
    }
  }

  return {
    bitacora,
    cuentas,
    clienteSesion: () => cliente('sesion'),
    clienteServicio: () => cliente('servicio'),
  }
}

export function metodosDesconocidos() {
  return [...METODOS_DESCONOCIDOS]
}
