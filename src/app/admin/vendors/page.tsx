"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { api } from "@/lib/api";

interface Vendor {
  id: number; vendor_name: string; country: string; email: string; notes: string; is_active: boolean;
}
const EMPTY = { vendor_name: "", country: "", email: "", notes: "" };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [newCountry, setNewCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([api.get("/vendors"), api.get("/vendors/countries")]);
      setVendors(v); setCountries(c);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setNewCountry(""); setError(""); setModal(true); }
  function openEdit(v: Vendor) {
    setEditing(v); setForm({ vendor_name: v.vendor_name, country: v.country || "", email: v.email || "", notes: v.notes || "" });
    setNewCountry(""); setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const payload = { ...form, country: newCountry || form.country };
      if (editing) { await api.put(`/vendors/${editing.id}`, payload); }
      else { await api.post("/vendors", payload); }
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/vendors/${id}/toggle`); load(); }

  return (
    <div>
      <AdminHeader
        title="Vendors"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Vendor</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Vendor Name", "Country", "Email", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vendors.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No vendors yet</td></tr>
            ) : vendors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{v.vendor_name}</td>
                <td className="px-4 py-3 text-gray-500">{v.country || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{v.email || "—"}</td>
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
        <Modal title={editing ? "Edit Vendor" : "Add Vendor"} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vendor Name *</label>
              <input required value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
              <select value={form.country} onChange={e => { setForm({ ...form, country: e.target.value }); setNewCountry(""); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                <option value="">Select country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new">+ Add new country</option>
              </select>
              {(form.country === "__new" || newCountry) && (
                <input placeholder="Type new country name" value={newCountry} onChange={e => setNewCountry(e.target.value)}
                  className="w-full mt-2 border border-[#f69a39] rounded-lg px-3 py-2 text-sm focus:outline-none" />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
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
