"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";

interface ServiceCategory { id: number; name: string; created_at: string; }

export default function ServiceCategoriesPage() {
  const [rows, setRows] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const data = await api.get("/service-categories").catch(() => []);
    setRows((data as ServiceCategory[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setName(""); setError(""); setOpen(true); }
  function openEdit(row: ServiceCategory) { setEditing(row); setName(row.name); setError(""); setOpen(true); }

  async function save() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      if (editing) await api.put(`/service-categories/${editing.id}`, { name });
      else await api.post("/service-categories", { name });
      setOpen(false);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function del(row: ServiceCategory) {
    if (!confirm(`Delete "${row.name}"? Any services under this category will lose their category.`)) return;
    await api.delete(`/service-categories/${row.id}`).catch(() => {});
    load();
  }

  return (
    <div>
      <AdminHeader title="Service Categories" action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Category</button>} />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          No service categories yet
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-[#1e1e21]">{row.name}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(row)} className="text-xs text-gray-500 hover:text-[#f69a39] transition-colors px-2 py-1 border border-gray-200 rounded">Edit</button>
                      <button onClick={() => del(row)} className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 border border-gray-200 rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <Modal onClose={() => setOpen(false)} title={editing ? "Edit Category" : "Add Category"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Category Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Knocking Service"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="px-5 py-2 bg-[#f69a39] text-white text-sm font-semibold rounded-lg hover:bg-[#e8880d] disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
