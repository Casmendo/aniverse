import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new Response('Missing URL', { status: 400 });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://aniwaves.ru/'
      }
    });

    if (!response.ok) {
      return new Response(`Proxy Error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    let body = await response.text();

    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const lines = body.split('\n');
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const absUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
          return `/api/proxy?url=${encodeURIComponent(absUrl)}`;
        }
        return line;
      });
      body = rewritten.join('\n');
    }

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
