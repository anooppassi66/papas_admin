"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";

interface Category {
  id: number; name: string; parent_id: number | null; parent_name?: string;
  level: number; slug: string; is_active: boolean;
}

const EMPTY = { name: "", parent_id: "" as string | number, slug: "" };
const INDENT = ["", "└─ ", "  └─ ", "    └─ "];

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setCats(await api.get("/categories")); } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setModal(true); }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, parent_id: c.parent_id ?? "", slug: c.slug });
    setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = { name: form.name, parent_id: form.parent_id || null, slug: form.slug };
      if (editing) { await api.put(`/categories/${editing.id}`, payload); }
      else { await api.post("/categories", payload); }
      setModal(false); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/categories/${id}/toggle`); load(); }

  return (
    <div>
      <AdminHeader
        title="Categories"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Category</button>}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>
              {["Category Name", "Slug", "Level", "Parent", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cats.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No categories yet</td></tr>
            ) : cats.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <span className="text-gray-300">{INDENT[Math.min(c.level, 3)]}</span>{c.name}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                    L{c.level}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.parent_name || "—"}</td>
                <td className="px-4 py-3"><StatusBadge active={!!c.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={() => toggleActive(c.id)} className={`text-xs font-medium ${c.is_active ? "text-red-500" : "text-green-600"}`}>
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category Name *</label>
              <input required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Parent Category (blank = top level)</label>
              <select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">None (Top-level)</option>
                {cats.filter(c => c.id !== editing?.id).map(c => (
                  <option key={c.id} value={c.id}>{INDENT[Math.min(c.level, 3)]}{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Slug *</label>
              <input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#f69a39]" />
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
