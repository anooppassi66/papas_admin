"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function posApi(path: string) {
  const token = localStorage.getItem("store_token");
  return fetch(`${API}/pos${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
}

interface OrderItem { product_name: string; quantity: number; price: number; sku: string; }
interface Order {
  order_no: string; date: string; status: string; order_status: string;
  total: number; shipping_name: string; shipping_city: string; shipping_phone: string;
  items: OrderItem[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", paid: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700", shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600",
};

export default function PosOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    posApi("/orders").then(d => setOrders(d || [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    !search || o.order_no.toLowerCase().includes(search.toLowerCase()) ||
    o.shipping_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-[#1e1e21]"><i className="fa-solid fa-cart-shopping text-[#f69a39] mr-2" />Online Orders</h1>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search order or customer…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:border-[#f69a39]" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.order_no} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-[#1e1e21]">#{order.order_no}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_STYLE[order.order_status || order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.order_status || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{order.shipping_name} · {order.shipping_city}</p>
                  <p className="text-xs text-gray-400">{order.date ? new Date(order.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#f69a39] text-lg">${Number(order.total || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-gray-400">{(order.items || []).length} item{(order.items || []).length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setExpanded(expanded === order.order_no ? null : order.order_no)}
                  className="text-gray-400 hover:text-[#f69a39] transition-colors px-2">
                  <i className={`fa-solid fa-chevron-down transition-transform ${expanded === order.order_no ? "rotate-180" : ""}`} />
                </button>
              </div>
              {expanded === order.order_no && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                  {(order.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs py-1">
                      <span className="text-gray-600">{it.product_name}<span className="font-mono text-gray-400 ml-2">×{it.quantity}</span>{it.sku && <span className="ml-2 text-gray-300">({it.sku})</span>}</span>
                      <span className="font-semibold">${(Number(it.price) * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.shipping_phone && (
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                      <i className="fa-solid fa-phone mr-1" />{order.shipping_phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
