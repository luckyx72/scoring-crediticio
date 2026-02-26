import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ companyId: string }> }
) {
    try {
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;

        const data = await prisma.financialData.findMany({
            where: { companyId },
            orderBy: { year: 'desc' },
        });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ companyId: string }> }
) {
    try {
        const resolvedParams = await params;
        const companyId = resolvedParams.companyId;

        const body = await request.json();

        // UPSERT based on unique compound constraint [companyId, year] handles updates cleanly
        const data = await prisma.financialData.upsert({
            where: {
                companyId_year: {
                    companyId,
                    year: Number(body.year)
                }
            },
            update: {
                ventas: Number(body.ventas),
                cogs: Number(body.cogs),
                gastosOperativos: Number(body.gastosOperativos),
                amortizaciones: Number(body.amortizaciones),
                gastosFinancieros: body.gastosFinancieros ? Number(body.gastosFinancieros) : null,
                caja: Number(body.caja),
                deudaCortoPlazo: Number(body.deudaCortoPlazo),
                deudaLargoPlazo: Number(body.deudaLargoPlazo),
                cuentasCobrar: Number(body.cuentasCobrar),
                cuentasPagar: Number(body.cuentasPagar),
                inventario: body.inventario ? Number(body.inventario) : null,
                cotizacion: body.cotizacion ? Number(body.cotizacion) : null,
            },
            create: {
                companyId,
                year: Number(body.year),
                ventas: Number(body.ventas),
                cogs: Number(body.cogs),
                gastosOperativos: Number(body.gastosOperativos),
                amortizaciones: Number(body.amortizaciones),
                gastosFinancieros: body.gastosFinancieros ? Number(body.gastosFinancieros) : null,
                caja: Number(body.caja),
                deudaCortoPlazo: Number(body.deudaCortoPlazo),
                deudaLargoPlazo: Number(body.deudaLargoPlazo),
                cuentasCobrar: Number(body.cuentasCobrar),
                cuentasPagar: Number(body.cuentasPagar),
                inventario: body.inventario ? Number(body.inventario) : null,
                cotizacion: body.cotizacion ? Number(body.cotizacion) : null,
            }
        });

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to add financial data' }, { status: 500 });
    }
}
