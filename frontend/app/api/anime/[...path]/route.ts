import { NextRequest } from 'next/server';

export const runtime = 'edge';

const ANIME_API_BASE = 'https://leo-aniverse-ca5adf1fd1b9.herokuapp.com/api/v1';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Reconstruct the path e.g. ["anime", "slug", "info"]
  const path = params.path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${ANIME_API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 25 second timeout
      signal: AbortSignal.timeout(25000),
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Proxy error' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
