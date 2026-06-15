import { NextRequest, NextResponse } from 'next/server';

const CONSUMET_BASE = 'https://consumet-api.onrender.com';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${CONSUMET_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Aniverse/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from Consumet' }, { status: 500 });
  }
}
