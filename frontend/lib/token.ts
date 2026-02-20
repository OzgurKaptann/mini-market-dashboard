const KEY = "mm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(KEY);
}
