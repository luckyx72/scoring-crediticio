import { NextResponse } from 'next/server';
import { exportToXlsx } from '@/lib/xlsx';

export async function GET() {
    try {
        const buffer = await exportToXlsx();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="data-export.xlsx"',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
