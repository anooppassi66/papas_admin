"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import ShipmentTracker from "@/components/admin/ShipmentTracker";
import { api, UPLOADS } from "@/lib/api";

interface Order {
  order_no: string;
  date: string;
  payment_statu: string;
  order_status: "pending" | "dispatched" | "shipped" | "delivered";
  shipping_name: string;
  shipping_line1: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  payment_mode: string;
  subtotal: number;
  total_tax: number;
  total: number;
  total_qty: number;
  item_count: number;
}

interface OrderItem {
  id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  quantity: number;
  sell_price: number;
  size: string;
  color: string;
  sku: string;
  brand_name: string;
}
interface OrderService {
  id: number;
  offering_name: string;
  category_name: string;
  price: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
}
interface OrderAddon {
  id: number;
  addon_name: string;
  price: number;
  packed: boolean;
}
interface OrderDetail {
  items: OrderItem[];
  services: OrderService[];
  addons: OrderAddon[];
}

const STATUS_OPTIONS = [
  { value: "pending",    label: "Pending",    color: "bg-yellow-100 text-yellow-700" },
  { value: "dispatched", label: "Dispatched", color: "bg-blue-100 text-blue-700" },
  { value: "shipped",    label: "Shipped",    color: "bg-purple-100 text-purple-700" },
  { value: "delivered",  label: "Delivered",  color: "bg-green-100 text-green-700" },
];

const PAYMENT_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-700",
};

