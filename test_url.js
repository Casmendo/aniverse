async function test() {
  const url = 'https://api.mangadex.org/manga?title=Kagurabachi&limit=5&contentRating[]=safe&contentRating[]=suggestive&availableTranslatedLanguage[]=en&includes[]=cover_art';
  const res = await fetch(url);
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
test();
