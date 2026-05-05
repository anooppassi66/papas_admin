"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";

interface ServiceOrder {
  id: number; product_name?: string; brand_name?: string; sku?: string; size?: string; color?: string;
  repair_reason: string; quantity: number; payment_mode: string; price: number; selling_price: number;
  pending_amount: number; profit_amount: number; status: string; moeed_payment_status: string; date: string;
}

const STATUS_OPTIONS = ["Picked up", "Repair not possible", "Repair done", "In store"];
const PAYMENT_STATUS = ["pending", "paid"];

export default function ServicesPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try { setOrders(await api.get("/services/orders")); } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    await api.patch(`/services/orders/${id}/status`, { status }); load();
  }

  async function updatePayment(id: number, moeed_payment_status: string) {
    await api.patch(`/services/orders/${id}/payment`, { moeed_payment_status }); load();
  }

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  return (
    <div>
      <AdminHeader title="Service Orders" />

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-500">Filter by status:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
          <option value="">All</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1e1e21] text-white">
              <tr>{["Date", "Product", "Brand", "Repair Reason", "Qty", "Price", "Sell Price", "Pending", "Profit", "Service Status", "Payment", "Actions"].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-12 text-gray-400">No service orders</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-xs font-medium">{o.product_name || "—"}<div className="text-gray-400">{o.sku} {o.size} {o.color}</div></td>
                  <td className="px-3 py-2 text-xs">{o.brand_name || "—"}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{o.repair_reason || "—"}</td>
                  <td className="px-3 py-2 text-xs">{o.quantity}</td>
                  <td className="px-3 py-2 text-xs">${Number(o.price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">${Number(o.selling_price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs font-medium text-red-500">${Number(o.pending_amount).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs font-medium text-green-600">${Number(o.profit_amount).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#f69a39]">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={o.moeed_payment_status} onChange={e => updatePayment(o.id, e.target.value)}
                      className={`text-xs border rounded px-2 py-1 focus:outline-none ${o.moeed_payment_status === "paid" ? "border-green-300 text-green-700" : "border-yellow-300 text-yellow-700"}`}>
                      {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      o.status === "Repair done" ? "bg-green-100 text-green-700" :
                      o.status === "In store" ? "bg-blue-100 text-blue-600" :
                      o.status === "Repair not possible" ? "bg-red-100 text-red-600" :
                      "bg-yellow-100 text-yellow-700"}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
