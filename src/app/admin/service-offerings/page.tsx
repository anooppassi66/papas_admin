"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import SearchableSelect from "@/components/admin/SearchableSelect";

interface Category { id: number; name: string; }
interface Offering { id: number; category_id: number; category_name: string; name: string; price: number; is_active: boolean; }

export default function ServiceOfferingsPage() {
  const [rows, setRows] = useState<Offering[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [form, setForm] = useState({ category_id: "", name: "", price: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [data, cats] = await Promise.all([
      api.get("/service-offerings").catch(() => []),
      api.get("/service-categories").catch(() => []),
    ]);
    setRows((data as Offering[]) || []);
    setCategories((cats as Category[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ category_id: "", name: "", price: "" }); setError(""); setOpen(true); }
  function openEdit(row: Offering) {
    setEditing(row);
    setForm({ category_id: String(row.category_id || ""), name: row.name, price: String(row.price) });
    setError(""); setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = { category_id: form.category_id || null, name: form.name, price: form.price };
      if (editing) await api.put(`/service-offerings/${editing.id}`, payload);
      else await api.post("/service-offerings", payload);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function toggle(row: Offering) {
    await api.patch(`/service-offerings/${row.id}/toggle`, {}).catch(() => {});
    load();
  }

  async function del(row: Offering) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await api.delete(`/service-offerings/${row.id}`).catch(() => {});
    load();
  }

  // Group by category for display
  const grouped = rows.reduce<Record<string, Offering[]>>((acc, r) => {
    const key = r.category_name || "Uncategorised";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div>
      <AdminHeader title="Services" action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Service</button>} />

      {categories.length === 0 && !loading && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
          <i className="fa-solid fa-triangle-exclamation mr-2" />
          Create a <strong>Service Category</strong> first before adding services.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No services yet</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {items.map(row => (
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
          ))}
        </div>
      )}

      {open && <Modal onClose={() => setOpen(false)} title={editing ? "Edit Service" : "Add Service"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Service Category</label>
            <SearchableSelect
              value={form.category_id}
              onChange={v => setForm(f => ({ ...f, category_id: v }))}
              placeholder="— No category —"
              options={[{ value: "", label: "— No category —" }, ...categories.map(c => ({ value: String(c.id), label: c.name }))]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Service Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Machine Knocking"
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
