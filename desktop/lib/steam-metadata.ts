export type SteamMetadata = {
  appId: string;
  name: string;
  type?: string;
  headerImage?: string;
  isFallback?: boolean;
};

export async function fetchSteamMetadata(appId: string): Promise<SteamMetadata> {
  const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Steam metadata request failed with HTTP ${response.status}.`);
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
