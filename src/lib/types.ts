export interface Financials {
    ventas: number;
    ebitda: number;
    gastosFinancieros: number;
    impPagado: number;
    capexMant: number;
    deudaBruta: number;
    caja: number;
    activoCorriente: number;
    pasivoCorriente: number;
    clientes: number;
    proveedores: number;
    vidaMedia: number;
    importe: number;
    plazo: number;
    tipoInt: number;
    colateral: number;
    tipoCol: string;
    equipo: number;
    concentracion: number;
    antiguedad: number;
    ciclicidad: number;
    sector_comp?: string;
}

export interface ColRow {
    tipo: string;
    desc: string;
    bruto: number;
}

export const DEFAULT_FINANCIALS_TUBACEX: Financials = {
    ventas: 767.5,
    ebitda: 107,
    gastosFinancieros: 14.5,
    impPagado: 5,
    capexMant: 20,
    deudaBruta: 420,
    caja: 165,
    activoCorriente: 480,
    pasivoCorriente: 378,
    clientes: 76,
    proveedores: 473,
    vidaMedia: 4,
    importe: 0,
    plazo: 5,
    tipoInt: 6,
    colateral: 0,
    tipoCol: 'inmueble',
    equipo: 4,
    concentracion: 3,
    antiguedad: 5,
    ciclicidad: 2,
    sector_comp: 'metalurgia',
};

export const DEFAULT_COL_ROWS_TUBACEX: ColRow[] = [
    { tipo: 'nave', desc: 'Naves industriales Amurrio/Llodio', bruto: 180 },
    { tipo: 'maquinaria', desc: 'Líneas de producción tubos sin costura', bruto: 95 },
    { tipo: 'cuentas_cobrar', desc: 'Cartera clientes Oil & Gas', bruto: 120 },
];

export const EXAMPLES: Record<string, { data: Financials; colRows?: ColRow[]; label: string }> = {
    tubacex: {
        label: 'Tubacex (AA)',
        data: DEFAULT_FINANCIALS_TUBACEX,
        colRows: DEFAULT_COL_ROWS_TUBACEX,
    },
    aa_quimica: {
        label: 'Empresa AA (Química)',
        data: {
            ventas: 200, ebitda: 46, gastosFinancieros: 3, impPagado: 5, capexMant: 3,
            deudaBruta: 40, caja: 22, activoCorriente: 90, pasivoCorriente: 45,
            clientes: 35, proveedores: 30, vidaMedia: 6,
            importe: 0, plazo: 5, tipoInt: 5, colateral: 0, tipoCol: 'inmueble',
            equipo: 5, concentracion: 4, antiguedad: 5, ciclicidad: 4,
            sector_comp: 'quimica',
        },
    },
    distressed: {
        label: 'Empresa C (Distressed)',
        data: {
            ventas: 80, ebitda: 5, gastosFinancieros: 6, impPagado: 0.5, capexMant: 1.5,
            deudaBruta: 65, caja: 4, activoCorriente: 35, pasivoCorriente: 38,
            clientes: 30, proveedores: 20, vidaMedia: 3,
            importe: 0, plazo: 5, tipoInt: 9, colateral: 0, tipoCol: 'maquinaria',
            equipo: 2, concentracion: 2, antiguedad: 2, ciclicidad: 2,
            sector_comp: 'construccion',
        },
    },
};

export interface Company {
    id: string;
    name: string;
    sector: string | null;
    createdAt: string;
}
