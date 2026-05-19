import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    // We attach the necessary Referer and Origin headers to bypass the CDN's 403 blocks.
    const headers = new Headers();
    headers.set('Referer', 'https://apis.ayohost.site/');
    headers.set('Origin', 'https://apis.ayohost.site');
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error(`Proxy upstream error: ${response.status} ${response.statusText} for ${url}`);
      return new NextResponse(`Upstream Error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 1. If it's an M3U8 Playlist, we must rewrite the segment URLs to also go through this proxy.
    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const text = await response.text();
      
      // Determine the base URL for relative paths in the M3U8 file
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      
      const rewrittenText = text.split('\n').map(line => {
        const trimmed = line.trim();
        // If the line is a URL (not empty, not a comment)
        if (trimmed && !trimmed.startsWith('#')) {
          // Resolve absolute URL
          const absoluteUrl = trimmed.startsWith('http') ? trimmed : `${baseUrl}${trimmed}`;
          // Rewrite to pass through our proxy
          return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        }
        return line;
      }).join('\n');
      
      return new NextResponse(rewrittenText, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 2. If it's a TS Video Segment, stream the bytes directly (Node.js handles this beautifully without blocking)
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // Cache segments aggressively
      }
    });

  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    return new NextResponse(`Proxy Internal Error: ${error.message}`, { status: 500 });
  }
}
