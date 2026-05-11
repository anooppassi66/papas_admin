"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";

interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
  is_active: number;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const data = await api.get("/newsletter") as Subscriber[];
    setSubscribers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(id: number) {
    await api.patch(`/newsletter/${id}/toggle`, {});
    load();
  }

  async function remove(id: number, email: string) {
    if (!confirm(`Remove ${email} from newsletter?`)) return;
    await api.delete(`/newsletter/${id}`);
    load();
  }

  function exportCsv() {
    const active = subscribers.filter(s => s.is_active);
    const csv = ["Email,Subscribed At", ...active.map(s => `${s.email},${new Date(s.subscribed_at).toLocaleString()}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "newsletter_subscribers.csv";
    a.click();
  }

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = subscribers.filter(s => s.is_active).length;

  return (
    <div>
      <AdminHeader
        title="Newsletter Subscribers"
        action={
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-[#f69a39] text-white text-[13px] font-medium rounded-lg hover:bg-[#e8880d] transition-colors"
          >
            Export CSV
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: subscribers.length },
          { label: "Active", value: activeCount },
          { label: "Unsubscribed", value: subscribers.length - activeCount },
        ].map(s => (
          <div key={s.label} className="bg-[#1e1e21] rounded-lg px-5 py-4 border border-white/5">
            <div className="text-[28px] font-bold text-white">{s.value}</div>
            <div className="text-white/40 text-[12px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full max-w-sm px-4 py-2 bg-[#1e1e21] border border-white/10 rounded-lg text-white text-[13px] placeholder-white/30 outline-none focus:border-[#f69a39]/50"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1e1e21] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-[11px] text-white/40 font-medium uppercase tracking-wider">#</th>
              <th className="text-left px-5 py-3 text-[11px] text-white/40 font-medium uppercase tracking-wider">Email</th>
              <th className="text-left px-5 py-3 text-[11px] text-white/40 font-medium uppercase tracking-wider">Subscribed</th>
              <th className="text-left px-5 py-3 text-[11px] text-white/40 font-medium uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-white/30 text-[13px]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-white/30 text-[13px]">No subscribers found.</td></tr>
            ) : filtered.map((s, i) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-white/30 text-[13px]">{i + 1}</td>
                <td className="px-5 py-3 text-white text-[13px] font-mono">{s.email}</td>
                <td className="px-5 py-3 text-white/50 text-[12px]">
                  {new Date(s.subscribed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    s.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {s.is_active ? "Active" : "Unsubscribed"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      onClick={() => toggleActive(s.id)}
                      className="text-[11px] text-white/40 hover:text-white transition-colors"
                    >
                      {s.is_active ? "Unsubscribe" : "Reactivate"}
                    </button>
                    <button
                      onClick={() => remove(s.id, s.email)}
                      className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
