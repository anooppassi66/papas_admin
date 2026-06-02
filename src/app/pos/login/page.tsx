"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function PosLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/store-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("store_token", data.token);
      localStorage.setItem("store_info", JSON.stringify(data.store));
      router.push("/pos/sale");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#1e1e21] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[#f69a39] font-bold text-4xl tracking-wider">PAPAS</div>
          <div className="text-white/40 text-xs uppercase tracking-widest mt-1">Point of Sale</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-[#1e1e21] mb-6">Store Login</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Store Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f69a39]"
                placeholder="store@papas.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f69a39]"
                placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full mt-6 bg-[#f69a39] hover:bg-[#e8880d] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
            {loading ? "Signing in…" : "Sign In to POS"}
          </button>
        </form>

        <a href="https://www.kkeydos.com/" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-6 group">
          <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors">Powered by</span>
          <Image src="/keydos-logo.webp" alt="Keydos" width={72} height={24} className="opacity-80 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  );
}
