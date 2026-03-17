import { NextRequest, NextResponse } from 'next/server';
import { getPublisherWorkload } from '@/data/publishers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const months = parseInt(searchParams.get('months') ?? '3', 10);

  const result = await getPublisherWorkload(id, months);

  return NextResponse.json(result);
}
