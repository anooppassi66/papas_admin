"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";

interface Store {
  id: number; name: string; priority: number; parent_store_id: number;
  parent_name?: string; type: string; address: string; phone: string;
  email: string; is_active: boolean; created_at: string;
}

const EMPTY = { name: "", priority: 0, parent_store_id: 0, type: "retail", address: "", phone: "", email: "", password: "" };

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState<typeof EMPTY & { id?: number }>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setStores(await api.get("/stores")); } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setModal(true); }
  function openEdit(s: Store) {
    setEditing(s);
    setForm({ name: s.name, priority: s.priority, parent_store_id: s.parent_store_id, type: s.type, address: s.address, phone: s.phone, email: s.email, password: "" });
    setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (editing) { await api.put(`/stores/${editing.id}`, form); }
      else { await api.post("/stores", form); }
      setModal(false); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  }

  async function toggleActive(id: number) {
    await api.patch(`/stores/${id}/toggle`); load();
  }

  const parentStores = stores.filter(s => s.parent_store_id === 0 || s.parent_store_id === null);

  return (
    <div>
      <AdminHeader
        title="Stores"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Store</button>}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>
              {["Store Name", "Priority", "Parent Store", "Email", "Phone", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stores.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No stores yet</td></tr>
            ) : stores.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.priority}</td>
                <td className="px-4 py-3 text-gray-500">{s.parent_name || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{s.email}</td>
                <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
                <td className="px-4 py-3"><StatusBadge active={!!s.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={() => toggleActive(s.id)} className={`text-xs font-medium ${s.is_active ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}>
                      {s.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Store" : "Add Store"} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Store Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Parent Store (0 = top-level)</label>
              <select value={form.parent_store_id} onChange={e => setForm({ ...form, parent_store_id: parseInt(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value={0}>None (Top-level Store)</option>
                {parentStores.filter(s => s.id !== editing?.id).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Password {editing ? "(leave blank to keep)" : "*"}</label>
                <input type="password" required={!editing} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                {loading ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
