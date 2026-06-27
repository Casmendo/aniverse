const fs = require('fs');
const https = require('https');

https.get('https://leo-aniverse-ca5adf1fd1b9.herokuapp.com/docs/json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('api_schema.json', JSON.stringify(JSON.parse(data), null, 2));
    console.log('Saved to api_schema.json');
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
