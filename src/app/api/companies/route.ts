import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(companies);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const company = await prisma.company.create({
            data: {
                name: body.name,
                sector: body.sector,
            }
        });
        return NextResponse.json(company);
    } catch {
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}
