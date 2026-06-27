// ── MangaVerse Core Types ──────────────────────────────────────────────────

export type ReadingMode = 'vertical' | 'horizontal' | 'webtoon';
export type ReadingDirection = 'ltr' | 'rtl';
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'unknown';
export type ContentRating = 'safe' | 'suggestive' | 'erotica' | 'pornographic';

export interface MangaTag {
  id: string;
  name: string;
  group: 'genre' | 'theme' | 'format' | 'content';
}

export interface MangaAuthor {
  id: string;
  name: string;
  role: 'author' | 'artist';
}

export interface MangaCoverArt {
  id: string;
  fileName: string;
  volume?: string;
}

export interface MangaResult {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: MangaStatus;
  year?: number;
  contentRating: ContentRating;
  tags: MangaTag[];
  authors: MangaAuthor[];
  coverArt?: string;         // full URL
  coverFileName?: string;    // raw file name for CDN construction
  rating?: number;
  follows?: number;
  chapterCount?: number;
  lastChapter?: string;
  latestUploadedChapter?: string;
}

export interface MangaDetail extends MangaResult {
  relatedManga: { id: string; title: string; relation: string; coverArt?: string }[];
  links: Record<string, string>;  // mal, al, anilist, etc.
  availableTranslatedLangs: string[];
}

export interface Chapter {
  id: string;
  title: string;
  volume?: string;
  chapter?: string;
  pages: number;
  translatedLanguage: string;
  scanlationGroup?: string;
  publishAt: string;
  readableAt: string;
  externalUrl?: string;    // Some chapters are hosted externally
}

export interface ChapterPages {
  chapterId: string;
  baseUrl: string;
  hash: string;
  data: string[];         // high-quality pages
  dataSaver: string[];    // compressed pages
}

// ── Provider Interface (for future licensed integrations) ──────────────────

export interface MangaProvider {
  id: string;
  name: string;
  logoUrl?: string;
  isLicensed: boolean;
  supportedLanguages: string[];
  search(query: string, options?: SearchOptions): Promise<MangaResult[]>;
  getDetail(id: string): Promise<MangaDetail>;
  getChapters(id: string, options?: ChapterOptions): Promise<Chapter[]>;
  getPages(chapterId: string, dataSaver?: boolean): Promise<ChapterPages>;
  getTrending?(): Promise<MangaResult[]>;
  getLatest?(): Promise<MangaResult[]>;
  getByGenre?(genre: string, page?: number): Promise<MangaResult[]>;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  genres?: string[];
  status?: MangaStatus;
  language?: string;
  contentRating?: ContentRating[];
  sortBy?: 'relevance' | 'latestUploadedChapter' | 'followedCount' | 'rating';
}

export interface ChapterOptions {
  language?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ── Reading Progress ───────────────────────────────────────────────────────

export interface ReadingProgress {
  mangaId: string;
  mangaTitle: string;
  coverArt?: string;
  chapterId: string;
  chapterNum: string;
  page: number;
  totalPages: number;
  lastRead: string;       // ISO date
}

export interface MangaBookmark {
  mangaId: string;
  title: string;
  coverArt?: string;
  status: MangaStatus;
  addedAt: string;
}

// ── Genre definitions ──────────────────────────────────────────────────────

export const MANGA_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Isekai', 'Mecha', 'School Life', 'Martial Arts',
] as const;

export type MangaGenre = typeof MANGA_GENRES[number];

// MangaDex genre → tag UUID map (static, won't change)
export const GENRE_TAG_MAP: Record<string, string> = {
  'Action':        '391b0423-d847-456f-aff0-8b0cfc03066b',
  'Adventure':     '87cc87cd-a395-47af-b27a-93258283bbc6',
  'Comedy':        '4d32cc48-9f00-4cca-9b5a-a839f0764984',
  'Drama':         'b9af3a63-f058-46de-a9a0-e0c13906197a',
  'Fantasy':       'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
  'Horror':        'cdad7e68-1419-41dd-bdce-27753074a640',
  'Mystery':       'ee968100-4191-4968-93d3-f82d72be7e46',
  'Psychological': '3b60b75c-a2d7-4860-ab56-05f391bb889c',
  'Romance':       '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
  'Sci-Fi':        '256c8bd9-4904-4360-bf4f-508a76d67183',
  'Slice of Life': 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9',
  'Sports':        '69964a64-2f90-4d33-beeb-f3ed2875eb4c',
  'Supernatural':  'eabc5b4c-6aff-42f3-b657-3e90cbd00b75',
  'Thriller':      '07251805-a27e-4d59-b488-f0bfbec15168',
  'Isekai':        'ace04997-f6bd-436e-b261-779182193d3d',
  'Mecha':         'a1f53773-c69a-4ce5-8cab-fffcd90b1565',
  'Martial Arts':  '799c202e-7daa-44eb-9cf7-8a3c0441531e',
};
