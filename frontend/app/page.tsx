type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
};

async function fetchCoins(): Promise<{ source: string; data: Coin[] }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${base}/api/coins/markets?vs_currency=usd&per_page=20&page=1`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch coins");
  }

  return res.json();
}

export default async function Home() {
  const result = await fetchCoins();

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Mini Market Dashboard</h1>
        <p className="text-sm text-gray-500">
          Source: <span className="font-medium">{result.source}</span>
        </p>
      </header>

      <section className="space-y-3">
        {result.data.map((c) => {
          const pct = c.price_change_percentage_24h ?? 0;
          const pctClass = pct >= 0 ? "text-green-600" : "text-red-600";

          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border p-3">
              <img src={c.image} alt={c.name} className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      {c.symbol?.toUpperCase()} • #{c.market_cap_rank}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${c.current_price?.toLocaleString()}
                    </div>
                    <div className={`text-sm font-medium ${pctClass}`}>
                      {pct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
