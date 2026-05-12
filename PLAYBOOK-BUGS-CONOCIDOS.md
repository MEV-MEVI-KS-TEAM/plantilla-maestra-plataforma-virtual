# PLAYBOOK — BUGS CONOCIDOS
## Plantilla Maestra Plataforma Virtual

---

### Bug 19 — Precios hardcodeados post-deploy
**Síntoma:** Precios en landing no coinciden con los del cliente
(ej: $599 en lugar de $500, $4900 en lugar de $4500).
**Causa:** mev-deploy.sh o mev-onboarding.py no actualiza los valores
de CONFIG.precios en config.ts al personalizar para el cliente.
**Estado:** page.tsx YA lee desde CONFIG.precios (fix en plantilla).
El problema ocurre en la personalización, no en el template.
**Fix:** Después de cada deploy, verificar con:
grep -n "599\|4900\|5900" src/lib/config.ts
Si hay hits → actualizar manualmente CONFIG.precios con valores del cliente.
**Afecta:** Todos los clientes donde mev-onboarding.py no actualice precios.
**Fix permanente pendiente:** mev-onboarding.py debe escribir CONFIG.precios
en config.ts durante la personalización automática.

---

### Bug 44 — "IVS Virtual" hardcodeado en descripciones de materias (clientes legacy)
**Síntoma:** En vista de materias del alumno, las descripciones muestran
"— Preparatoria IVS Virtual" en lugar del nombre del cliente.
Ejemplo: "Conocimiento matemático I — Preparatoria IVS Virtual"
**Causa:** `scripts/seed-contenido-ivs.sql` tenía el nombre del primer cliente
(IVS Virtual) hardcodeado en el campo `descripcion` de 12 materias preparatoria.
La plantilla fue creada a partir del cliente IVS sin anonimizar ese campo.
**Estado:** CORREGIDO en plantilla (commit 57655e7, 11-may-2026).
El seed ahora usa `{{CLIENTE_NOMBRE}}` como placeholder.
**Clientes afectados:** ~14 clientes pre-Avantix (desplegados antes del fix).
**Fix clientes legacy (bajo demanda):**
Ejecutar `scripts/cleanup-ivs-virtual.sql` en el SQL Editor de Supabase del cliente,
sustituyendo `NOMBRE_DEL_CLIENTE` con el nombre real del cliente.
**Validación post-fix:**
```sql
SELECT descripcion FROM public.materias
WHERE descripcion LIKE '%IVS Virtual%';
-- Debe regresar 0 filas
```

---

### Bug 45 — Placeholder `{{CLIENTE_NOMBRE}}` no resuelto en bootstrap nuevo cliente
**Síntoma:** Al ejecutar `seed-contenido-ivs.sql` en un cliente nuevo, las
descripciones quedan con el literal `{{CLIENTE_NOMBRE}}` en lugar del nombre real.
Ejemplo: "Conocimiento matemático I — Preparatoria {{CLIENTE_NOMBRE}}"
**Causa:** El proceso de bootstrap no hace sed/replace del placeholder antes
de ejecutar el seed. La plantilla ahora usa `{{CLIENTE_NOMBRE}}` (fix Bug 44),
pero el paso de personalización no lo resuelve automáticamente.
**Fix manual (nuevo cliente):** Antes de ejecutar `seed-contenido-ivs.sql`,
reemplazar el placeholder con el nombre real del cliente:
```bash
# En el archivo antes de correr en Supabase:
sed -i 's/{{CLIENTE_NOMBRE}}/NOMBRE_REAL_DEL_CLIENTE/g' scripts/seed-contenido-ivs.sql
```
O usar la opción Find & Replace del SQL Editor de Supabase antes de ejecutar.
**Fix permanente pendiente:** El script de bootstrap (mev-deploy.sh o equivalente)
debe ejecutar este sed automáticamente al personalizar un cliente nuevo.
**Validación:**
```sql
SELECT descripcion FROM public.materias
WHERE descripcion LIKE '%{{CLIENTE_NOMBRE}}%';
-- Debe regresar 0 filas
```

---
