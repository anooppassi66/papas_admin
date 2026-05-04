"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [margin, setMargin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/settings").then(d => setMargin(String(d.margin || ""))).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    try {
      await api.put("/settings", { margin: parseFloat(margin) });
      setSuccess("Settings updated successfully!");
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <AdminHeader title="Settings" />
      <div className="max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margin Percentage (%)</label>
              <p className="text-xs text-gray-400 mb-3">This margin is applied to the landed unit cost when auto-calculating the recommended sell price on purchase lines.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={margin} onChange={e => setMargin(e.target.value)} required
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f69a39] focus:ring-1 focus:ring-[#f69a39]/20"
                  placeholder="e.g. 20"
                />
                <span className="text-lg font-semibold text-gray-400">%</span>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#f69a39] hover:bg-[#e8880d] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {loading ? "Saving…" : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
