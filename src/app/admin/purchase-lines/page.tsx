"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { api } from "@/lib/api";

interface PurchaseLine {
  id: number; invoice_no?: string; invoice_id: number; item_date: string;
  vendor_name?: string; product_name?: string; sku?: string; description: string;
  qty_purchased: number; unit: string; base_unit_cost: number; line_total: number;
  landed_unit_cost: number; recommended_sell_price: number; category_name?: string;
}
interface Invoice { id: number; invoice_no: string; goods_total: number; charge_for_allocation: number; }
interface Variant { id: number; product_name?: string; sku?: string; size?: string; color?: string; }
interface Vendor { id: number; vendor_name: string; }

const EMPTY = {
  invoice_id: "" as string | number, item_date: "", vendor_id: "" as string | number,
  product_variant_id: "" as string | number, description: "",
  qty_purchased: "" as string | number, unit: "pcs", base_unit_cost: "" as string | number,
};

export default function PurchaseLinesPage() {
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<PurchaseLine | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [calculated, setCalculated] = useState({ line_total: 0, landed_unit_cost: 0, recommended_sell_price: 0, category_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const qty = parseFloat(String(form.qty_purchased)) || 0;
  const base = parseFloat(String(form.base_unit_cost)) || 0;
  const lineTotal = qty * base;

  const load = useCallback(async () => {
    try {
      const [l, inv, v, ven] = await Promise.all([
        api.get("/purchase-lines"),
        api.get("/invoices"),
        api.get("/product-variants"),
        api.get("/vendors"),
      ]);
      setLines(l); setInvoices(inv); setVariants(v); setVendors(ven);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setCalculated({ line_total: 0, landed_unit_cost: 0, recommended_sell_price: 0, category_name: "" }); setError(""); setModal(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const result = editing
        ? await api.put(`/purchase-lines/${editing.id}`, form)
        : await api.post("/purchase-lines", form);
      setCalculated({
        line_total: result.line_total || lineTotal,
        landed_unit_cost: result.landed_unit_cost || 0,
        recommended_sell_price: result.recommended_sell_price || 0,
        category_name: result.category_name || "",
      });
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function deleteLine(id: number) {
    if (!confirm("Delete this line?")) return;
    await api.delete(`/purchase-lines/${id}`); load();
  }

  const selectedInvoice = invoices.find(i => String(i.id) === String(form.invoice_id));
  const goodsTotal = selectedInvoice?.goods_total || 0;
  const allocCharges = selectedInvoice?.charge_for_allocation || 0;
  const allocated = goodsTotal > 0 ? (lineTotal / goodsTotal) * allocCharges : 0;
  const landedUnit = qty > 0 ? (lineTotal + allocated) / qty : 0;

  return (
    <div>
      <AdminHeader
        title="Purchase Lines"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Line</button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1e1e21] text-white">
              <tr>{["Invoice", "Product/SKU", "Vendor", "Date", "Qty", "Base Cost", "Line Total", "Landed Unit", "Rec. Sell Price", "Category", "Actions"].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400">No purchase lines yet</td></tr>
              ) : lines.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs">{l.invoice_no || "—"}</td>
                  <td className="px-3 py-2"><div className="font-medium text-xs">{l.product_name || "—"}</div><div className="text-gray-400 text-xs">{l.sku}</div></td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{l.vendor_name || "—"}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{l.item_date ? new Date(l.item_date).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 text-xs">{l.qty_purchased} {l.unit}</td>
                  <td className="px-3 py-2 text-xs">${Number(l.base_unit_cost).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs">${Number(l.line_total).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs font-medium">${Number(l.landed_unit_cost).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs font-medium text-[#f69a39]">${Number(l.recommended_sell_price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{l.category_name || "—"}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => deleteLine(l.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Add Purchase Line" onClose={() => setModal(false)} wide>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Invoice *</label>
                <SearchableSelect
                  required
                  value={form.invoice_id}
                  onChange={v => setForm({ ...form, invoice_id: v })}
                  placeholder="Select invoice"
                  options={[{ value: "", label: "— Select invoice —" }, ...invoices.map(i => ({ value: String(i.id), label: `${i.invoice_no} (Goods: $${Number(i.goods_total).toFixed(2)})` }))]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Variation *</label>
                <SearchableSelect
                  required
                  value={form.product_variant_id}
                  onChange={v => setForm({ ...form, product_variant_id: v })}
                  placeholder="Select variant"
                  options={[{ value: "", label: "— Select variant —" }, ...variants.map(v => ({ value: String(v.id), label: `${v.product_name} — ${v.size} ${v.color} (${v.sku})` }))]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Item Date</label>
                <input type="date" value={form.item_date} onChange={e => setForm({ ...form, item_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Qty Purchased</label>
                <input type="number" value={form.qty_purchased} onChange={e => setForm({ ...form, qty_purchased: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Base Unit Cost (USD)</label>
                <input type="number" step="0.01" value={form.base_unit_cost} onChange={e => setForm({ ...form, base_unit_cost: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>
            {/* Auto-calculated preview */}
            <div className="grid grid-cols-3 gap-3 bg-[#f69a39]/5 border border-[#f69a39]/20 rounded-lg p-3 text-sm">
              <div><div className="text-xs text-gray-500">Line Total (USD)</div><div className="font-semibold">${lineTotal.toFixed(2)}</div><div className="text-xs text-gray-400">{qty} × ${base.toFixed(2)}</div></div>
              <div><div className="text-xs text-gray-500">Landed Unit Cost</div><div className="font-semibold">${landedUnit.toFixed(2)}</div><div className="text-xs text-gray-400">auto-calculated</div></div>
              <div><div className="text-xs text-gray-500">Rec. Sell Price</div><div className="font-bold text-[#f69a39]">auto on save</div><div className="text-xs text-gray-400">+ margin %</div></div>
            </div>
            <p className="text-xs text-gray-400">Saving will auto-update <strong>actual_price</strong> and <strong>selling_price</strong> on the product variation.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {loading ? "Saving…" : "Save Line"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
