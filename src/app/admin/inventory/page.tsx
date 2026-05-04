"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import { api } from "@/lib/api";

interface InventoryRow {
  id: number; store_name?: string; product_name?: string; product_code?: string;
  sku?: string; size?: string; color?: string; quantity: number; store_id: number;
}
interface Store { id: number; name: string; parent_store_id: number; }
interface Variant { id: number; product_name?: string; sku?: string; size?: string; color?: string; }

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [modal, setModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [form, setForm] = useState({ store_id: "" as string | number, product_variation_id: "" as string | number, quantity: "" as string | number });
  const [transfer, setTransfer] = useState({ from_store_id: "" as string | number, to_store_id: "" as string | number, product_variation_id: "" as string | number, quantity: "" as string | number });
  const [filterStore, setFilterStore] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const q = filterStore ? `?store_id=${filterStore}` : "";
      const [inv, s, v] = await Promise.all([api.get(`/inventory${q}`), api.get("/stores"), api.get("/product-variants")]);
      setInventory(inv); setStores(s); setVariants(v);
    } catch (_) {}
  }, [filterStore]);
  useEffect(() => { load(); }, [load]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try { await api.post("/inventory", form); setModal(false); load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try { await api.post("/inventory/transfer", transfer); setTransferModal(false); load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <AdminHeader
        title="Inventory"
        action={
          <div className="flex gap-2">
            <button onClick={() => { setTransfer({ from_store_id: "", to_store_id: "", product_variation_id: "", quantity: "" }); setError(""); setTransferModal(true); }}
              className="border border-[#f69a39] text-[#f69a39] hover:bg-[#f69a39]/10 text-sm px-4 py-2 rounded-lg font-medium transition-colors">Transfer Stock</button>
            <button onClick={() => { setForm({ store_id: "", product_variation_id: "", quantity: "" }); setError(""); setModal(true); }}
              className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Assign Product</button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-500">Filter by store:</label>
        <select value={filterStore} onChange={e => setFilterStore(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
          <option value="">All Stores</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Store", "Product", "SKU", "Size", "Color", "Quantity"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inventory.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No inventory records</td></tr>
            ) : inventory.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row.store_name || "—"}</td>
                <td className="px-4 py-3">{row.product_name || "—"}<div className="text-xs text-gray-400">{row.product_code}</div></td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.sku || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{row.size || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{row.color || "—"}</td>
                <td className="px-4 py-3 font-semibold text-[#1e1e21]">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Assign Product to Store" onClose={() => setModal(false)}>
          <form onSubmit={handleAssign} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Store *</label>
              <select required value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select store</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product Variation *</label>
              <select required value={form.product_variation_id} onChange={e => setForm({ ...form, product_variation_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select variant</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.product_name} — {v.size} {v.color} ({v.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity *</label>
              <input type="number" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {loading ? "Assigning…" : "Assign"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {transferModal && (
        <Modal title="Transfer Stock" onClose={() => setTransferModal(false)}>
          <form onSubmit={handleTransfer} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Store *</label>
              <select required value={transfer.from_store_id} onChange={e => setTransfer({ ...transfer, from_store_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select source store</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Store *</label>
              <select required value={transfer.to_store_id} onChange={e => setTransfer({ ...transfer, to_store_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select destination store</option>
                {stores.filter(s => String(s.id) !== String(transfer.from_store_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product Variation *</label>
              <select required value={transfer.product_variation_id} onChange={e => setTransfer({ ...transfer, product_variation_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select variant</option>
                {variants.map(v => <option key={v.id} value={v.id}>{v.product_name} — {v.size} {v.color} ({v.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity *</label>
              <input type="number" required value={transfer.quantity} onChange={e => setTransfer({ ...transfer, quantity: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTransferModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {loading ? "Transferring…" : "Transfer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
