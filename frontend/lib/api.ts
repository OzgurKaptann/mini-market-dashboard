const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiError = Error & { status?: number; detail?: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // json olmayan cevaplar için
  }

  if (!res.ok) {
    const err: ApiError = new Error(data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.detail = data?.detail;
    throw err;
  }

  return data as T;
}