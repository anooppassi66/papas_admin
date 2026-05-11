"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";

interface GiftCard {
  id: number; code: string; amount: number; balance: number;
  purchaser_name: string; purchaser_email: string;
  recipient_name: string; recipient_email: string;
  message: string; is_active: number;
  created_at: string; expires_at: string;
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const data = await api.get("/gift-cards") as GiftCard[];
    setCards(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(id: number) {
    await api.patch(`/gift-cards/${id}/toggle`, {});
    load();
  }

  const filtered = cards.filter(c =>
    c.code.includes(search.toUpperCase()) ||
    c.purchaser_email.toLowerCase().includes(search.toLowerCase()) ||
    c.recipient_email.toLowerCase().includes(search.toLowerCase())
  );

  const totalIssued = cards.reduce((s, c) => s + Number(c.amount), 0);
  const totalRedeemed = cards.reduce((s, c) => s + (Number(c.amount) - Number(c.balance)), 0);
  const totalOutstanding = cards.reduce((s, c) => s + Number(c.balance), 0);

  return (
    <div>
      <AdminHeader title="Gift Cards" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Issued", value: `$${totalIssued.toFixed(2)}`, sub: `${cards.length} cards` },
          { label: "Redeemed", value: `$${totalRedeemed.toFixed(2)}` },
          { label: "Outstanding Balance", value: `$${totalOutstanding.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="bg-[#1e1e21] rounded-lg px-5 py-4 border border-white/5">
            <div className="text-[24px] font-bold text-white">{s.value}</div>
            <div className="text-white/40 text-[12px] mt-0.5">{s.label}</div>
            {s.sub && <div className="text-white/25 text-[11px]">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by code or email…"
          className="w-full max-w-sm px-4 py-2 bg-[#1e1e21] border border-white/10 rounded-lg text-white text-[13px] placeholder-white/30 outline-none focus:border-[#f69a39]/50"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1e1e21] rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/5">
              {["Code", "Amount", "Balance", "Purchaser", "Recipient", "Expires", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] text-white/40 font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-white/30 text-[13px]">No gift cards found.</td></tr>
            ) : filtered.map(c => {
              const pct = Number(c.amount) > 0 ? (Number(c.balance) / Number(c.amount)) * 100 : 0;
              return (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-[12px] text-[#f69a39]">{c.code}</td>
                  <td className="px-4 py-3 text-white text-[13px] font-semibold">${Number(c.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[13px]">${Number(c.balance).toFixed(2)}</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#f69a39] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-[12px]">{c.purchaser_name || "—"}</p>
                    <p className="text-white/40 text-[11px]">{c.purchaser_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-[12px]">{c.recipient_name || "—"}</p>
                    <p className="text-white/40 text-[11px]">{c.recipient_email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-[12px]">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      !c.is_active ? "bg-red-500/10 text-red-400" :
                      Number(c.balance) <= 0 ? "bg-white/5 text-white/30" :
                      "bg-green-500/10 text-green-400"
                    }`}>
                      {!c.is_active ? "Disabled" : Number(c.balance) <= 0 ? "Spent" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c.id)}
                      className="text-[11px] text-white/40 hover:text-white transition-colors"
                    >
                      {c.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
