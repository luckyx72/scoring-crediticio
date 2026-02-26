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

        const financials = {
            ventas: Number(body.ventas || 0),
            ebitda: Number(body.ebitda || 0),
            gastosFinancieros: Number(body.gastosFinancieros || 0),
            impPagado: Number(body.impPagado || 0),
            capexMant: Number(body.capexMant || 0),
            deudaBruta: Number(body.deudaBruta || 0),
            caja: Number(body.caja || 0),
            activoCorriente: Number(body.activoCorriente || 0),
            pasivoCorriente: Number(body.pasivoCorriente || 0),
            clientes: Number(body.clientes || 0),
            proveedores: Number(body.proveedores || 0),
            vidaMedia: Number(body.vidaMedia || 0),
            importe: Number(body.importe || 0),
            plazo: Number(body.plazo || 0),
            tipoInt: Number(body.tipoInt || 0),
            colateral: Number(body.colateral || 0),
            tipoCol: String(body.tipoCol || 'ninguno'),
            equipo: Number(body.equipo || 3),
            concentracion: Number(body.concentracion || 3),
            antiguedad: Number(body.antiguedad || 3),
            ciclicidad: Number(body.ciclicidad || 3)
        };

        const data = await prisma.financialData.upsert({
            where: {
                companyId_year: {
                    companyId,
                    year: Number(body.year)
                }
            },
            update: financials,
            create: {
                companyId,
                year: Number(body.year),
                ...financials
            }
        });

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to add financial data' }, { status: 500 });
    }
}
