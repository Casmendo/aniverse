import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
        throw new Error(`Upstream responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Backend took too long to respond (2m timeout)' }, { status: 504 });
    }
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Proxy failed to reach backend', details: error.message }, { status: 502 });
  }
}
