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
        cogs: f.cogs,
        gastosOperativos: f.gastosOperativos,
        amortizaciones: f.amortizaciones,
        gastosFinancieros: f.gastosFinancieros || '',
        caja: f.caja,
        deudaCortoPlazo: f.deudaCortoPlazo,
        deudaLargoPlazo: f.deudaLargoPlazo,
        cuentasCobrar: f.cuentasCobrar,
        cuentasPagar: f.cuentasPagar,
        inventario: f.inventario || '',
        cotizacion: f.cotizacion || '',
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
                companyId: f.companyId,
                year: Number(f.year),
                ventas: Number(f.ventas),
                cogs: Number(f.cogs),
                gastosOperativos: Number(f.gastosOperativos),
                amortizaciones: Number(f.amortizaciones),
                gastosFinancieros: f.gastosFinancieros ? Number(f.gastosFinancieros) : null,
                caja: Number(f.caja),
                deudaCortoPlazo: Number(f.deudaCortoPlazo),
                deudaLargoPlazo: Number(f.deudaLargoPlazo),
                cuentasCobrar: Number(f.cuentasCobrar),
                cuentasPagar: Number(f.cuentasPagar),
                inventario: f.inventario ? Number(f.inventario) : null,
                cotizacion: f.cotizacion ? Number(f.cotizacion) : null,
            };

            if (f.id) {
                await prisma.financialData.upsert({
                    where: { id: f.id },
                    update: data,
                    create: {
                        id: f.id,
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
