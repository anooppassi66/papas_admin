"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function posApi(path: string) {
  const token = localStorage.getItem("store_token");
  return fetch(`${API}/pos${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
}

interface Product {
  sku: string; product_name: string; size: string; color: string;
  actual_price: number; selling_price: number; offer_price: number | null; stock: number;
}

export default function PosProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    posApi("/barcodes").then(d => setProducts(d || [])).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.product_name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-[#1e1e21]">
          <i className="fa-solid fa-box text-[#f69a39] mr-2" />Products
        </h1>
        <span className="text-[12px] text-gray-400">{filtered.length} variant{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by product name or SKU…"
        className="w-full mb-4 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#f69a39]"
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No products found</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-left px-4 py-3">Variant</th>
                <th className="text-right px-4 py-3">Cost</th>
                <th className="text-right px-4 py-3">Sell Price</th>
                <th className="text-right px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const displayPrice = p.offer_price || p.selling_price;
                const hasOffer = p.offer_price && p.offer_price < p.selling_price;
                return (
                  <tr key={p.sku} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-[#1e1e21] text-[13px]">{p.product_name}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">
                      {p.size}{p.color ? ` · ${p.color}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-gray-400">
                      ${Number(p.actual_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[13px] font-semibold text-[#f69a39]">${Number(displayPrice).toFixed(2)}</span>
                      {hasOffer && (
                        <span className="block text-[10px] text-gray-400 line-through">${Number(p.selling_price).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[12px] font-semibold ${p.stock > 5 ? "text-green-500" : p.stock > 0 ? "text-amber-500" : "text-red-400"}`}>
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