function statusMeta(v: string) {
  return STATUS_OPTIONS.find(s => s.value === v) ?? STATUS_OPTIONS[0];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, OrderDetail>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      setOrders(await api.get(`/orders${params}`) as Order[]);
    } catch (_) {}
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function toggleExpand(order_no: string) {
    if (expandedOrder === order_no) { setExpandedOrder(null); return; }
    setExpandedOrder(order_no);
    if (details[order_no]) return;
    setLoadingItems(order_no);
    try {
      const data = await api.get(`/orders/${order_no}`) as OrderDetail;
      setDetails(prev => ({ ...prev, [order_no]: data }));
    } catch (_) {}
    finally { setLoadingItems(null); }
  }

  async function updateServiceStatus(order_no: string, svcId: number, status: string) {
    await api.patch(`/orders/services/${svcId}/status`, { status }).catch(() => {});
    setDetails(prev => ({
      ...prev,
      [order_no]: {
        ...prev[order_no],
        services: prev[order_no].services.map(s => s.id === svcId ? { ...s, status: status as OrderService["status"] } : s),
      },
    }));
  }

  async function toggleAddonPacked(order_no: string, addonId: number) {
    await api.patch(`/orders/addons/${addonId}/pack`, {}).catch(() => {});
    setDetails(prev => ({
      ...prev,
      [order_no]: {
        ...prev[order_no],
        addons: prev[order_no].addons.map(a => a.id === addonId ? { ...a, packed: !a.packed } : a),
      },
    }));
  }

  async function updateStatus(order_no: string, order_status: string) {
    setUpdatingStatus(order_no);
    try {
      await api.patch(`/orders/${order_no}/status`, { order_status });
      setOrders(prev => prev.map(o => o.order_no === order_no ? { ...o, order_status: order_status as Order["order_status"] } : o));
    } catch (_) {}
    finally { setUpdatingStatus(null); }
  }

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = orders.filter(o => o.order_status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <AdminHeader title="Orders" />

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterStatus === "" ? "bg-[#1e1e21] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
        >
          All orders
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s.value ? "bg-[#1e1e21] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            {s.label}
            {counts[s.value] > 0 && (
              <span className="ml-1.5 bg-[#f69a39] text-white text-[10px] px-1.5 py-0.5 rounded-full">{counts[s.value]}</span>
            )}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const sm = statusMeta(order.order_status);
            const isExpanded = expandedOrder === order.order_no;
            const isUpdating = updatingStatus === order.order_no;
            const detail = details[order.order_no];
            const orderItems = detail?.items || [];
            const orderServices = detail?.services || [];
            const orderAddons = detail?.addons || [];

            return (
              <div key={order.order_no} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order row */}
                <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-[#1e1e21]">{order.order_no}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sm.color}`}>{sm.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PAYMENT_COLOR[order.payment_statu] ?? "bg-gray-100 text-gray-500"}`}>
                        {order.payment_statu}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{new Date(order.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>·</span>
                      <span className="font-medium text-gray-600">{order.shipping_name}</span>
                      {order.shipping_city && <><span>·</span><span>{order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ""}</span></>}
                      {order.shipping_phone && <><span>·</span><span>{order.shipping_phone}</span></>}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#1e1e21]">${Number(order.total).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{order.item_count} item{order.item_count !== 1 ? "s" : ""} · {order.payment_mode}</div>
                    {Number(order.total_tax) > 0 && (
                      <div className="text-[10px] text-gray-400">incl. ${Number(order.total_tax).toFixed(2)} tax</div>
                    )}
                  </div>

                  {/* Status changer */}
                  <select
                    value={order.order_status}
                    disabled={isUpdating}
                    onChange={e => updateStatus(order.order_no, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#f69a39] disabled:opacity-50 min-w-[120px]"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>

                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpand(order.order_no)}
                    className="text-gray-400 hover:text-[#f69a39] transition-colors"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {/* Shipping address */}
                    <div className="mb-4 text-xs text-gray-500">
                      <span className="font-medium text-gray-600 uppercase tracking-wide text-[10px]">Shipping Address</span>
                      <div className="mt-1">
                        {order.shipping_name} · {order.shipping_line1}
                        {order.shipping_city && `, ${order.shipping_city}`}
                        {order.shipping_state && ` ${order.shipping_state}`}
                        {order.shipping_pincode && ` ${order.shipping_pincode}`}
                      </div>
                    </div>

                    {loadingItems === order.order_no ? (
                      <div className="text-xs text-gray-400 py-4 text-center">Loading…</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Products */}
                        <div className="space-y-2">
                          {orderItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-gray-100">
                              <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                {item.product_image ? (
                                  <Image src={item.product_image.startsWith("/uploads") ? `${UPLOADS}${item.product_image}` : item.product_image}
                                    alt={item.product_name} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#1e1e21] line-clamp-1">{item.product_name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {item.brand_name && <span>{item.brand_name} · </span>}
                                  {item.size && <span>Size: {item.size} · </span>}
                                  {item.color && <span>Color: {item.color} · </span>}
                                  {item.sku && <span className="font-mono">{item.sku}</span>}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xs font-semibold text-[#1e1e21]">${Number(item.sell_price).toFixed(2)}</div>
                                <div className="text-[11px] text-gray-400">Qty: {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Service bookings */}
                        {orderServices.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <i className="fa-solid fa-screwdriver-wrench" /> Service Bookings
                            </p>
                            <div className="space-y-2">
                              {orderServices.map(svc => {
                                const SVC_STATUS = [
                                  { value: "pending",     label: "Pending",     color: "bg-yellow-100 text-yellow-700" },
                                  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
                                  { value: "completed",   label: "Completed",   color: "bg-green-100 text-green-700" },
                                  { value: "cancelled",   label: "Cancelled",   color: "bg-red-100 text-red-600" },
                                ];
                                return (
                                  <div key={svc.id} className="flex items-center gap-3 bg-blue-50 rounded-lg px-3 py-2.5 border border-blue-100">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-[#1e1e21]">{svc.offering_name}</p>
                                      <p className="text-[11px] text-gray-400">{svc.category_name} · ${Number(svc.price).toFixed(2)}</p>
                                    </div>
                                    <select value={svc.status}
                                      onChange={e => updateServiceStatus(order.order_no, svc.id, e.target.value)}
                                      className="border border-blue-200 rounded px-2 py-1 text-[11px] bg-white focus:outline-none focus:border-blue-400">
                                      {SVC_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Addons */}
                        {orderAddons.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <i className="fa-solid fa-box" /> Add-ons (pack with shipment)
                            </p>
                            <div className="space-y-2">
                              {orderAddons.map(addon => (
                                <div key={addon.id} className="flex items-center gap-3 bg-green-50 rounded-lg px-3 py-2.5 border border-green-100">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[#1e1e21]">{addon.addon_name}</p>
                                    <p className="text-[11px] text-gray-400">${Number(addon.price).toFixed(2)}</p>
                                  </div>
                                  <button onClick={() => toggleAddonPacked(order.order_no, addon.id)}
                                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${addon.packed ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200 hover:border-green-400"}`}>
                                    {addon.packed ? "✓ Packed" : "Mark Packed"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Easyship tracking */}
                    <ShipmentTracker orderNo={order.order_no} />
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
