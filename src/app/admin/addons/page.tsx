"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";

interface Addon { id: number; name: string; price: number; is_active: boolean; created_at: string; }

export default function AddonsPage() {
  const [rows, setRows] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [form, setForm] = useState({ name: "", price: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const data = await api.get("/addons").catch(() => []);
    setRows((data as Addon[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: "", price: "" }); setError(""); setOpen(true); }
  function openEdit(row: Addon) { setEditing(row); setForm({ name: row.name, price: String(row.price) }); setError(""); setOpen(true); }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      if (editing) await api.put(`/addons/${editing.id}`, form);
      else await api.post("/addons", form);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function toggle(row: Addon) {
    await api.patch(`/addons/${row.id}/toggle`, {}).catch(() => {});
    load();
  }

  async function del(row: Addon) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await api.delete(`/addons/${row.id}`).catch(() => {});
    load();
  }

  return (
    <div>
      <AdminHeader title="Product Addons" action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Addon</button>} />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No addons yet</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Addon Name</th>
                <th className="text-left px-5 py-3">Price</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 last:border-0">
                  <td className="px-5 py-3 font-medium text-[#1e1e21]">{row.name}</td>
                  <td className="px-5 py-3 font-semibold text-[#f69a39]">${Number(row.price).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggle(row)} className="text-xs text-gray-500 hover:text-[#f69a39] px-2 py-1 border border-gray-200 rounded transition-colors">
                        {row.is_active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => openEdit(row)} className="text-xs text-gray-500 hover:text-[#f69a39] px-2 py-1 border border-gray-200 rounded transition-colors">Edit</button>
                      <button onClick={() => del(row)} className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 border border-gray-200 rounded transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <Modal onClose={() => setOpen(false)} title={editing ? "Edit Addon" : "Add Addon"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Addon Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Extra Grip, Bat Cover"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Price ($)</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00"
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
