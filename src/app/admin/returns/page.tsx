"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import AdminHeader from "@/components/admin/AdminHeader";

interface Return {
  id: number; order_no: string; customer_name: string; customer_email: string;
  reason: string; message: string | null; status: "pending" | "approved" | "rejected" | "completed";
  admin_note: string | null; item_count: number; order_total: number; created_at: string;
  stripe_refund_id: string | null;
}

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "approved",  label: "Approved",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "rejected",  label: "Rejected",  color: "bg-red-100 text-red-700 border-red-200" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
];

function statusMeta(s: string) { return STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0]; }

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [filter, setFilter] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);
  const [refundError, setRefundError] = useState<Record<number, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    const params = filter ? `?status=${filter}` : "";
    const data = await api.get(`/returns${params}`) as Return[];
    setReturns(data || []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    setRefundError(prev => ({ ...prev, [id]: "" }));
    try {
      const res = await api.patch(`/returns/${id}/status`, { status, admin_note: noteInputs[id] || undefined }) as { refund_error?: string };
      if (res?.refund_error) {
        setRefundError(prev => ({ ...prev, [id]: `Refund failed: ${res.refund_error}` }));
      }
    } catch { /* ignore */ }
    await load();
    setUpdating(null);
  }

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = returns.filter(r => r.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <AdminHeader title="Return Requests" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilter("")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "" ? "bg-[#1e1e21] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}>
          All ({returns.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s.value ? "bg-[#1e1e21] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}>
            {s.label}
            {counts[s.value] > 0 && (
              <span className="ml-1.5 bg-[#f69a39] text-white text-[10px] px-1.5 py-0.5 rounded-full">{counts[s.value]}</span>
            )}
          </button>
        ))}
      </div>

      {returns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No return requests found</div>
      ) : (
        <div className="space-y-3">
          {returns.map(ret => {
            const sm = statusMeta(ret.status);
            const isExpanded = expanded === ret.id;
            return (
              <div key={ret.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Row */}
                <div className="px-5 py-4 flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold text-[#1e1e21]">{ret.order_no}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sm.color}`}>{sm.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{ret.customer_name} · {ret.customer_email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(ret.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{ret.item_count} item{ret.item_count !== 1 ? "s" : ""}
                      {" · "}${Number(ret.order_total || 0).toFixed(2)}
                    </p>
                    <p className="text-xs font-medium text-[#1e1e21] mt-1">Reason: {ret.reason}</p>
                    {ret.message && <p className="text-xs text-gray-400 italic mt-0.5">&ldquo;{ret.message}&rdquo;</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Stripe refund badge */}
                    {ret.stripe_refund_id && (
                      <span className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold rounded-lg flex items-center gap-1">
                        <i className="fa-brands fa-stripe text-[#635bff]" /> Refunded
                      </span>
                    )}
                    {/* Quick status buttons for pending */}
                    {ret.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(ret.id, "approved")} disabled={updating === ret.id}
                          className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                          {updating === ret.id ? "Processing…" : "Approve & Refund"}
                        </button>
                        <button onClick={() => updateStatus(ret.id, "rejected")} disabled={updating === ret.id}
                          className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                          Reject
                        </button>
                      </>
                    )}
                    {ret.status === "approved" && (
                      <button onClick={() => updateStatus(ret.id, "completed")} disabled={updating === ret.id}
                        className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                        Mark Completed
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : ret.id)}
                      className="text-gray-400 hover:text-[#f69a39] transition-colors">
                      <svg className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded — admin note + status change */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                    {ret.stripe_refund_id && (
                      <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-100 rounded text-xs text-purple-700">
                        <i className="fa-brands fa-stripe text-[#635bff]" />
                        <span>Stripe refund issued · <span className="font-mono">{ret.stripe_refund_id}</span></span>
                      </div>
                    )}
                    {refundError[ret.id] && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        <i className="fa-solid fa-triangle-exclamation mr-1" />{refundError[ret.id]}
                      </div>
                    )}
                    {ret.admin_note && (
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">Admin note: </span>{ret.admin_note}
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Add / update admin note</label>
                        <input
                          value={noteInputs[ret.id] ?? ret.admin_note ?? ""}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [ret.id]: e.target.value }))}
                          placeholder="Internal note visible to customer on resolution…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#f69a39]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                        <select
                          defaultValue={ret.status}
                          onChange={e => updateStatus(ret.id, e.target.value)}
                          disabled={updating === ret.id}
                          className="border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#f69a39] disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
