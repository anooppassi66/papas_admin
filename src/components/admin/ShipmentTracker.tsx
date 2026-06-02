"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Checkpoint {
  message?: string;
  status_state?: string;
  occurred_at?: string;
  location?: string;
  description?: string;
}

interface Shipment {
  order_no: string;
  easyship_shipment_id: string;
  tracking_number: string;
  courier_name: string;
  tracking_page_url: string;
  tracking_state: string;
  tracking_state_label: string;
  estimated_delivery: string | null;
  checkpoints: Checkpoint[];
  last_synced: string | null;
}

const STATE_COLOR: Record<string, string> = {
  created:            "bg-gray-100 text-gray-600",
  pending:            "bg-gray-100 text-gray-600",
  label_generated:    "bg-blue-100 text-blue-700",
  picked_up:          "bg-blue-100 text-blue-700",
  in_transit:         "bg-indigo-100 text-indigo-700",
  out_for_delivery:   "bg-purple-100 text-purple-700",
  delivery_attempted: "bg-orange-100 text-orange-700",
  delivered:          "bg-green-100 text-green-700",
  returning:          "bg-yellow-100 text-yellow-700",
  returned:           "bg-yellow-100 text-yellow-700",
  failed_pickup:      "bg-red-100 text-red-600",
  lost:               "bg-red-100 text-red-600",
  damaged:            "bg-red-100 text-red-600",
};

const PROGRESS_STATES = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"];

function progressIndex(state: string) {
  const idx = PROGRESS_STATES.indexOf(state);
  return idx === -1 ? (state === "delivered" ? 4 : 1) : idx;
}

interface Props { orderNo: string; }

export default function ShipmentTracker({ orderNo }: Props) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ easyship_shipment_id: "", tracking_number: "", courier_name: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.get(`/shipments/${orderNo}`).catch(() => null);
      setShipment(data as Shipment | null);
      if (data) {
        const s = data as Shipment;
        setForm({ easyship_shipment_id: s.easyship_shipment_id || "", tracking_number: s.tracking_number || "", courier_name: s.courier_name || "" });
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [orderNo]);

  async function save() {
    if (!form.easyship_shipment_id.trim()) { setError("Easyship Shipment ID is required"); return; }
    setSaving(true); setError("");
    try {
      await api.post(`/shipments/${orderNo}`, form);
      await load();
      setShowForm(false);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function refresh() {
    setRefreshing(true); setError("");
    try {
      const data = await api.post(`/shipments/${orderNo}/refresh`, {});
      setShipment(data as Shipment);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Could not fetch tracking from Easyship"); }
    finally { setRefreshing(false); }
  }

  if (loading) return <div className="text-xs text-gray-400 py-2">Loading shipment…</div>;

  const prog = shipment ? progressIndex(shipment.tracking_state) : -1;

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-[#f69a39] uppercase tracking-wide flex items-center gap-1.5">
          <i className="fa-solid fa-truck" /> Easyship Tracking
        </p>
        <div className="flex gap-2">
          {shipment?.easyship_shipment_id && (
            <button onClick={refresh} disabled={refreshing}
              className="text-[11px] px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-[#f69a39] hover:text-[#f69a39] transition-colors disabled:opacity-50">
              {refreshing ? <><i className="fa-solid fa-spinner fa-spin mr-1" />Refreshing…</> : <><i className="fa-solid fa-rotate mr-1" />Refresh Status</>}
            </button>
          )}
          <button onClick={() => setShowForm(v => !v)}
            className="text-[11px] px-3 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-[#f69a39] hover:text-[#f69a39] transition-colors">
            <i className={`fa-solid ${showForm ? "fa-chevron-up" : "fa-pen"} mr-1`} />
            {shipment ? "Edit" : "Add Tracking"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-2"><i className="fa-solid fa-circle-exclamation mr-1" />{error}</p>}

      {/* Input form */}
      {(showForm || !shipment) && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Easyship Shipment ID *</label>
            <input value={form.easyship_shipment_id} onChange={e => setForm(f => ({ ...f, easyship_shipment_id: e.target.value }))}
              placeholder="e.g. ESAU1234567890"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#f69a39] font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Tracking Number</label>
              <input value={form.tracking_number} onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
                placeholder="Courier tracking no."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#f69a39] font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Courier</label>
              <input value={form.courier_name} onChange={e => setForm(f => ({ ...f, courier_name: e.target.value }))}
                placeholder="e.g. DHL Express"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#f69a39]" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 bg-[#f69a39] text-white text-xs font-semibold rounded-lg hover:bg-[#e8880d] disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
            {shipment && <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>}
          </div>
        </div>
      )}

      {/* Tracking display */}
      {shipment?.easyship_shipment_id && !showForm && (
        <div className="space-y-3">
          {/* Header info */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Shipment ID:</span>
              <span className="font-mono text-[#1e1e21] font-semibold">{shipment.easyship_shipment_id}</span>
            </div>
            {shipment.courier_name && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Courier:</span>
                <span className="font-semibold text-[#1e1e21]">{shipment.courier_name}</span>
              </div>
            )}
            {shipment.tracking_number && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Tracking:</span>
                <span className="font-mono text-[#1e1e21]">{shipment.tracking_number}</span>
              </div>
            )}
          </div>

          {/* Status badge */}
          {shipment.tracking_state && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_COLOR[shipment.tracking_state] || "bg-gray-100 text-gray-600"}`}>
                {shipment.tracking_state_label || shipment.tracking_state}
              </span>
              {shipment.estimated_delivery && (
                <span className="text-xs text-gray-500">
                  <i className="fa-regular fa-calendar mr-1" />
                  Est. delivery: {new Date(shipment.estimated_delivery).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              {shipment.last_synced && (
                <span className="text-[10px] text-gray-400">
                  Updated {new Date(shipment.last_synced).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          )}

          {/* Progress bar */}
          {prog >= 0 && (
            <div className="flex items-center gap-0">
              {["Created", "Picked Up", "In Transit", "Out for Delivery", "Delivered"].map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${i <= prog ? "bg-[#f69a39] border-[#f69a39] text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                      {i < prog ? <i className="fa-solid fa-check" /> : i + 1}
                    </div>
                    <span className={`text-[9px] mt-1 text-center leading-tight ${i <= prog ? "text-[#f69a39] font-semibold" : "text-gray-400"}`}>{label}</span>
                  </div>
                  {i < 4 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < prog ? "bg-[#f69a39]" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          )}

          {/* Tracking page link */}
          {shipment.tracking_page_url && (
            <a href={shipment.tracking_page_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#f69a39] hover:underline">
              <i className="fa-solid fa-arrow-up-right-from-square" />
              View on Easyship tracking page
            </a>
          )}

          {/* Checkpoint timeline */}
          {shipment.checkpoints && shipment.checkpoints.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Tracking History</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shipment.checkpoints.map((cp, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${i === 0 ? "bg-[#f69a39]" : "bg-gray-300"}`} />
                      {i < shipment.checkpoints.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-2">
                      <p className="font-medium text-[#1e1e21]">{cp.message || cp.description || cp.status_state}</p>
                      <p className="text-gray-400 text-[10px]">
                        {cp.occurred_at && new Date(cp.occurred_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {cp.location && ` · ${cp.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
