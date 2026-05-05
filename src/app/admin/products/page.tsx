"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";

interface Product {
  id: number; product_code: string; name: string; description: string;
  category_id: string; brand_id: number; brand_name?: string;
  images: string; sell_price: number; is_active: boolean;
}
interface Brand { id: number; brand_name: string; }
interface Category { id: number; name: string; parent_id: number | null; level: number; }

const INDENT = ["", "└─ ", "  └─ ", "    └─ "];
const EMPTY = { product_code: "", name: "", description: "", category_id: "", brand_id: "" as string | number, sell_price: "" as string | number };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, b, c] = await Promise.all([api.get("/products"), api.get("/brands"), api.get("/categories")]);
      setProducts(p); setBrands(b); setCats(c);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setImageFiles(null); setError(""); setModal(true); }
  function openEdit(p: Product) {
    setEditing(p);
    const catIds = p.category_id ? p.category_id.split(",") : [];
    const childCatId = catIds[catIds.length - 1] || "";
    setForm({ product_code: p.product_code, name: p.name, description: p.description || "", category_id: childCatId, brand_id: p.brand_id || "", sell_price: p.sell_price || "" });
    setImageFiles(null); setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("product_code", String(form.product_code));
      fd.append("name", String(form.name));
      fd.append("description", String(form.description));
      fd.append("category_id", String(form.category_id));
      fd.append("brand_id", String(form.brand_id));
      fd.append("sell_price", String(form.sell_price));
      if (imageFiles) Array.from(imageFiles).forEach(f => fd.append("images", f));
      if (editing) { await api.put(`/products/${editing.id}`, fd); }
      else { await api.post("/products", fd); }
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/products/${id}/toggle`); load(); }

  // Only leaf categories (ones with no children) are selectable; parents auto-fill
  const childCats = cats.filter(c => !cats.some(x => x.parent_id === c.id));

  return (
    <div>
      <AdminHeader
        title="Products"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Product</button>}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Code", "Product Name", "Brand", "Price", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products yet</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.product_code}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.brand_name || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{p.sell_price ? `$${Number(p.sell_price).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3"><StatusBadge active={!!p.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={() => toggleActive(p.id)} className={`text-xs font-medium ${p.is_active ? "text-red-500" : "text-green-600"}`}>
                      {p.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setModal(false)} wide>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Code *</label>
                <input required value={form.product_code} onChange={e => setForm({ ...form, product_code: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category (select child category)</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                  <option value="">Select category</option>
                  {childCats.map(c => (
                    <option key={c.id} value={c.id}>{INDENT[Math.min(c.level, 3)]}{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Parent categories will be auto-added</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                <select value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price ($)</label>
                <input type="number" step="0.01" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Images {editing && "(leave blank to keep current)"}</label>
                <input type="file" multiple accept="image/*" onChange={e => setImageFiles(e.target.files)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#f69a39]/10 file:text-[#f69a39] file:text-xs file:font-medium" />
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
