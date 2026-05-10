export type SteamMetadata = {
  appId: string;
  name: string;
  type?: string;
  headerImage?: string;
  shortDescription?: string;
  releaseDate?: string;
  developers?: string[];
  publishers?: string[];
  genres?: SteamTag[];
  categories?: SteamTag[];
  screenshots?: SteamScreenshot[];
  movies?: SteamMovie[];
  metacriticScore?: number;
  recommendationsTotal?: number;
  isFallback?: boolean;
};

export type SteamTag = {
  id: number;
  description: string;
};

export type SteamScreenshot = {
  id: number;
  thumbnail: string;
  full: string;
};

export type SteamMovie = {
  id: number;
  name: string;
  thumbnail?: string;
  mp4?: string;
};

export async function fetchSteamMetadata(
  appId: string,
): Promise<SteamMetadata> {
  const response = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic,categories,genres,screenshots,movies,metacritic,recommendations,release_date&l=english&cc=US`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Steam metadata request failed with HTTP ${response.status}.`,
    );
  }

  const data = await response.json();
  const entry = data?.[appId];
  const details = entry?.data;
  if (!entry?.success || !details?.name) {
    throw new Error("Steam did not return metadata for this App ID.");
  }

  return {
    appId,
    name: details.name,
    type: details.type,
    headerImage: details.header_image,
    shortDescription: stripHtml(details.short_description),
    releaseDate: details.release_date?.date,
    developers: normalizeStringArray(details.developers),
    publishers: normalizeStringArray(details.publishers),
    genres: normalizeTags(details.genres),
    categories: normalizeTags(details.categories),
    screenshots: normalizeScreenshots(details.screenshots),
    movies: normalizeMovies(details.movies),
    metacriticScore: details.metacritic?.score,
    recommendationsTotal: details.recommendations?.total,
  };
}

export function fallbackMetadata(appId: string): SteamMetadata {
  return {
    appId,
    name: `Hmm… ${appId}? nope.`,
    isFallback: true,
  };
}

export type SteamSearchResult = {
  id: number;
  name: string;
  tiny_image: string;
};

const searchCache = new Map<
  string,
  { expiresAt: number; results: SteamSearchResult[] }
>();
const searchCacheTtlMs = 5 * 60 * 1000;

export async function searchSteamGames(
  term: string,
): Promise<SteamSearchResult[]> {
  const query = term.trim().toLowerCase();
  if (query.length < 2) return [];

  const cached = searchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const response = await fetch(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      query,
    )}&l=english&cc=US`,
  );
  if (!response.ok) return [];

  const data = await response.json();
  const results = (data?.items || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    tiny_image: item.tiny_image,
  }));
  searchCache.set(query, {
    expiresAt: Date.now() + searchCacheTtlMs,
    results,
  });
  return results;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function normalizeTags(value: unknown): SteamTag[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item?.id && item?.description)
    .map((item) => ({
      id: Number(item.id),
      description: String(item.description),
    }));
}

function normalizeScreenshots(value: unknown): SteamScreenshot[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item?.id && item?.path_thumbnail && item?.path_full)
    .map((item) => ({
      id: Number(item.id),
      thumbnail: String(item.path_thumbnail),
      full: String(item.path_full),
    }));
}

function normalizeMovies(value: unknown): SteamMovie[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item) => item?.id && item?.name)
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name),
      thumbnail:
        typeof item.thumbnail === "string" ? item.thumbnail : undefined,
      mp4: typeof item.mp4?.max === "string" ? item.mp4.max : item.mp4?.["480"],
    }));
}

function stripHtml(value: unknown) {
  return typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : undefined;
}
