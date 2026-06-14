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
    body: JSON.stringify({ query: DETAIL_QUERY, variables: { id: 169355 } })
  });
  const alData = await res.json();
  const raw = alData.data.Media;

  const title = raw.title.english || raw.title.romaji || raw.title.native;
  console.log('Title:', title);
  console.log('External Links:', raw.externalLinks);

  const mdxLink = raw.externalLinks?.find(l => l.site?.toLowerCase().includes('mangadex'));
  if (mdxLink?.url) {
    console.log('MDX Link:', mdxLink.url);
    const match = mdxLink.url.match(/mangadex\.org\/title\/([a-f0-9-]+)/i);
    if (match?.[1]) {
      console.log('Resolved ID via link:', match[1]);
    }
  } else {
    console.log('No MDX link found, would search title:', title);
  }
}

main();
