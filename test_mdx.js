const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('Testing Kagurabachi MangaDex ID resolution...');
  try {
    const searchUrl = 'https://api.mangadex.org/manga?title=Kagurabachi&limit=5';
    console.log('Fetching:', searchUrl);
    const data = await fetchJson(searchUrl);
    
    if (data && data.data && data.data.length > 0) {
      console.log('Found results:', data.data.length);
      const top = data.data[0];
      console.log('Top match ID:', top.id);
      console.log('Top match Attributes:', top.attributes.title);
      
      const chapUrl = `https://api.mangadex.org/chapter?manga=${top.id}&translatedLanguage[]=en&limit=1`;
      console.log('Fetching chapters for ID:', chapUrl);
      const chaps = await fetchJson(chapUrl);
      console.log('Total chapters found:', chaps.total);
    } else {
      console.log('No results found for Kagurabachi');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
