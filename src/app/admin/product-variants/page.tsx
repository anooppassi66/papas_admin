"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";

interface Variant {
  id: number; product_id: number; product_name?: string; product_code?: string;
  size: string; color: string; sku: string; actual_price: number; selling_price: number; is_active: boolean;
}
interface Product { id: number; name: string; product_code: string; }

const EMPTY = { product_id: "" as string | number, size: "", color: "", sku: "", actual_price: "" as string | number, selling_price: "" as string | number };

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [v, p, s, c] = await Promise.all([
        api.get("/product-variants"),
        api.get("/products"),
        api.get("/product-variants/sizes"),
        api.get("/product-variants/colors"),
      ]);
      setVariants(v); setProducts(p); setSizes(s); setColors(c);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setNewSize(""); setNewColor(""); setError(""); setModal(true); }
  function openEdit(v: Variant) {
    setEditing(v);
    setForm({ product_id: v.product_id, size: v.size || "", color: v.color || "", sku: v.sku || "", actual_price: v.actual_price || "", selling_price: v.selling_price || "" });
    setNewSize(""); setNewColor(""); setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const payload = { ...form, size: newSize || form.size, color: newColor || form.color };
      if (editing) { await api.put(`/product-variants/${editing.id}`, payload); }
      else { await api.post("/product-variants", payload); }
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/product-variants/${id}/toggle`); load(); }

  return (
    <div>
      <AdminHeader
        title="Product Variations"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Variation</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Product", "Size", "Color", "SKU", "Cost", "Selling Price", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {variants.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">No variants yet</td></tr>
            ) : variants.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{v.product_name || "—"}<div className="text-xs text-gray-400">{v.product_code}</div></td>
                <td className="px-4 py-3 text-gray-500">{v.size || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{v.color || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{v.sku || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{v.actual_price ? `$${Number(v.actual_price).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3 font-medium">{v.selling_price ? `$${Number(v.selling_price).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3"><StatusBadge active={!!v.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(v)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={() => toggleActive(v.id)} className={`text-xs font-medium ${v.is_active ? "text-red-500" : "text-green-600"}`}>
                      {v.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Variation" : "Add Variation"} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product *</label>
              <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                <select value={form.size} onChange={e => { setForm({ ...form, size: e.target.value }); setNewSize(""); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                  <option value="">Select size</option>
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__new">+ Add new size</option>
                </select>
                {(form.size === "__new" || newSize) && (
                  <input placeholder="Type new size" value={newSize} onChange={e => setNewSize(e.target.value)}
                    className="w-full mt-2 border border-[#f69a39] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <select value={form.color} onChange={e => { setForm({ ...form, color: e.target.value }); setNewColor(""); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                  <option value="">Select color</option>
                  {colors.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__new">+ Add new color</option>
                </select>
                {(form.color === "__new" || newColor) && (
                  <input placeholder="Type new color" value={newColor} onChange={e => setNewColor(e.target.value)}
                    className="w-full mt-2 border border-[#f69a39] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Actual Price ($)</label>
                <input type="number" step="0.01" value={form.actual_price} onChange={e => setForm({ ...form, actual_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Selling Price ($)</label>
                <input type="number" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {loading ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
