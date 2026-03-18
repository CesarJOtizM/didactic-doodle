import { NextRequest, NextResponse } from 'next/server';
import { getPublisherWorkload } from '@/data/publishers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') ?? '3', 10);

    const result = await getPublisherWorkload(id, months);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch publisher workload:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publisher workload' },
      { status: 500 }
    );
  }
}
