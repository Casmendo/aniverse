(async () => {
  try {
    const airing = await fetch('https://animapi.ayohost.site/api/airing').then(r => r.json());
    const slug = airing.data[0].slug || airing.data[0].id;
    console.log('slug:', slug);
    const eps = await fetch('https://animapi.ayohost.site/api/episodes?anime_slug=' + slug).then(r => r.json());
    // In the earlier error, eps.data[0] failed. Let's inspect eps.
    const ep_id = eps.data ? (eps.data[0].id || eps.data[0].session) : (eps.episodes ? (eps.episodes[0].id || eps.episodes[0].session) : eps[0].id);
    console.log('ep_id:', ep_id);
    const stream = await fetch('https://animapi.ayohost.site/api/stream?anime_slug=' + slug + '&episode_session=' + ep_id + '&quality=1080p&audio=jpn').then(r => r.json());
    console.log('stream:', stream);
    
    if (stream.stream_url) {
       const playerUrl = 'https://animapi.ayohost.site' + stream.stream_url;
       console.log('fetching playerUrl:', playerUrl);
       const html = await fetch(playerUrl).then(r => r.text());
       
       const m3u8Match = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
       if(m3u8Match) {
         console.log('\nSUCCESS! FOUND M3U8:');
         console.log(m3u8Match[0]);
       } else {
         console.log('\nNo .m3u8 found in HTML. Here is a snippet of the HTML:');
         console.log(html.substring(0, 1000));
       }
    }
  } catch(e) { console.error('Error:', e.message); }
})();
