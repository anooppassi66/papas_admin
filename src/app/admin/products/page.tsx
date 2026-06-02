"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { api, UPLOADS } from "@/lib/api";

interface Product {
  id: number; product_code: string; name: string; description: string;
  category_id: string; brand_id: number; brand_name?: string;
  images: string; sell_price: number; is_active: boolean;
}
interface Brand { id: number; brand_name: string; }
interface Category { id: number; name: string; parent_id: number | null; level: number; }
interface Offering { id: number; category_id: number; category_name: string; name: string; price: number; }
interface Addon { id: number; name: string; price: number; }

const INDENT = ["", "└─ ", "  └─ ", "    └─ "];
const EMPTY = { product_code: "", name: "", description: "", brand_id: "" as string | number, sell_price: "" as string | number };

function buildCategoryIds(selectedIds: number[], catMap: Map<number, Category>): string {
  const all = new Set<number>();
  for (const id of selectedIds) {
    all.add(id);
    let current = catMap.get(id);
    while (current?.parent_id) {
      all.add(current.parent_id);
      current = catMap.get(current.parent_id);
    }
  }
  return Array.from(all).sort((a, b) => a - b).join(",");
}

// ── Services & Addons assignment modal ──────────────────────────────────────
function ServicesAddonsModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [allOfferings, setAllOfferings] = useState<Offering[]>([]);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [selOfferings, setSelOfferings] = useState<Set<number>>(new Set());
  const [selAddons, setSelAddons] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"services" | "addons">("services");

  useEffect(() => {
    Promise.all([
      api.get("/service-offerings").catch(() => []),
      api.get("/addons").catch(() => []),
      api.get(`/products/${product.id}/services`).catch(() => []),
      api.get(`/products/${product.id}/addons`).catch(() => []),
    ]).then(([off, add, assignedOff, assignedAdd]) => {
      setAllOfferings((off as Offering[]) || []);
      setAllAddons((add as Addon[]) || []);
      setSelOfferings(new Set(((assignedOff as Offering[]) || []).map(o => o.id)));
      setSelAddons(new Set(((assignedAdd as Addon[]) || []).map(a => a.id)));
    });
  }, [product.id]);

  async function save() {
    setSaving(true);
    try {
      await Promise.all([
        api.put(`/products/${product.id}/services`, { offering_ids: Array.from(selOfferings) }),
        api.put(`/products/${product.id}/addons`, { addon_ids: Array.from(selAddons) }),
      ]);
      onClose();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  // Group offerings by category
  const grouped = allOfferings.reduce<Record<string, Offering[]>>((acc, o) => {
    const key = o.category_name || "Uncategorised";
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  return (
    <Modal title={`Services & Addons — ${product.name}`} onClose={onClose} wide>
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {(["services", "addons"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? "bg-white text-[#1e1e21] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t} {t === "services" ? `(${selOfferings.size})` : `(${selAddons.size})`}
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="space-y-4">
          {allOfferings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No services created yet. Go to <strong>Service Offerings</strong> to add some.</p>
          ) : Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
              <div className="space-y-1">
                {items.map(o => (
                  <label key={o.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${selOfferings.has(o.id) ? "border-[#f69a39] bg-[#fff8f0]" : "border-gray-100 hover:border-gray-200 bg-white"}`}>
                    <input type="checkbox" checked={selOfferings.has(o.id)}
                      onChange={() => {
                        const s = new Set(selOfferings);
                        s.has(o.id) ? s.delete(o.id) : s.add(o.id);
                        setSelOfferings(s);
                      }} className="accent-[#f69a39]" />
                    <span className="flex-1 text-sm font-medium text-[#1e1e21]">{o.name}</span>
                    <span className="text-sm font-semibold text-[#f69a39]">${Number(o.price).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "addons" && (
        <div className="space-y-1">
          {allAddons.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No addons created yet. Go to <strong>Product Addons</strong> to add some.</p>
          ) : allAddons.map(a => (
            <label key={a.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${selAddons.has(a.id) ? "border-[#f69a39] bg-[#fff8f0]" : "border-gray-100 hover:border-gray-200 bg-white"}`}>
              <input type="checkbox" checked={selAddons.has(a.id)}
                onChange={() => {
                  const s = new Set(selAddons);
                  s.has(a.id) ? s.delete(a.id) : s.add(a.id);
                  setSelAddons(s);
                }} className="accent-[#f69a39]" />
              <span className="flex-1 text-sm font-medium text-[#1e1e21]">{a.name}</span>
              <span className="text-sm font-semibold text-[#f69a39]">${Number(a.price).toFixed(2)}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2 bg-[#f69a39] text-white text-sm font-semibold rounded-lg hover:bg-[#e8880d] disabled:opacity-60">
          {saving ? "Saving…" : "Save Assignments"}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saModal, setSaModal] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // paths already in DB
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);    // newly picked files
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, b, c] = await Promise.all([api.get("/products"), api.get("/brands"), api.get("/categories")]);
      setProducts(p); setBrands(b); setCats(c);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const catMap = new Map(cats.map(c => [c.id, c]));

  function resetImageState() {
    setExistingImages([]); setNewImageFiles([]); setNewImagePreviews([]);
  }
  function openAdd() {
    setEditing(null); setForm(EMPTY); setSelectedCatIds([]); resetImageState(); setError(""); setModal(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    const catIds = p.category_id ? p.category_id.split(",").map(Number).filter(Boolean) : [];
    setSelectedCatIds(catIds);
    setForm({ product_code: p.product_code, name: p.name, description: p.description || "", brand_id: p.brand_id || "", sell_price: p.sell_price || "" });
    setExistingImages(p.images ? p.images.split(",").filter(Boolean) : []);
    setNewImageFiles([]); setNewImagePreviews([]);
    setError(""); setModal(true);
  }

  function addNewFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setNewImageFiles(prev => [...prev, ...arr]);
    arr.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setNewImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeExisting(idx: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  }

  function removeNew(idx: number) {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleCat(id: number) {
    setSelectedCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const categoryIdStr = buildCategoryIds(selectedCatIds, catMap);
      const fd = new FormData();
      fd.append("product_code", String(form.product_code));
      fd.append("name", String(form.name));
      fd.append("description", String(form.description));
      fd.append("category_id", categoryIdStr);
      fd.append("brand_id", String(form.brand_id));
      fd.append("sell_price", String(form.sell_price));
      if (editing) {
        fd.append("existing_images", JSON.stringify(existingImages));
      }
      newImageFiles.forEach(f => fd.append("images", f));
      if (editing) { await api.put(`/products/${editing.id}`, fd); }
      else { await api.post("/products", fd); }
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/products/${id}/toggle`); load(); }

  function isAncestorOfSelected(id: number): boolean {
    return selectedCatIds.some(selId => {
      if (selId === id) return false;
      let c = catMap.get(selId);
      while (c?.parent_id) {
        if (c.parent_id === id) return true;
        c = catMap.get(c.parent_id);
      }
      return false;
    });
  }

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
                    <button onClick={() => setSaModal(p)} className="text-purple-500 hover:text-purple-700 text-xs font-medium">Services & Addons</button>
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">
                  Categories
                  {selectedCatIds.length > 0 && <span className="ml-2 text-[#f69a39] font-semibold">{selectedCatIds.length} selected</span>}
                </label>
                {selectedCatIds.length > 0 && (
                  <button type="button" onClick={() => setSelectedCatIds([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-[200px] divide-y divide-gray-50">
                {cats.length === 0 ? (
                  <p className="text-xs text-gray-400 p-3">No categories found</p>
                ) : cats.map(c => {
                  const isSelected = selectedCatIds.includes(c.id);
                  const isAuto = isSelected && isAncestorOfSelected(c.id);
                  return (
                    <label key={c.id} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${isSelected ? "bg-[#fff8f0]" : "hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleCat(c.id)} className="accent-[#f69a39] w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-sm flex-1">
                        <span className="text-gray-300 text-xs">{INDENT[Math.min(c.level, 3)]}</span>
                        <span className={isSelected ? "text-[#1e1e21] font-medium" : "text-gray-600"}>{c.name}</span>
                        {isAuto && <span className="ml-1.5 text-[10px] text-[#f69a39] font-medium">(auto)</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1">Parent categories are included automatically on save.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                <SearchableSelect
                  value={String(form.brand_id)}
                  onChange={v => setForm({ ...form, brand_id: v })}
                  placeholder="Select brand"
                  options={[{ value: "", label: "— No brand —" }, ...brands.map(b => ({ value: String(b.id), label: b.brand_name }))]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price ($)</label>
                <input type="number" step="0.01" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>

            {/* Image manager */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Images
                <span className="ml-2 text-[10px] text-gray-400 font-normal normal-case">
                  {existingImages.length + newImageFiles.length} total
                </span>
              </label>

              {/* Existing images grid */}
              {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                      <Image
                        src={img.startsWith("/uploads") ? `${UPLOADS}${img}` : img}
                        alt={`Image ${idx + 1}`}
                        fill className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExisting(idx)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] text-white/80 bg-black/40">saved</span>
                    </div>
                  ))}
                  {newImagePreviews.map((src, idx) => (
                    <div key={`new-${idx}`} className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-dashed border-[#f69a39]/50 bg-gray-50 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNew(idx)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] text-[#f69a39] bg-black/40">new</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label className="flex items-center gap-2 w-fit cursor-pointer px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#f69a39] hover:text-[#f69a39] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add images
                <input type="file" multiple accept="image/*" className="hidden"
                  onChange={e => addNewFiles(e.target.files)} />
              </label>
              <p className="text-[10px] text-gray-400 mt-1">Hover an image and click the trash icon to remove it.</p>
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

      {saModal && <ServicesAddonsModal product={saModal} onClose={() => setSaModal(null)} />}
    </div>
  );
}
