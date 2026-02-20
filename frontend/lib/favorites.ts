const KEY = "mm_favs";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(ids));
}

export function toggleFavorite(id: string): string[] {
  const current = getFavorites();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  setFavorites(next);
  return next;
}
