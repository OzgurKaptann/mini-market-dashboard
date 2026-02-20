"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, login } from "../../lib/auth";
import { setToken } from "../../lib/token";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      const res = await login(email, password); // otomatik login
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (e: any) {
      // 400 (email exists) vb. durumlarda detail gelir
      setError(e?.detail || "Kayıt başarısız. Tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Register</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={6}
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        {error && (
          <div style={{ padding: 10, border: "1px solid #f5c2c7", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #333", cursor: "pointer" }}
        >
          {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </button>

        <div style={{ fontSize: 14 }}>
          <a href="/login">Login</a>
        </div>
      </form>
    </main>
  );
}
