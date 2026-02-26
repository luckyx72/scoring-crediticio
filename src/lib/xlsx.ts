import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import type { Company, FinancialData } from '@prisma/client';

export async function exportToXlsx() {
    const companies = await prisma.company.findMany({
        include: { financialData: true },
    });

    const workbook = XLSX.utils.book_new();

    const companiesData = companies.map((c: Company) => ({
        id: c.id,
        name: c.name,
        sector: c.sector || '',
        createdAt: c.createdAt.toISOString(),
    }));
    const companiesSheet = XLSX.utils.json_to_sheet(companiesData);
    XLSX.utils.book_append_sheet(workbook, companiesSheet, "Companies");

    const financialData = companies.flatMap((c: Company & { financialData: FinancialData[] }) => c.financialData.map((f: FinancialData) => ({
        id: f.id,
        companyId: f.companyId,
        companyName: c.name,
        year: f.year,
        ventas: f.ventas,
        ebitda: f.ebitda,
        gastosFinancieros: f.gastosFinancieros,
        impPagado: f.impPagado,
        capexMant: f.capexMant,
        deudaBruta: f.deudaBruta,
        caja: f.caja,
        activoCorriente: f.activoCorriente,
        pasivoCorriente: f.pasivoCorriente,
        clientes: f.clientes,
        proveedores: f.proveedores,
        vidaMedia: f.vidaMedia,
        importe: f.importe,
        plazo: f.plazo,
        tipoInt: f.tipoInt,
        colateral: f.colateral,
        tipoCol: f.tipoCol,
        equipo: f.equipo,
        concentracion: f.concentracion,
        antiguedad: f.antiguedad,
        ciclicidad: f.ciclicidad,
    })));
    const financialsSheet = XLSX.utils.json_to_sheet(financialData);
    XLSX.utils.book_append_sheet(workbook, financialsSheet, "FinancialData");

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function importFromXlsx(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    if (workbook.SheetNames.includes('Companies')) {
        const companiesSheet = workbook.Sheets['Companies'];
        const companies = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(companiesSheet);
        for (const c of companies) {
            if (c.id) {
                await prisma.company.upsert({
                    where: { id: String(c.id) },
                    update: {
                        name: String(c.name),
                        sector: c.sector ? String(c.sector) : null,
                    },
                    create: {
                        id: String(c.id),
                        name: String(c.name),
                        sector: c.sector ? String(c.sector) : null,
                    }
                });
            } else {
                await prisma.company.create({
                    data: {
                        name: String(c.name),
                        sector: c.sector ? String(c.sector) : null,
                    }
                });
            }
        }
    }

    if (workbook.SheetNames.includes('FinancialData')) {
        const financialsSheet = workbook.Sheets['FinancialData'];
        const financials = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(financialsSheet);
        for (const f of financials) {
            const data = {
                companyId: String(f.companyId),
                year: Number(f.year),
                ventas: Number(f.ventas || 0),
                ebitda: Number(f.ebitda || 0),
                gastosFinancieros: Number(f.gastosFinancieros || 0),
                impPagado: Number(f.impPagado || 0),
                capexMant: Number(f.capexMant || 0),
                deudaBruta: Number(f.deudaBruta || 0),
                caja: Number(f.caja || 0),
                activoCorriente: Number(f.activoCorriente || 0),
                pasivoCorriente: Number(f.pasivoCorriente || 0),
                clientes: Number(f.clientes || 0),
                proveedores: Number(f.proveedores || 0),
                vidaMedia: Number(f.vidaMedia || 0),
                importe: Number(f.importe || 0),
                plazo: Number(f.plazo || 0),
                tipoInt: Number(f.tipoInt || 0),
                colateral: Number(f.colateral || 0),
                tipoCol: String(f.tipoCol || 'ninguno'),
                equipo: Number(f.equipo || 3),
                concentracion: Number(f.concentracion || 3),
                antiguedad: Number(f.antiguedad || 3),
                ciclicidad: Number(f.ciclicidad || 3)
            };

            if (f.id) {
                await prisma.financialData.upsert({
                    where: { id: String(f.id) },
                    update: data,
                    create: {
                        id: String(f.id),
                        ...data
                    }
                });
            } else {
                await prisma.financialData.create({
                    data
                });
            }
        }
    }
}
