"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";

interface PL {
  id: number; salary: number; rent: number; repairs_amount: number; total_expense: number;
  product_sales_profit_amount: number; product_service_profit_amount: number;
  total_profit_amount: number; total: number; date: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ProfitLossPage() {
  const [records, setRecords] = useState<PL[]>([]);
  const [form, setForm] = useState({ salary: "", rent: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
  const [preview, setPreview] = useState<{ repairs_amount: number; product_sales_profit_amount: number; product_service_profit_amount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try { setRecords(await api.get("/profit-loss")); } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  async function fetchPreview() {
    setLoading(true); setError("");
    try { setPreview(await api.get(`/profit-loss/preview?month=${form.month}&year=${form.year}`)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/profit-loss", { salary: form.salary, rent: form.rent, month: form.month, year: form.year });
      setSuccess("P&L statement saved successfully!"); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  const salary = parseFloat(form.salary) || 0;
  const rent = parseFloat(form.rent) || 0;
  const repairs = preview?.repairs_amount || 0;
  const totalExpense = salary + rent + repairs;
  const salesProfit = preview?.product_sales_profit_amount || 0;
  const serviceProfit = preview?.product_service_profit_amount || 0;
  const totalProfit = salesProfit + serviceProfit;
  const netIncome = totalProfit - totalExpense;

  return (
    <div>
      <AdminHeader title="Profit & Loss Statement" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm mb-4">Generate Statement</h3>
          <form onSubmit={handleGenerate} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Month</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Salary (£)</label>
              <input type="number" step="0.01" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rent (£)</label>
              <input type="number" step="0.01" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <button type="button" onClick={fetchPreview} disabled={loading}
              className="w-full border border-[#f69a39] text-[#f69a39] hover:bg-[#f69a39]/10 text-sm py-2 rounded-lg transition-colors disabled:opacity-60">
              {loading ? "Loading…" : "Preview Data"}
            </button>
            <button type="submit" disabled={saving || !preview}
              className="w-full bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm py-2 rounded-lg font-medium transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save P&L Statement"}
            </button>
          </form>
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-sm mb-4">{MONTHS[parseInt(form.month) - 1]} {form.year} — Preview</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Expenses</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Salary</span><span>£{salary.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Rent</span><span>£{rent.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Repairs</span><span>£{repairs.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Total Expense</span><span className="text-red-600">£{totalExpense.toFixed(2)}</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Profit</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Sales Profit</span><span>£{salesProfit.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Repair Profit</span><span>£{serviceProfit.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Total Profit</span><span className="text-green-600">£{totalProfit.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="bg-[#1e1e21] rounded-lg p-3 text-white">
                <div className="text-xs uppercase tracking-wide text-white/40 mb-2">Net Income</div>
                <div className="flex justify-between text-sm"><span className="text-white/60">Profit</span><span>£{totalProfit.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/60">Expenses</span><span>- £{totalExpense.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2 mt-2">
                  <span>TOTAL</span>
                  <span className={netIncome >= 0 ? "text-[#f69a39]" : "text-red-400"}>£{netIncome.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-sm mb-4">Statement History</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-gray-400 text-sm">No statements yet</p>
            ) : records.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                <div className="font-medium text-sm">{new Date(r.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
                <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-500">
                  <span>Profit: <span className="text-green-600 font-medium">£{Number(r.total_profit_amount).toFixed(2)}</span></span>
                  <span>Expenses: <span className="text-red-500 font-medium">£{Number(r.total_expense).toFixed(2)}</span></span>
                  <span className="col-span-2 font-semibold text-sm">Net: <span className={Number(r.total) >= 0 ? "text-[#f69a39]" : "text-red-500"}>£{Number(r.total).toFixed(2)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
