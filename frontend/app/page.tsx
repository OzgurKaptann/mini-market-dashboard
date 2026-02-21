export default function Home() {
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Mini Market Dashboard</h1>
        <p className="text-sm text-gray-500">
          JWT Auth + Rate Limit + Cache + Backend Proxy (CoinGecko)
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <a
          href="/login"
          className="rounded-xl border p-3 text-center font-medium"
        >
          Login
        </a>
        <a
          href="/register"
          className="rounded-xl border p-3 text-center font-medium"
        >
          Register
        </a>
        <a
          href="/dashboard"
          className="rounded-xl border p-3 text-center font-medium"
        >
          Dashboard
        </a>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Not: Coin verileri sadece Dashboard içinde (token ile) backend proxy üzerinden çekilir.
      </p>
    </main>
  );
}