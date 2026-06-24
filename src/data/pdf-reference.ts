// Datos extraídos del PDF "CIERRE VENTAS MAYO 2026" como fallback / fuente declarativa.
// Si el Excel contiene los mismos KPIs, prevalece el Excel.

export const pdfReference = {
  period: 'Mayo 2026',
  source: 'CIERRE VENTAS MAYO 2026.pdf',
  kpis: {
    ventasNetas: 27987806.82,
    cuotaValores: 32084700.0,
    coberturaValores: 0.8723,
    cuotaUnidades: 8671500,
    ventasUnidades: 7802974,
    coberturaUnidades: 0.8998,
    variacionValores: -0.0788,
    variacionUnidades: -0.2681,
    margen: -0.032,
    devolucion: 0.0078,
    unidadesPromedioDiario: 390000,
    bultos: 654000,
    proveedores: 248,
    skusVendidos: 7290,
    clientes: 3553,
    precioPromedioUsd: 3.76,
    inventarioUnidades: 4600000,
    cxcTotal: 5161103.66,
    visitasComerciales: 22000,
  },
  regiones: [
    { region: 'CENTRO ESTE',  ventas: 34095258.36, cuota: 24412867.08 },
    { region: 'CENTRO OESTE', ventas: 31478285.46, cuota: 24743712.03 },
    { region: 'MARACAIBO',    ventas: 24911266.31, cuota: 20774376.12 },
    { region: 'ANDINA',       ventas: 24652567.75, cuota: 15425004.32 },
    { region: 'CARACAS',      ventas: 24583794.30, cuota: 16995343.90 },
    { region: 'ESTE',         ventas: 23864947.18, cuota: 16825648.08 },
  ],
  visitasPorRegion: [
    { region: 'CENTRO ESTE',  visitas: 6800, objetivo: 7500 },
    { region: 'CENTRO OESTE', visitas: 4900, objetivo: 5500 },
    { region: 'MARACAIBO',    visitas: 4300, objetivo: 4800 },
    { region: 'ANDINA',       visitas: 2900, objetivo: 3200 },
    { region: 'CARACAS',      visitas: 3100, objetivo: 3500 },
    { region: 'ESTE',         visitas: 3000, objetivo: 3400 },
  ],
} as const;

export type PdfReference = typeof pdfReference;
