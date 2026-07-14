import { NextRequest } from 'next/server';

export const runtime = 'edge';

const ANIME_API_BASE = 'https://apiv1.ayomikuntechies.site/api';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Reconstruct the path e.g. ["search"] or ["info", "123"]
  const path = params.path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${ANIME_API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': 'c7aca1a5207926547c3c89947498750eeaf5c582704b6dbf1e8c64f7e608a242'
      },
      // 25 second timeout
      signal: AbortSignal.timeout(25000),
    });

    // Return the response stream directly for faster loading and proper video chunking
    return new Response(response.body, {
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
