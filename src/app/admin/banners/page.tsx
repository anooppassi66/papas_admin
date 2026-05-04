"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api, UPLOADS } from "@/lib/api";

interface Banner {
  id: number; title: string; image: string; link: string; sort_order: number; is_active: boolean;
}
const EMPTY = { title: "", link: "", sort_order: 0 };

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setBanners(await api.get("/banners")); } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setImageFile(null); setError(""); setModal(true); }
  function openEdit(b: Banner) {
    setEditing(b); setForm({ title: b.title || "", link: b.link || "", sort_order: b.sort_order });
    setImageFile(null); setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("link", form.link);
      fd.append("sort_order", String(form.sort_order));
      if (imageFile) fd.append("image", imageFile);
      if (editing) { await api.put(`/banners/${editing.id}`, fd); }
      else { await api.post("/banners", fd); }
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/banners/${id}/toggle`); load(); }
  async function deleteBanner(id: number) {
    if (!confirm("Delete this banner?")) return;
    await api.delete(`/banners/${id}`); load();
  }

  return (
    <div>
      <AdminHeader
        title="Homepage Banners"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Banner</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map(b => (
          <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative w-full h-40 bg-gray-100">
              {b.image ? (
                <Image src={`${UPLOADS}${b.image}`} alt={b.title || "Banner"} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🖼</div>
              )}
              <div className="absolute top-2 left-2">
                <span className="bg-[#1e1e21] text-white text-xs px-2 py-0.5 rounded-full">#{b.sort_order}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="font-medium text-sm mb-1">{b.title || <span className="text-gray-400">No title</span>}</div>
              {b.link && <div className="text-xs text-blue-500 truncate mb-2">{b.link}</div>}
              <div className="flex items-center justify-between">
                <StatusBadge active={!!b.is_active} />
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                  <button onClick={() => toggleActive(b.id)} className={`text-xs font-medium ${b.is_active ? "text-orange-500" : "text-green-600"}`}>
                    {b.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => deleteBanner(b.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">No banners yet. Add your first homepage banner.</div>
      )}

      {modal && (
        <Modal title={editing ? "Edit Banner" : "Add Banner"} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Banner Image {!editing && "*"}</label>
              <input type="file" accept="image/*" required={!editing} onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#f69a39]/10 file:text-[#f69a39] file:text-xs file:font-medium" />
              {editing && <p className="text-xs text-gray-400 mt-1">Leave blank to keep current image</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Link URL</label>
              <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]"
                placeholder="/cricket/bats" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {loading ? "Saving…" : editing ? "Update" : "Upload & Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
