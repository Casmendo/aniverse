import { NextRequest } from 'next/server';

export const runtime = 'edge';

const ANIME_API_BASE = 'https://apiv1.ayomikuntechies.site/api';
const API_KEY = 'c7aca1a5207926547c3c89947498750eeaf5c582704b6dbf1e8c64f7e608a242';

/**
 * Rewrite an M3U8 playlist so every segment / sub-playlist URL is proxied
 * through our own Next.js edge function instead of fetched directly by the
 * browser (which would be blocked by CORS).
 *
 * @param m3u8Text   The raw text of the playlist from the backend
 * @param selfOrigin The absolute origin of this deployment  (e.g. https://www.aniiverse.name.ng)
 */
function rewriteM3u8(m3u8Text: string, selfOrigin: string): string {
  const lines = m3u8Text.split('\n');
  const rewritten: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip blank lines and directives that need no URL rewriting
    if (line === '' || line.startsWith('#EXT-X-ENDLIST') || line.startsWith('#EXTM3U') || line.startsWith('#EXT-X-VERSION') || line.startsWith('#EXT-X-TARGETDURATION') || line.startsWith('#EXT-X-MEDIA-SEQUENCE') || line.startsWith('#EXT-X-PLAYLIST-TYPE') || line.startsWith('#EXTINF')) {
      rewritten.push(line);
      continue;
    }

    // Rewrite URI= attributes inside tags (e.g. #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA)
    if (line.startsWith('#') && line.includes('URI="')) {
      const rewrittenLine = line.replace(/URI="([^"]+)"/g, (_match, uri) => {
        const absolute = toAbsolute(uri);
        return `URI="${selfOrigin}/api/anime/proxy/ts?url=${encodeURIComponent(absolute)}"`;
      });
      rewritten.push(rewrittenLine);
      continue;
    }

    // Segment or sub-playlist URL (non-directive, non-empty line)
    if (!line.startsWith('#') && line.length > 0) {
      const absolute = toAbsolute(line);
      rewritten.push(`${selfOrigin}/api/anime/proxy/ts?url=${encodeURIComponent(absolute)}`);
      continue;
    }

    rewritten.push(line);
  }

  return rewritten.join('\n');
}

function toAbsolute(url: string): string {
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${ANIME_API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'X-API-Key': API_KEY,
      },
      signal: AbortSignal.timeout(25000),
    });

    const contentType = response.headers.get('content-type') || '';
    const isM3u8 = contentType.includes('mpegurl') ||
                   contentType.includes('m3u8') ||
                   path.includes('.m3u8') ||
                   (path.includes('hls') && !path.includes('proxy/ts'));

    if (isM3u8 && response.ok) {
      const text = await response.text();

      // Only rewrite if it actually looks like an HLS playlist
      if (text.includes('#EXTM3U') || text.includes('#EXTINF') || text.includes('#EXT-X-')) {
        const origin = req.nextUrl.origin;
        const rewritten = rewriteM3u8(text, origin);

        return new Response(rewritten, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          },
        });
      }

      // Not a playlist, just pass through as text
      return new Response(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Non-M3U8: stream the response body directly (binary-safe)
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
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
