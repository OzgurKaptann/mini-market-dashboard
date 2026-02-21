"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getToken, clearToken } from "../../lib/token";
import { getFavorites, toggleFavorite } from "../../lib/favorites";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  price_change_percentage_24h?: number;
};

type Me = {
  email: string;
  plan_type: string;
  daily_request_count: number;
  last_request_date?: string | null;
};

const FREE_DAILY_LIMIT = 10;

export default function DashboardPage() {
  const router = useRouter();

  const [coins, setCoins] = useState<Coin[]>([]);
  const [me, setMe] = useState<Me | null>(null);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // /me ve /markets paralel (daha hızlı)
      const [meRes, marketsRes] = await Promise.all([
        apiFetch<Me>("/me", {}, token),
        apiFetch<any>(
          "/api/coins/markets?vs_currency=usd&per_page=20&page=1",
          {},
          token
        ),
      ]);

      setMe(meRes);

      // API shape normalize
      const list: Coin[] | null =
        Array.isArray(marketsRes)
          ? marketsRes
          : Array.isArray(marketsRes?.data)
          ? marketsRes.data
          : Array.isArray(marketsRes?.results)
          ? marketsRes.results
          : null;

      if (!list) {
        throw Object.assign(new Error("Unexpected API shape"), {
          status: 500,
          detail: "Beklenmeyen API cevabı (liste değil).",
        });
      }

      setCoins(list);
    } catch (e: any) {
  if (e?.status === 401) {
    clearToken();
    router.push("/login");
    return;
  }

  // 👇 UPSTREAM (CoinGecko) rate limit
  if (e?.status === 503) {
    setError(
      e?.detail ||
        "CoinGecko rate limit (public API). 30-60 saniye sonra tekrar deneyin."
    );
    return;
  }

  // 👇 Senin kullanıcı limitin
  if (e?.status === 429) {
    setError(e?.detail || "Günlük limit doldu (Free: 10/gün).");
    return;
  }

  setError(e?.detail || "Sunucu hatası. Tekrar dene.");

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setFavorites(getFavorites());
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = useMemo(() => {
    if (!me) return null;
    if ((me.plan_type || "").toLowerCase() !== "free") return null;
    const used = Number(me.daily_request_count || 0);
    const left = Math.max(0, FREE_DAILY_LIMIT - used);
    return { used, left };
  }, [me]);

  const filteredCoins = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = coins;

    if (q) {
      list = list.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const sym = (c.symbol || "").toLowerCase();
        return name.includes(q) || sym.includes(q);
      });
    }

    // Favoriler üstte
    const favSet = new Set(favorites);
    return [...list].sort((a, b) => {
      const af = favSet.has(a.id) ? 1 : 0;
      const bf = favSet.has(b.id) ? 1 : 0;
      return bf - af;
    });
  }, [coins, query, favorites]);

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Dashboard
          </h1>
          {me && (
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {me.email} · Plan: {me.plan_type}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
          <button
            onClick={loadData}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #333",
              cursor: "pointer",
            }}
          >
            Yenile
          </button>
          <button
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #333",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {remaining && (
        <div
          style={{
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 14,
          }}
        >
          Free plan kullanım: <b>{remaining.used}</b> / {FREE_DAILY_LIMIT} · Kalan:{" "}
          <b>{remaining.left}</b>
        </div>
      )}

      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Coin ara (name / symbol)"
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 10,
          }}
        />
      </div>

      {loading && <p>Yükleniyor...</p>}

      {error && (
        <div
          style={{
            padding: 10,
            border: "1px solid #f5c2c7",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
            Free plan limit dolduysa yarın sıfırlanır. (İstersen “Pro’ya yükselt”
            simülasyonu ekleriz.)
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filteredCoins.map((c) => {
          const isFav = favorites.includes(c.id);

          return (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                border: "1px solid #ddd",
                borderRadius: 14,
                padding: 12,
              }}
            >
              <button
                onClick={() => {
                  const next = toggleFavorite(c.id);
                  setFavorites(next);
                }}
                title={isFav ? "Favoriden çıkar" : "Favoriye ekle"}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid #333",
                  cursor: "pointer",
                  background: isFav ? "#333" : "transparent",
                  color: isFav ? "#fff" : "#333",
                  flex: "0 0 auto",
                }}
              >
                ★
              </button>

              <div style={{ width: 36, height: 36, flex: "0 0 auto" }}>
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt={c.name}
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      border: "1px solid #ccc",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {c.symbol?.toUpperCase()}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>
                  {typeof c.current_price === "number"
                    ? `$${c.current_price}`
                    : "-"}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {typeof c.price_change_percentage_24h === "number"
                    ? `${c.price_change_percentage_24h.toFixed(2)}% (24h)`
                    : "-"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && filteredCoins.length === 0 && (
        <p>Sonuç yok.</p>
      )}
    </main>
  );
}