import { NextRequest, NextResponse } from 'next/server';

// MangaDex CDN hostnames we allow proxying
const ALLOWED_HOSTS = [
  'uploads.mangadex.org',
  'mangadex.network',
  'cmdxd98ubmtez.cloudfront.net',
  's2.mangadex.org',
  's5.mangadex.org',
];

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)) ||
      parsed.hostname.endsWith('.mangadex.network') ||
      parsed.hostname.endsWith('.cloudfront.net') // MangaDex uses AWS CloudFront CDN
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url || !isAllowed(url)) {
    return new NextResponse('Invalid or disallowed image URL', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Present ourselves as a direct browser request with no referer
        'User-Agent': 'Mozilla/5.0 (compatible; Aniverse/1.0)',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively — MangaDex image URLs are content-hashed
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[mdx-image proxy] Error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
