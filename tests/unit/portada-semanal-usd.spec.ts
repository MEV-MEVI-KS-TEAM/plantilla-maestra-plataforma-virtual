import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG } from '@/lib/config'
import { animadaSabeCobrar, landingAnimadaActiva, resolverEstiloLanding } from '@/lib/landing-estilo'

/**
 * A5 · «La portada animada no se sirve con semanal ni con dólares».
 *
 * La animada todavía no conoce la cuota semanal ni otra moneda: pinta «/mes»,
 * «N mensualidades» y cifras sin código. Hasta que las aprenda, una escuela
 * semanal o que cobra en otra moneda recibe la clásica aunque su config.ts
 * declare 'animada'.
 */

test.describe('la guarda de la portada animada', () => {
  test('escuela semanal → clásica, aunque declare animada', () => {
    expect(resolverEstiloLanding('animada', { periodicidad: 'semanal', moneda: 'MXN' })).toBe('clasica')
    expect(animadaSabeCobrar({ periodicidad: 'semanal' })).toBe(false)
  })

  test('escuela que cobra en dólares (o cualquier moneda que no sea MXN) → clásica', () => {
    expect(resolverEstiloLanding('animada', { periodicidad: 'mensual', moneda: 'USD' })).toBe('clasica')
    expect(resolverEstiloLanding('animada', { moneda: 'EUR' })).toBe('clasica')
    expect(animadaSabeCobrar({ periodicidad: 'semanal', moneda: 'USD' })).toBe(false)
  })

  test('mensual y en pesos → la animada sigue sirviéndose', () => {
    expect(resolverEstiloLanding('animada', { periodicidad: 'mensual', moneda: 'MXN' })).toBe('animada')
  })

  test('un config.ts viejo sin periodicidad ni moneda es mensual y en pesos: no cambia', () => {
    expect(resolverEstiloLanding('animada', {})).toBe('animada')
    expect(resolverEstiloLanding('animada', { periodicidad: undefined, moneda: undefined })).toBe('animada')
    expect(resolverEstiloLanding('animada')).toBe('animada')
  })

  test('la guarda nunca ENCIENDE la animada: sin la clave sigue la clásica', () => {
    expect(resolverEstiloLanding(undefined, { periodicidad: 'mensual', moneda: 'MXN' })).toBe('clasica')
    expect(resolverEstiloLanding('clasica', { periodicidad: 'semanal', moneda: 'USD' })).toBe('clasica')
  })

  test('el interruptor real mira la periodicidad y la moneda de config.ts', () => {
    const cfg = CONFIG as { estiloLanding?: unknown; periodicidad?: unknown; moneda?: unknown }
    expect(landingAnimadaActiva()).toBe(
      resolverEstiloLanding(cfg.estiloLanding, { periodicidad: cfg.periodicidad, moneda: cfg.moneda }) === 'animada')
    const fuente = readFileSync(join(process.cwd(), 'src/lib/landing-estilo.ts'), 'utf8')
    expect(fuente).toContain('periodicidad: cfg.periodicidad')
    expect(fuente).toContain('moneda: cfg.moneda')
  })
})
