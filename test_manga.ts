import { unifiedMangaService } from './frontend/lib/manga/unifiedService';
import { mangaDexClient } from './frontend/lib/manga/mangaDexClient';

async function test() {
  console.log('Testing Kagurabachi (169355)...');
  try {
    const detail = await unifiedMangaService.getDetail(169355);
    console.log('Detail title:', detail.title);
    console.log('MangaDex ID resolved to:', detail.mangaDexId);

    if (detail.mangaDexId) {
      const chapters = await mangaDexClient.getChapters(detail.mangaDexId, 'en');
      console.log('Found English chapters:', chapters.length);
      if (chapters.length > 0) {
        console.log('First chapter:', chapters[0]);
      }
    } else {
      console.log('Trying manual search for "Kagurabachi"');
      const searchRes = await mangaDexClient.searchId('Kagurabachi');
      console.log('Manual search returned ID:', searchRes);
      if (searchRes) {
         const chapters = await mangaDexClient.getChapters(searchRes, 'en');
         console.log('Found English chapters for manual ID:', chapters.length);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
