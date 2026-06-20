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
    { region: 'CENTRO ESTE',  ventas: 9842000, cuota: 11200000 },
    { region: 'CENTRO OESTE', ventas: 6105000, cuota: 7000000 },
    { region: 'OCCIDENTE',    ventas: 5210000, cuota: 6100000 },
    { region: 'ORIENTE',      ventas: 3990000, cuota: 4500000 },
    { region: 'LOS ANDES',    ventas: 2840000, cuota: 3284700 },
  ],
  visitasPorRegion: [
    { region: 'CENTRO ESTE',  visitas: 6800, objetivo: 7500 },
    { region: 'CENTRO OESTE', visitas: 4900, objetivo: 5500 },
    { region: 'OCCIDENTE',    visitas: 4300, objetivo: 4800 },
    { region: 'ORIENTE',      visitas: 3100, objetivo: 3500 },
    { region: 'LOS ANDES',    visitas: 2900, objetivo: 3200 },
  ],
} as const;

export type PdfReference = typeof pdfReference;
