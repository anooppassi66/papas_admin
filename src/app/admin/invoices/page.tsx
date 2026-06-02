"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { api } from "@/lib/api";

interface Invoice {
  id: number; invoice_no: string; vendor_name?: string; vendor_id: number;
  country_name: string; invoice_date: string; delivery_note: string; our_order: string;
  goods_total: number; shipping: number; custom_duty: number; custom_status: string;
  labor: number; other_landing_charges: number; charge_for_allocation: number;
  vat: number; invoice_total: number; created_at: string;
}
interface Vendor { id: number; vendor_name: string; }

const EMPTY = {
  invoice_no: "", vendor_id: "" as string | number, country_name: "", invoice_date: "",
  delivery_note: "", our_order: "", goods_total: "" as string | number,
  shipping: "" as string | number, custom_duty: "" as string | number, custom_status: "Pending",
  labor: "" as string | number, other_landing_charges: "" as string | number,
};

function calcAllocation(f: typeof EMPTY) {
  return (parseFloat(String(f.shipping)) || 0) + (parseFloat(String(f.custom_duty)) || 0) +
    (parseFloat(String(f.labor)) || 0) + (parseFloat(String(f.other_landing_charges)) || 0);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [vat, setVat] = useState<string | number>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const alloc = calcAllocation(form);
  const goodsTotal = parseFloat(String(form.goods_total)) || 0;
  const vatAmt = parseFloat(String(vat)) || 0;
  const invoiceTotal = goodsTotal + alloc + vatAmt;

  const load = useCallback(async () => {
    try {
      const [inv, v] = await Promise.all([api.get("/invoices"), api.get("/vendors")]);
      setInvoices(inv); setVendors(v);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setVat(""); setError(""); setModal(true); }
  function openEdit(i: Invoice) {
    setEditing(i);
    setForm({ invoice_no: i.invoice_no, vendor_id: i.vendor_id, country_name: i.country_name, invoice_date: i.invoice_date?.split("T")[0] || "", delivery_note: i.delivery_note || "", our_order: i.our_order || "", goods_total: i.goods_total, shipping: i.shipping, custom_duty: i.custom_duty, custom_status: i.custom_status, labor: i.labor, other_landing_charges: i.other_landing_charges });
    setVat(i.vat); setError(""); setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const payload = { ...form, charge_for_allocation: alloc, vat: vatAmt, invoice_total: invoiceTotal };
      if (editing) { await api.put(`/invoices/${editing.id}`, payload); }
      else { await api.post("/invoices", payload); }
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  const field = (label: string, key: keyof typeof EMPTY, type = "number") => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} step={type === "number" ? "0.01" : undefined}
        value={String(form[key])}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
    </div>
  );

  return (
    <div>
      <AdminHeader
        title="Invoices"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Invoice</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Invoice No", "Vendor", "Country", "Date", "Goods Total", "Invoice Total", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">No invoices yet</td></tr>
            ) : invoices.map(i => (
              <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{i.invoice_no}</td>
                <td className="px-4 py-3">{i.vendor_name || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{i.country_name || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{i.invoice_date ? new Date(i.invoice_date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">${Number(i.goods_total).toFixed(2)}</td>
                <td className="px-4 py-3 font-medium">${Number(i.invoice_total).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${i.custom_status === "Entered" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {i.custom_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(i)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Invoice" : "Add Invoice"} onClose={() => setModal(false)} wide>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              {field("Invoice No", "invoice_no", "text")}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vendor</label>
                <SearchableSelect
                  value={form.vendor_id}
                  onChange={v => setForm({ ...form, vendor_id: v })}
                  placeholder="Select vendor"
                  options={[{ value: "", label: "— Select vendor —" }, ...vendors.map(v => ({ value: String(v.id), label: v.vendor_name }))]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Origin Country", "country_name", "text")}
              {field("Invoice Date", "invoice_date", "date")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Delivery Note", "delivery_note", "text")}
              {field("Our Order No", "our_order", "text")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Goods Total (USD)", "goods_total")}
              {field("Shipping (USD)", "shipping")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Custom Duty (USD)", "custom_duty")}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Custom Status</label>
                <select value={form.custom_status} onChange={e => setForm({ ...form, custom_status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]">
                  <option>Pending</option>
                  <option>Entered</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("Labor / Handling (USD)", "labor")}
              {field("Other Landing Charges (USD)", "other_landing_charges")}
            </div>
            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg text-sm">
              <div>
                <div className="text-xs text-gray-500">Allocation Charges</div>
                <div className="font-semibold">${alloc.toFixed(2)}</div>
                <div className="text-xs text-gray-400">(shipping + duty + labor + other)</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">VAT (USD)</div>
                <input type="number" step="0.01" value={String(vat)} onChange={e => setVat(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Invoice Total</div>
                <div className="font-bold text-[#f69a39] text-lg">${invoiceTotal.toFixed(2)}</div>
                <div className="text-xs text-gray-400">(goods + allocation + vat)</div>
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
