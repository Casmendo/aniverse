(async () => {
  try {
    const fetchArgs = { headers: { 'User-Agent': 'Mozilla/5.0' } };
    
    // Get airing anime
    const airing = await fetch('https://animapi.ayohost.site/api/airing', fetchArgs).then(r => r.json());
    
    // Find an anime that has episodes
    let slug = null, ep_id = null;
    for (const item of airing.data) {
      const s = item.slug || item.id;
      const eps = await fetch('https://animapi.ayohost.site/api/anime/' + s + '/episodes', fetchArgs).then(r => r.json());
      const ep_list = eps.data || eps.episodes || eps;
      if (ep_list && ep_list.length > 0) {
        slug = s;
        ep_id = ep_list[0].id || ep_list[0].session;
        break;
      }
    }
    
    if (!slug) {
      console.log('Could not find any episodes.');
      return;
    }
    
    console.log(`Testing with Slug: ${slug}, Ep: ${ep_id}`);
    const streamRes = await fetch(`https://animapi.ayohost.site/api/stream?anime_slug=${slug}&episode_session=${ep_id}&quality=1080p&audio=jpn`, fetchArgs);
    const stream = await streamRes.json();
    console.log('Stream Response:');
    console.log(JSON.stringify(stream, null, 2));
    
  } catch(e) { console.error('Error:', e.message); }
})();
