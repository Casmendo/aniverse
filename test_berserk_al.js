const DETAIL_QUERY = `
  query($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { romaji english native }
      externalLinks { site url }
    }
  }
`;

async function main() {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: DETAIL_QUERY, variables: { id: 30002 } })
  });
  const alData = await res.json();
  const raw = alData.data.Media;

  const mdxLink = raw.externalLinks?.find(l => l.site?.toLowerCase().includes('mangadex'));
  console.log('MDX Link:', mdxLink?.url);
}
main();
