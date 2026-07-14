# QA visual — Cursos y Diplomados (Playwright)

Suite de QA visual del módulo **Cursos y Diplomados**: panel admin + visor del
alumno + móvil, con screenshot de evidencia por paso. Corre contra el **build de
producción local** (`pnpm start`) con Chromium real. Es **agnóstica de cliente**:
todo lo específico se configura por variables de entorno.

## Requisitos por cliente

En `.env.local` del repo del cliente (los `NEXT_PUBLIC_*` ya deben existir para
la app; se añaden las de QA):

```env
# App (ya existen)
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # necesaria para el build prod y para acuñar la sesión admin

# QA (nuevas)
QA_ALUMNO_EMAIL=<email de un alumno de prueba existente>
QA_ALUMNO_PASSWORD=<password que se le fijará para el login real por UI>
QA_ADMIN_EMAIL=<email del admin del cliente>   # sesión acuñada sin password (magiclink→verifyOtp)
QA_DIPLOMA_NOMBRE=Diplomado de prueba (QA)      # opcional; nombre del curso demo
```

> El alumno debe existir en `usuarios`; `globalSetup` le fija `QA_ALUMNO_PASSWORD`
> para poder validar el login por formulario. El admin se autentica con una
> sesión acuñada vía service role (no se teclea su contraseña).

## Instalación (una vez por máquina)

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

## Correr

```bash
pnpm build                      # el webServer de Playwright hace `pnpm start`
npx playwright test --project=chromium
```

Screenshots en `e2e/screenshots/` (gitignored). Reporte HTML en `playwright-report/`.

## Qué hace y qué deja

- **globalSetup**: fija el password del alumno de QA, limpia diplomas de QA de
  corridas previas, genera portada + PDF de prueba, acuña la sesión admin.
- **Parte A (admin)**: crea el diplomado, video por link (preview), reordenar,
  subir PDF (valida el fix del límite 4.5MB de Vercel → subida directa a Storage),
  asignar alumno + duplicado, doble confirmación cancelada, publicar + vista previa.
- **Parte B (alumno)**: login real, catálogo, visor, marcar completada, descarga
  de material (signed URL), navegación, guard de admin, página académica de control.
- **Parte C (móvil, iPhone 13)**: responsive del catálogo y del visor.
- **globalTeardown**: borra SOLO el progreso marcado por el alumno → el diplomado
  demo queda publicado, asignado y en 0% (listo para mostrar al cliente).
