(async () => {
  try {
    const fetchArgs = { headers: { 'User-Agent': 'Mozilla/5.0' } };
    
    // 1. Get Airing
    const airing = await fetch('https://animapi.ayohost.site/api/airing', fetchArgs).then(r => r.json());
    const slug = airing.data[0].slug || airing.data[0].id;
    console.log('Testing Anime Slug:', slug);

    // 2. Get Episodes
    const eps = await fetch('https://animapi.ayohost.site/api/episodes?anime_slug=' + slug, fetchArgs).then(r => r.json());
    const ep_list = eps.data || eps.episodes || eps;
    const ep_id = ep_list[0].id || ep_list[0].session;
    console.log('Episode ID:', ep_id);

    // 3. Get Stream proxy_m3u8
    const stream = await fetch('https://animapi.ayohost.site/api/stream?anime_slug=' + slug + '&episode_session=' + ep_id + '&quality=1080p&audio=jpn', fetchArgs).then(r => r.json());
    
    const proxyM3u8Url = stream.proxy_m3u8 || stream.data?.proxy_m3u8;
    if (!proxyM3u8Url) {
      console.log('API did NOT return proxy_m3u8. Full response:', JSON.stringify(stream, null, 2));
      return;
    }
    console.log('\nExtracted proxy_m3u8 URL:', proxyM3u8Url);

    // 4. Fetch the M3U8 content
    console.log('\nFetching M3U8 playlist...');
    const m3u8Res = await fetch(proxyM3u8Url, fetchArgs);
    console.log('Playlist Status:', m3u8Res.status);
    const m3u8Text = await m3u8Res.text();
    
    console.log('\n--- PLAYLIST CONTENT SNIPPET ---');
    const lines = m3u8Text.split('\n');
    console.log(lines.slice(0, 10).join('\n'));
    console.log('...');
    console.log(lines.slice(-5).join('\n'));
    
    // 5. Find a segment URL and try to fetch it
    const segLine = lines.find(line => line.trim() && !line.startsWith('#'));
    if (segLine) {
      let segUrl = segLine;
      // If it's a relative URL, resolve it against the proxy_m3u8 URL
      if (!segUrl.startsWith('http')) {
        const baseUrl = new URL(proxyM3u8Url);
        segUrl = new URL(segUrl, baseUrl).href;
      }
      console.log('\nTesting segment fetch:', segUrl);
      const segRes = await fetch(segUrl, fetchArgs);
      console.log('Segment Status:', segRes.status);
      console.log('Segment Content-Type:', segRes.headers.get('content-type'));
    } else {
      console.log('\nNo segment URLs found in playlist.');
    }
    
  } catch(e) { console.error('Error:', e.message); }
})();
