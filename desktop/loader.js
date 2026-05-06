"use client";

export default function nextImageLoader({ src, width, quality }) {
  // Use weserv.nl to proxy and resize images
  // encodeURIComponent ensures the source URL or path is correctly escaped
  const q = 85;
  const w = width || "";
  return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
}
