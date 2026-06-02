"use client";
import { useState, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function posApi(path: string, method = "GET", body?: unknown) {
  const token = localStorage.getItem("store_token");
  return fetch(`${API}/pos${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async r => {
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || r.statusText);
    return d;
  });
}

interface CartItem {
  product_id: number; variant_id: number; product_name: string;
  sku: string; size: string; color: string;
  unit_price: number; actual_price: number; quantity: number; stock: number;
}

interface Sale { id: number; invoice_no: string; total: number; }

const PAYMENT_METHODS = ["cash", "card", "transfer"] as const;

export default function PosSalePage() {
  const [sku, setSku] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>("cash");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const skuRef = useRef<HTMLInputElement>(null);

  const TAX_RATE = 0.07;
  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + tax - discount);

  const addBySku = useCallback(async (skuVal: string) => {
    const s = skuVal.trim().toUpperCase();
    if (!s) return;
    setError("");
    try {
      const item = await posApi(`/products/sku/${encodeURIComponent(s)}`);
      setCart(prev => {
        const idx = prev.findIndex(c => c.variant_id === item.variant_id);
        if (idx >= 0) {
          if (prev[idx].quantity >= prev[idx].stock) {
            setError(`Max stock reached for ${s}`);
            return prev;
          }
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        if (item.stock < 1) { setError(`Out of stock: ${s}`); return prev; }
        return [...prev, {
          product_id: item.product_id, variant_id: item.variant_id,
          product_name: item.product_name, sku: item.sku,
          size: item.size || "", color: item.color || "",
          unit_price: parseFloat(item.offer_price || item.selling_price || 0),
          actual_price: parseFloat(item.actual_price || 0),
          quantity: 1, stock: item.stock,
        }];
      });
      setSku("");
      skuRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "SKU not found");
    }
  }, []);

  function updateQty(variantId: number, qty: number) {
    if (qty < 1) { setCart(c => c.filter(i => i.variant_id !== variantId)); return; }
    setCart(c => c.map(i => i.variant_id === variantId
      ? { ...i, quantity: Math.min(qty, i.stock) } : i));
  }

  async function placeOrder() {
    if (!cart.length) { setError("Cart is empty"); return; }
    setPlacing(true); setError("");
    try {
      const sale = await posApi("/sales", "POST", {
        items: cart.map(i => ({
          product_id: i.product_id, variant_id: i.variant_id,
          product_name: `${i.product_name}${i.size ? ` (${i.size})` : ""}${i.color ? ` - ${i.color}` : ""}`,
          sku: i.sku, quantity: i.quantity, unit_price: i.unit_price, actual_price: i.actual_price,
        })),
        customer_name: customer.name || undefined,
        customer_phone: customer.phone || undefined,
        tax_amount: tax,
        discount,
        payment_method: paymentMethod,
      });
      setCompletedSale(sale);
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setDiscount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally { setPlacing(false); }
  }

  function printBill() { window.print(); }
  function newSale() { setCompletedSale(null); skuRef.current?.focus(); }

  if (completedSale) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-check text-green-600 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-[#1e1e21] mb-1">Sale Complete!</h2>
        <p className="text-gray-500 text-sm mb-1">Invoice: <span className="font-mono font-bold text-[#f69a39]">{completedSale.invoice_no}</span></p>
        <p className="text-2xl font-bold text-[#1e1e21] mb-6">${Number(completedSale.total).toFixed(2)}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={printBill}
            className="px-5 py-2.5 border border-[#1e1e21] text-[#1e1e21] text-sm font-semibold rounded-lg hover:bg-[#1e1e21] hover:text-white transition-colors">
            <i className="fa-solid fa-print mr-2" />Print Bill
          </button>
          <button onClick={newSale}
            className="px-5 py-2.5 bg-[#f69a39] text-white text-sm font-semibold rounded-lg hover:bg-[#e8880d] transition-colors">
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-48px)]">
      {/* Left — SKU entry + cart */}
      <div className="flex-1 flex flex-col min-w-0">
        <h1 className="text-lg font-bold text-[#1e1e21] mb-4">
          <i className="fa-solid fa-cash-register text-[#f69a39] mr-2" />New Sale
        </h1>

        {/* SKU scanner */}
        <div className="flex gap-2 mb-4">
          <input
            ref={skuRef}
            autoFocus
            value={sku}
            onChange={e => setSku(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addBySku(sku)}
            placeholder="Scan or type SKU and press Enter…"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#f69a39]"
          />
          <button onClick={() => addBySku(sku)}
            className="px-4 py-2.5 bg-[#f69a39] text-white text-sm font-semibold rounded-lg hover:bg-[#e8880d] transition-colors">
            Add
          </button>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}

        {/* Cart */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-sm">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-16">
              <i className="fa-solid fa-barcode text-5xl mb-3" />
              <p className="text-sm">Scan a product SKU to begin</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-center px-3 py-3">Qty</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.variant_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1e1e21] text-[13px]">{item.product_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{item.sku}{item.size && ` · ${item.size}`}{item.color && ` · ${item.color}`}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => updateQty(item.variant_id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs flex items-center justify-center">−</button>
                        <span className="w-8 text-center font-semibold text-[13px]">{item.quantity}</span>
                        <button onClick={() => updateQty(item.variant_id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs flex items-center justify-center disabled:opacity-40">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px]">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[13px] text-[#f69a39]">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-2 py-3">
                      <button onClick={() => setCart(c => c.filter(i => i.variant_id !== item.variant_id))}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right — order summary */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-4">
        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Customer (optional)</p>
          <input value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
            placeholder="Name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#f69a39]" />
          <input value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
            placeholder="Phone" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Payment Method</p>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${paymentMethod === m ? "bg-[#f69a39] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax (7%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">$</span>
                <input type="number" min="0" max={subtotal + tax} value={discount || ""}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 border border-gray-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:border-[#f69a39]"
                  placeholder="0.00" />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-lg text-[#1e1e21]">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={placeOrder} disabled={placing || cart.length === 0}
          className="w-full py-4 bg-[#f69a39] hover:bg-[#e8880d] text-white font-bold text-base rounded-xl transition-colors disabled:opacity-50 shadow-md">
          {placing ? "Processing…" : `Charge $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
