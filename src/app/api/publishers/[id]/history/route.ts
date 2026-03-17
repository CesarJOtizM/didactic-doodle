import { NextRequest, NextResponse } from 'next/server';
import { getPublisherHistory } from '@/data/publishers';
import type { PartType } from '@/generated/prisma/enums';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  const tipo = searchParams.get('tipo') as PartType | null;
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const result = await getPublisherHistory(id, {
    tipo: tipo || undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    page,
    pageSize: 20,
  });

  return NextResponse.json(result);
}
