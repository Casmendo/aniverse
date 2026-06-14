const https = require('https');

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Aniverse/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const url = 'https://api.mangadex.org/chapter?manga=d65c0332-3764-4c89-84bd-b1a4e7278ad7&translatedLanguage[]=en&limit=1';
  console.log(await fetchRaw(url));
}

test();
