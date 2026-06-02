"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get("expired") === "1") setExpired(true);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/auth/login", form);
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1e21] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#f69a39] font-bold text-4xl tracking-wider">PAPAS</div>
          <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Admin Panel</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-[#1e1e21] mb-6">Sign In</h2>

          {expired && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2">
              <i className="fa-solid fa-clock text-amber-500" />
              Your session has expired. Please sign in again.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f69a39] transition-colors"
                placeholder="admin@papas.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f69a39] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#f69a39] hover:bg-[#e8880d] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <a href="https://www.kkeydos.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 mt-6 group">
          <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors">Powered by</span>
          <Image src="/keydos-logo.webp" alt="Keydos" width={72} height={24} className="opacity-80 group-hover:opacity-100 transition-opacity" />
        </a>
        <p className="text-center text-white/20 text-xs mt-3">Papas Willow © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
