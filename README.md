# Droguería La Nena (Dronena) · Dashboard estilo Power BI

Prototipo consultivo para **Droguería La Nena — abreviada Dronena** sobre el cierre comercial **Mayo 2026**. Astro + React islands + D3 + TailwindCSS. Lee el Excel real en build-time, genera un JSON derivado y entrega un dashboard ejecutivo navegable.

> ⚠️ **Datos comerciales sensibles.** Mantené el repo privado y no compartas los archivos en `data/raw/` fuera del círculo autorizado.

## Stack

- Astro 4 + TypeScript
- React 18 (islands)
- TailwindCSS 3 (tema corporativo Dronena)
- D3.js (charts SVG)
- SheetJS / xlsx (lectura del Excel)
- lucide-react

## Estructura

```
data/raw/                          # Excel + PDF (NO se sube al repo)
src/data/generated/workbook-data.json  # generado por scripts/extract-workbook.mjs
src/data/pdf-reference.ts          # KPIs del PDF como fallback
src/components/
  ui/         Card, Button, Badge, Tabs, Select, Input, Table, FilterPill
  charts/     D3BarChart, D3HorizontalBarChart, D3DonutChart, D3LineChart, D3Heatmap
  dashboard/  DashboardApp, DashboardShell, KpiGrid, FilterPanel, SheetExplorer, InsightPanel, RoadmapPanel
scripts/
  extract-workbook.mjs   parsea el .xlsx
  build-summary.mjs      agrega métricas y candidatos por dominio
```

## Setup

```bash
npm install
npm run extract     # parsea data/raw/*.xlsx → src/data/generated/workbook-data.json
npm run dev         # http://localhost:4321
npm run build       # static build a dist/
```

## Datos

- Colocá los archivos en `data/raw/`:
  - `RESULTADO MES A MES 2025-2026 - CIERRE MAYO 2026.xlsx`
  - `CIERRE VENTAS MAYO 2026.pdf` (sólo referencia visual)
- Si el Excel **no está**, el dashboard renderiza con KPIs del PDF y marca los charts como **"muestra visual"**.
- Si el Excel **está**, el script detecta encabezados, normaliza columnas, infiere tipos (currency / percent / number / date / month / category / text) y arma filtros por dimensiones con baja cardinalidad.

### Reales vs muestra

- **Reales**: cualquier card con badge verde "Datos reales" o tabla del Explorador del Excel.
- **Muestra visual**: cards con badge amarillo cuando el Excel no expone esa información de forma clara.

## Secciones del dashboard

1. Resumen ejecutivo (KPIs + ventas vs cuota por región)
2. Ventas (detección automática de dimensión/medida/cuota)
3. Regiones / Estados (ranking horizontal)
4. Proveedores / Laboratorios
5. Categorías / Tipo de producto
6. Clientes (ranking + tabla)
7. Cuentas por Cobrar (antigüedad + top deudores)
8. Visitas (por región + heatmap)
9. Explorador del Excel — navegá todas las hojas con filtros y búsqueda
10. Hallazgos consultivos
11. Próximo paso recomendado (sprint de 10 días)

## GitHub (privado)

```bash
git init
git add .
git commit -m "feat: initial Dronena commercial dashboard"
gh repo create dronena-powerbi-style-dashboard --private --source=. --remote=origin --push
```

Si `gh` no está autenticado: `gh auth login`.

## Deploy a Vercel

```bash
npm i -g vercel
vercel              # primer deploy preview
vercel --prod       # producción
```

Si `vercel` no está autenticado: `vercel login`. El sitio incluye `meta robots noindex,nofollow`.

## Privacidad

- `data/raw/` está en `.gitignore` por defecto.
- El PDF y el Excel **no se exponen** en `public/`.
- Para deploys públicos, anonimizá nombres de clientes/proveedores antes de re-publicar el Excel.
