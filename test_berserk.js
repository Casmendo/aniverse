async function test() {
  const title = 'Berserk';
  const url = `https://www.aniiverse.name.ng/api/mdx/manga?title=${title}&limit=5&availableTranslatedLanguage[]=en`;
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Results:', data.data?.length);

    if (data.data?.length) {
      const cleaned = title.toLowerCase().trim();
      console.log('Target cleaned:', cleaned);

      const sorted = data.data.sort((a, b) => {
        const titleA = Object.values(a.attributes?.title || {}).join(' ').toLowerCase();
        const titleB = Object.values(b.attributes?.title || {}).join(' ').toLowerCase();
        const matchA = titleA.includes(cleaned) ? 0 : 1;
        const matchB = titleB.includes(cleaned) ? 0 : 1;
        return matchA - matchB;
      });

      console.log('Best match title:', sorted[0].attributes.title);
      console.log('Best match ID:', sorted[0].id);

      const chapterUrl = `https://www.aniiverse.name.ng/api/mdx/chapter?manga=${sorted[0].id}&translatedLanguage[]=en&limit=10`;
      console.log('Fetching chapters:', chapterUrl);
      const chRes = await fetch(chapterUrl);
      const chData = await chRes.json();
      console.log('Chapters found:', chData.total, chData.data?.length);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
