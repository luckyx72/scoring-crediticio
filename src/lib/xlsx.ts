/**
 * Client-side XLSX import/export using SheetJS.
 * No server-side dependencies — works in static builds.
 */
import * as XLSX from 'xlsx';
import { Financials, ColRow, Company } from './types';
import { exportAll, importAll, saveCompany, saveFinancials, saveColRows } from './storage';

/**
 * Export all localStorage data as an XLSX file download.
 */
export function exportXlsx(): void {
    const snapshot = exportAll();
    const wb = XLSX.utils.book_new();

    // Companies sheet
    const compData = snapshot.companies.map(c => ({
        id: c.id, name: c.name, sector: c.sector || '', createdAt: c.createdAt,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compData), 'Companies');

    // Financials sheet (one row per company)
    const finRows: any[] = [];
    for (const c of snapshot.companies) {
        const f = snapshot.financials[c.id];
        if (f) finRows.push({ companyId: c.id, companyName: c.name, ...f });
    }
    if (finRows.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finRows), 'FinancialData');
    }

    // ColRows sheet
    const colData: any[] = [];
    for (const c of snapshot.companies) {
        const rows = snapshot.colRows[c.id];
        if (rows) {
            for (const r of rows) colData.push({ companyId: c.id, companyName: c.name, ...r });
        }
    }
    if (colData.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(colData), 'Collateral');
    }

    // Trigger download
    XLSX.writeFile(wb, `TokenOriginate_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Import XLSX file into localStorage.
 * Returns the number of companies imported.
 */
export async function importXlsx(file: File): Promise<number> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    let count = 0;

    // Import companies
    if (wb.SheetNames.includes('Companies')) {
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Companies']);
        for (const row of rows) {
            saveCompany(String(row.name || 'Unknown'), String(row.sector || ''));
            count++;
        }
    }

    // Import financials
    if (wb.SheetNames.includes('FinancialData')) {
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['FinancialData']);
        for (const row of rows) {
            const cId = String(row.companyId || '');
            if (!cId) continue;
            const f: Financials = {
                ventas: Number(row.ventas || 0),
                ebitda: Number(row.ebitda || 0),
                gastosFinancieros: Number(row.gastosFinancieros || 0),
                impPagado: Number(row.impPagado || 0),
                capexMant: Number(row.capexMant || 0),
                deudaBruta: Number(row.deudaBruta || 0),
                caja: Number(row.caja || 0),
                activoCorriente: Number(row.activoCorriente || 0),
                pasivoCorriente: Number(row.pasivoCorriente || 0),
                clientes: Number(row.clientes || 0),
                proveedores: Number(row.proveedores || 0),
                vidaMedia: Number(row.vidaMedia || 5),
                importe: Number(row.importe || 0),
                plazo: Number(row.plazo || 5),
                tipoInt: Number(row.tipoInt || 6),
                colateral: Number(row.colateral || 0),
                tipoCol: String(row.tipoCol || 'ninguno'),
                equipo: Number(row.equipo || 3),
                concentracion: Number(row.concentracion || 3),
                antiguedad: Number(row.antiguedad || 3),
                ciclicidad: Number(row.ciclicidad || 3),
                sector_comp: String(row.sector_comp || 'metalurgia'),
            };
            saveFinancials(cId, f);
        }
    }

    // Import collateral rows
    if (wb.SheetNames.includes('Collateral')) {
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Collateral']);
        // Group by companyId
        const grouped: Record<string, ColRow[]> = {};
        for (const row of rows) {
            const cId = String(row.companyId || '');
            if (!cId) continue;
            if (!grouped[cId]) grouped[cId] = [];
            grouped[cId].push({ tipo: String(row.tipo || 'otros'), desc: String(row.desc || ''), bruto: Number(row.bruto || 0) });
        }
        for (const [cId, colRows] of Object.entries(grouped)) {
            saveColRows(cId, colRows);
        }
    }

    return count;
}
