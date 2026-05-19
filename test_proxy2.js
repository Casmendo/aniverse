(async () => {
  try {
    const fetchArgs = { headers: { 'User-Agent': 'Mozilla/5.0' } };
    
    // We already know slug 76236 is working, let's just use it to get info
    console.log('Testing Anime Slug: 76236');

    // Just fetch /api/anime/76236/episodes directly
    const eps = await fetch('https://animapi.ayohost.site/api/anime/76236/episodes', fetchArgs).then(r => r.json());
    
    const ep_list = eps.data || eps.episodes || eps;
    if (!ep_list || !ep_list.length) {
      console.log('No episodes found:', eps);
      return;
    }
    const ep_id = ep_list[0].id || ep_list[0].session;
    console.log('Episode ID:', ep_id);

    // Get Stream proxy_m3u8
    const stream = await fetch('https://animapi.ayohost.site/api/stream?anime_slug=76236&episode_session=' + ep_id + '&quality=1080p&audio=jpn', fetchArgs).then(r => r.json());
    
    const proxyM3u8Url = stream.proxy_m3u8 || stream.data?.proxy_m3u8;
    if (!proxyM3u8Url) {
      console.log('API did NOT return proxy_m3u8. Full response:', JSON.stringify(stream, null, 2));
      return;
    }
    console.log('\nExtracted proxy_m3u8 URL:', proxyM3u8Url);

    // Fetch the M3U8 content
    console.log('\nFetching M3U8 playlist...');
    const m3u8Res = await fetch(proxyM3u8Url, fetchArgs);
    console.log('Playlist Status:', m3u8Res.status);
    const m3u8Text = await m3u8Res.text();
    
    const lines = m3u8Text.split('\n');
    const segLine = lines.find(line => line.trim() && !line.startsWith('#'));
    
    if (segLine) {
      let segUrl = segLine;
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
