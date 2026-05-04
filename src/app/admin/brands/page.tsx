"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api, UPLOADS } from "@/lib/api";

interface Brand {
  id: number; brand_name: string; brand_description: string;
  brand_image: string; is_active: boolean;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ brand_name: "", brand_description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setBrands(await api.get("/brands")); } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm({ brand_name: "", brand_description: "" }); setImageFile(null); setError(""); setModal(true); }
  function openEdit(b: Brand) {
    setEditing(b); setForm({ brand_name: b.brand_name, brand_description: b.brand_description || "" });
    setImageFile(null); setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("brand_name", form.brand_name);
      fd.append("brand_description", form.brand_description);
      if (imageFile) fd.append("brand_image", imageFile);
      if (editing) { await api.put(`/brands/${editing.id}`, fd); }
      else { await api.post("/brands", fd); }
      setModal(false); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/brands/${id}/toggle`); load(); }

  return (
    <div>
      <AdminHeader
        title="Brands"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Brand</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map(b => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
            {b.brand_image && (
              <div className="w-full h-28 relative rounded-lg overflow-hidden bg-gray-50">
                <Image src={`${UPLOADS}${b.brand_image}`} alt={b.brand_name} fill className="object-contain p-2" />
              </div>
            )}
            <div>
              <div className="font-semibold text-sm">{b.brand_name}</div>
              {b.brand_description && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{b.brand_description}</div>}
            </div>
            <div className="flex items-center justify-between mt-auto">
              <StatusBadge active={!!b.is_active} />
              <div className="flex gap-2">
                <button onClick={() => openEdit(b)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                <button onClick={() => toggleActive(b.id)} className={`text-xs font-medium ${b.is_active ? "text-red-500" : "text-green-600"}`}>
                  {b.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {brands.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">No brands yet</div>
      )}

      {modal && (
        <Modal title={editing ? "Edit Brand" : "Add Brand"} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Brand Name *</label>
              <input required value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea value={form.brand_description} onChange={e => setForm({ ...form, brand_description: e.target.value })} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Brand Image {editing && "(leave blank to keep current)"}</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#f69a39]/10 file:text-[#f69a39] file:text-xs file:font-medium" />
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
