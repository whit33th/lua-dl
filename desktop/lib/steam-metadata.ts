export type SteamMetadata = {
  appId: string;
  name: string;
  type?: string;
  headerImage?: string;
  isFallback?: boolean;
};

export async function fetchSteamMetadata(
  appId: string,
): Promise<SteamMetadata> {
  const response = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`,
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
