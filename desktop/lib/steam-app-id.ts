export function parseSteamAppId(input: string) {
  const trimmed = input.trim();
  return /^\d{2,12}$/.test(trimmed) ? trimmed : undefined;
}
