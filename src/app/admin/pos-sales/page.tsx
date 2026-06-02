"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";

interface SaleItem { product_name: string; sku: string; quantity: number; unit_price: number; total_price: number; }
interface Sale {
  id: number; invoice_no: string; store_name: string;
  customer_name: string | null; customer_phone: string | null;
  subtotal: number; tax_amount: number; discount: number;
  total: number; profit_amount: number;
  payment_method: string; created_at: string; items: SaleItem[];
}
interface Store { id: number; name: string; }

const PM_COLOR: Record<string, string> = {
  cash: "bg-green-100 text-green-700 border-green-200",
  card: "bg-blue-100 text-blue-700 border-blue-200",
  transfer: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AdminPosSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/stores").then((d) => setStores((d as Store[]) || [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month, year });
    if (storeId) params.set("store_id", storeId);
    try {
      const data = await api.get(`/pos/admin/sales?${params}`) as Sale[];
      setSales(data || []);
    } catch { setSales([]); }
    finally { setLoading(false); }
  }, [month, year, storeId]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);
  const totalProfit  = sales.reduce((s, r) => s + Number(r.profit_amount), 0);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <AdminHeader title="POS Offline Sales" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
          {MONTHS.map((m, i) => <option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={storeId} onChange={e => setStoreId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
          <option value="">All Stores</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Sales", value: sales.length, icon: "fa-solid fa-receipt", color: "bg-orange-50 text-[#f69a39]" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "fa-solid fa-dollar-sign", color: "bg-blue-50 text-blue-600" },
          { label: "Profit", value: `$${totalProfit.toFixed(2)}`, icon: "fa-solid fa-chart-line", color: "bg-green-50 text-green-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
              <i className={`${c.icon}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{c.label}</p>
              <p className="font-bold text-[#1e1e21] text-lg">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No offline sales found</div>
      ) : (
        <div className="space-y-3">
          {sales.map(sale => (
            <div key={sale.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-sm font-bold text-[#1e1e21]">{sale.invoice_no}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${PM_COLOR[sale.payment_method] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{sale.payment_method}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{sale.store_name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  {sale.customer_name && <p className="text-xs text-gray-400 mt-0.5">{sale.customer_name}{sale.customer_phone && ` · ${sale.customer_phone}`}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-[#f69a39] text-lg">${Number(sale.total).toFixed(2)}</p>
                  <p className="text-[11px] text-green-600">Profit: ${Number(sale.profit_amount).toFixed(2)}</p>
                </div>
                <button onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                  className="text-gray-400 hover:text-[#f69a39] transition-colors">
                  <i className={`fa-solid fa-chevron-down transition-transform ${expanded === sale.id ? "rotate-180" : ""}`} />
                </button>
              </div>
              {expanded === sale.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  {(sale.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs py-1">
                      <span className="text-gray-600">{it.product_name} <span className="font-mono text-gray-400">×{it.quantity}</span>{it.sku && <span className="ml-1 text-gray-300">({it.sku})</span>}</span>
                      <span className="font-semibold">${Number(it.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2 text-xs text-gray-500 flex justify-between">
                    <span>Tax ${Number(sale.tax_amount).toFixed(2)}{Number(sale.discount) > 0 && ` · Discount -$${Number(sale.discount).toFixed(2)}`}</span>
                    <span className="font-bold text-[#1e1e21]">Total ${Number(sale.total).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
