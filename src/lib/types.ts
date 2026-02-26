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

export interface Company {
    id: string;
    name: string;
    sector: string | null;
    createdAt: string;
}
