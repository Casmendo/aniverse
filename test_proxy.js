async function testProxy() {
  const url = 'https://www.aniiverse.name.ng/api/mdx/manga?title=Kagurabachi&limit=5&availableTranslatedLanguage[]=en';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500) + '...');
  } catch (err) {
    console.error('Error:', err);
  }
}
testProxy();
