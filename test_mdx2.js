const https = require('https');

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Aniverse/1.0 (contact: info@aniverse.name.ng)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const url = 'https://api.mangadex.org/manga?title=Kagurabachi&limit=5';
  console.log(await fetchRaw(url));
}

test();
