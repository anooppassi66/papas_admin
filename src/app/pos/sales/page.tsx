"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function posApi(path: string) {
  const token = localStorage.getItem("store_token");
  return fetch(`${API}/pos${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
}

interface SaleItem { product_name: string; sku: string; quantity: number; unit_price: number; total_price: number; }
interface Sale {
  id: number; invoice_no: string; customer_name: string | null; customer_phone: string | null;
  subtotal: number; tax_amount: number; discount: number; total: number; profit_amount: number;
  payment_method: string; created_at: string; items: SaleItem[];
}

const PM_COLOR: Record<string, string> = {
  cash: "bg-green-100 text-green-700",
  card: "bg-blue-100 text-blue-700",
  transfer: "bg-purple-100 text-purple-700",
};

export default function PosSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expanded, setExpanded] = useState<number | null>(null);
  const [printSale, setPrintSale] = useState<Sale | null>(null);

  useEffect(() => {
    setLoading(true);
    posApi(`/sales?date=${date}`)
      .then(data => setSales(data || []))
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, [date]);

  const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);

  function handlePrint(sale: Sale) { setPrintSale(sale); setTimeout(() => { window.print(); setPrintSale(null); }, 300); }

  return (
    <div>
      {/* Print receipt (hidden, shown only during print) */}
      {printSale && (
        <div id="print-receipt" className="hidden print:block text-xs font-mono p-4">
          <div className="text-center font-bold text-base mb-1">PAPAS Cricket</div>
          <div className="text-center mb-3">{printSale.invoice_no}</div>
          <div className="mb-2">{new Date(printSale.created_at).toLocaleString()}</div>
          {printSale.customer_name && <div>Customer: {printSale.customer_name}</div>}
          {printSale.customer_phone && <div>Phone: {printSale.customer_phone}</div>}
          <div className="border-t border-dashed border-black my-2" />
          {(printSale.items || []).map((it, i) => (
            <div key={i} className="flex justify-between">
              <span>{it.product_name} x{it.quantity}</span>
              <span>${Number(it.total_price).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-black my-2" />
          <div className="flex justify-between"><span>Subtotal</span><span>${Number(printSale.subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>${Number(printSale.tax_amount).toFixed(2)}</span></div>
          {Number(printSale.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-${Number(printSale.discount).toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>${Number(printSale.total).toFixed(2)}</span></div>
          <div className="border-t border-dashed border-black my-2" />
          <div className="text-center">Payment: {printSale.payment_method.toUpperCase()}</div>
          <div className="text-center mt-3">Thank you!</div>
        </div>
      )}

      <style>{`@media print { body > * { display: none !important; } #print-receipt { display: block !important; } }`}</style>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-[#1e1e21]"><i className="fa-solid fa-receipt text-[#f69a39] mr-2" />Sales History</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Sales Today", value: sales.length, icon: "fa-solid fa-receipt" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "fa-solid fa-dollar-sign" },
          { label: "Avg Sale", value: sales.length ? `$${(totalRevenue / sales.length).toFixed(2)}` : "$0.00", icon: "fa-solid fa-chart-simple" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fff8f0] rounded-lg flex items-center justify-center">
              <i className={`${c.icon} text-[#f69a39]`} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{c.label}</p>
              <p className="font-bold text-[#1e1e21] text-lg">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No sales for this date</div>
      ) : (
        <div className="space-y-3">
          {sales.map(sale => (
            <div key={sale.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-[#1e1e21]">{sale.invoice_no}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${PM_COLOR[sale.payment_method] || "bg-gray-100 text-gray-600"}`}>
                      {sale.payment_method}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{sale.customer_name && ` · ${sale.customer_name}`}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#f69a39] text-lg">${Number(sale.total).toFixed(2)}</p>
                  <p className="text-[11px] text-gray-400">{(sale.items || []).length} item{(sale.items || []).length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePrint(sale)}
                    className="text-gray-400 hover:text-[#f69a39] transition-colors px-2" title="Print">
                    <i className="fa-solid fa-print" />
                  </button>
                  <button onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                    className="text-gray-400 hover:text-[#f69a39] transition-colors px-2">
                    <i className={`fa-solid fa-chevron-down transition-transform ${expanded === sale.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>
              {expanded === sale.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  {(sale.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs py-1">
                      <span className="text-gray-600">{it.product_name} <span className="font-mono text-gray-400">×{it.quantity}</span></span>
                      <span className="font-semibold">${Number(it.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-xs text-gray-500">
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
