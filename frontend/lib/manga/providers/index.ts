import type { MangaProvider } from '../types';
import { MangaDexProvider } from './mangadex';

// ── Provider Registry ──────────────────────────────────────────────────────
// To add a licensed provider in the future, just push it here.
// The rest of the app will automatically pick it up.

const providers: Record<string, MangaProvider> = {
  mangadex: MangaDexProvider,
  // comick:    ComickProvider,    // future
  // viz:       VizProvider,        // licensed future
  // crunchyroll: CrunchyrollMangaProvider, // licensed future
};

export function getProvider(id = 'mangadex'): MangaProvider {
  const p = providers[id];
  if (!p) throw new Error(`Manga provider "${id}" not registered.`);
  return p;
}

export function listProviders(): MangaProvider[] {
  return Object.values(providers);
}

export { MangaDexProvider };
export default providers;
