import { NextResponse } from 'next/server';
import { importFromXlsx } from '@/lib/xlsx';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file = data.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file found' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        await importFromXlsx(buffer);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
    }
}
