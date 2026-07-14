"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
const UPLOADS = API.replace("/api", "");

function posApi(path: string) {
  const token = localStorage.getItem("store_token");
  return fetch(`${API}/pos${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
}

interface Variant { id: number; sku: string; size: string; color: string; selling_price: number; offer_price: number | null; stock: number; }
interface Product { id: number; name: string; description: string; image: string; category: string; variants: Variant[]; min_price: number; max_price: number; in_stock: boolean; }
interface CartItem { product: Product; variant: Variant; quantity: number; }

function price(v: Variant) { return Number(v.offer_price ?? v.selling_price) || 0; }

// ── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (v: Variant, qty: number) => void }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inStockVariants = product.variants.filter(v => v.stock > 0);
  const sizes = Array.from(new Set(product.variants.filter(v => v.stock > 0).map(v => v.size).filter(Boolean)));
  const colors = Array.from(new Set(product.variants.filter(v => v.stock > 0).map(v => v.color).filter(Boolean)));

  const [selSize, setSelSize] = useState(sizes[0] || "");
  const [selColor, setSelColor] = useState(colors[0] || "");

  useEffect(() => {
    const match = product.variants.find(v =>
      (sizes.length === 0 || v.size === selSize) &&
      (colors.length === 0 || v.color === selColor) &&
      v.stock > 0
    ) || inStockVariants[0] || null;
    setSelectedVariant(match);
    setQty(1);
    setAdded(false);
  }, [selSize, selColor]);

  function handleAdd() {
    if (!selectedVariant) return;
    onAdd(selectedVariant, qty);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Image */}
        <div className="relative h-64 bg-[#0a0a0a] rounded-t-2xl overflow-hidden">
          {product.image ? (
            <Image src={`${UPLOADS}${product.image}`} alt={product.name} fill className="object-contain p-6" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              <i className="fa-solid fa-image text-5xl" />
            </div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
          {product.category && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-[#f69a39] text-black text-xs font-bold rounded-full">{product.category}</span>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
          {product.description && <p className="text-gray-400 text-sm mb-5 leading-relaxed">{product.description}</p>}

          {/* Size picker */}
          {sizes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button key={s} onClick={() => setSelSize(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${selSize === s ? "bg-[#f69a39] border-[#f69a39] text-black" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color picker */}
          {colors.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button key={c} onClick={() => setSelColor(c)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${selColor === c ? "bg-[#f69a39] border-[#f69a39] text-black" : "border-gray-600 text-gray-300 hover:border-gray-400"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Price + Add */}
          {selectedVariant ? (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl px-4 py-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors text-lg">−</button>
                <span className="w-8 text-center text-white text-lg font-bold">{qty}</span>
                <button onClick={() => setQty(q => Math.min(q + 1, selectedVariant.stock))} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors text-lg">+</button>
              </div>

              <div className="flex-1">
                <p className="text-3xl font-bold text-[#f69a39]">${(price(selectedVariant) * qty).toFixed(2)}</p>
                {qty > 1 && <p className="text-xs text-gray-500">${price(selectedVariant).toFixed(2)} each</p>}
              </div>

              <button onClick={handleAdd} disabled={added}
                className={`px-8 py-4 rounded-xl font-bold text-base transition-all ${added ? "bg-green-500 text-white scale-95" : "bg-[#f69a39] text-black hover:bg-[#e8880d] active:scale-95"}`}>
                {added ? <><i className="fa-solid fa-check mr-2" />Added!</> : <><i className="fa-solid fa-cart-plus mr-2" />Add to Cart</>}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-center text-red-400 font-semibold">
              <i className="fa-solid fa-circle-xmark mr-2" />Out of Stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onRemove, onQtyChange, onSendToCounter }:
  { cart: CartItem[]; onClose: () => void; onRemove: (idx: number) => void; onQtyChange: (idx: number, qty: number) => void; onSendToCounter: () => void }) {
  const total = cart.reduce((s, i) => s + price(i.variant) * i.quantity, 0);
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-sm bg-[#111] h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg"><i className="fa-solid fa-cart-shopping text-[#f69a39] mr-2" />Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-xl" /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
            <i className="fa-solid fa-cart-shopping text-5xl mb-3" />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-[#1a1a1a] rounded-xl p-3 flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[#0a0a0a]">
                    {item.product.image ? (
                      <Image src={`${UPLOADS}${item.product.image}`} alt={item.product.name} fill className="object-contain p-1" />
                    ) : <div className="flex items-center justify-center h-full text-gray-700"><i className="fa-solid fa-image" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{item.product.name}</p>
                    <p className="text-gray-500 text-[10px]">{[item.variant.size, item.variant.color].filter(Boolean).join(" · ")}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => onQtyChange(idx, item.quantity - 1)} className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm hover:bg-gray-600">−</button>
                      <span className="text-white text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => onQtyChange(idx, item.quantity + 1)} disabled={item.quantity >= item.variant.stock} className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm hover:bg-gray-600 disabled:opacity-30">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => onRemove(idx)} className="text-gray-600 hover:text-red-400 transition-colors"><i className="fa-solid fa-xmark text-xs" /></button>
                    <p className="text-[#f69a39] font-bold text-sm">${(price(item.variant) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between text-white">
                <span className="text-gray-400">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
                <span className="text-2xl font-bold text-[#f69a39]">${total.toFixed(2)}</span>
              </div>
              <button onClick={onSendToCounter}
                className="w-full py-4 bg-[#f69a39] text-black font-bold text-base rounded-xl hover:bg-[#e8880d] active:scale-[0.98] transition-all">
                <i className="fa-solid fa-arrow-right mr-2" />Send to Counter
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Send to Counter Screen ────────────────────────────────────────────────────
function CounterScreen({ cart, onNewSession }: { cart: CartItem[]; onNewSession: () => void }) {
  const total = cart.reduce((s, i) => s + price(i.variant) * i.quantity, 0);
  const ref = useRef<string>(`K-${Date.now().toString(36).toUpperCase()}`);
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <i className="fa-solid fa-check text-white text-2xl" />
      </div>
      <h1 className="text-white text-3xl font-bold mb-2">Ready for Checkout!</h1>
      <p className="text-gray-400 mb-1">Session ref: <span className="font-mono text-[#f69a39] font-bold">{ref.current}</span></p>
      <p className="text-gray-500 text-sm mb-8">Please proceed to the counter — a staff member will assist you.</p>

      {/* Item summary */}
      <div className="w-full max-w-md bg-[#111] rounded-2xl p-5 mb-6 space-y-3">
        {cart.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
              <p className="text-gray-500 text-xs">{[item.variant.size, item.variant.color].filter(Boolean).join(" · ")} · Qty {item.quantity}</p>
            </div>
            <p className="text-[#f69a39] font-bold text-sm flex-shrink-0">${(price(item.variant) * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <div className="border-t border-white/10 pt-3 flex justify-between">
          <span className="text-gray-400 font-semibold">Total</span>
          <span className="text-[#f69a39] text-xl font-bold">${total.toFixed(2)}</span>
        </div>
      </div>

      <button onClick={onNewSession}
        className="px-8 py-3 border border-gray-700 text-gray-400 rounded-xl font-semibold hover:border-gray-500 hover:text-white transition-colors">
        <i className="fa-solid fa-rotate-left mr-2" />Start New Session
      </button>
    </div>
  );
}

// ── Main Kiosk Page ───────────────────────────────────────────────────────────
export default function KioskPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [counterScreen, setCounterScreen] = useState(false);
  const [storeName, setStoreName] = useState("Papas Willow");

  useEffect(() => {
    const token = localStorage.getItem("store_token");
    if (!token) {
      router.replace("/pos/login");
      return;
    }
    setAuthed(true);
    const info = localStorage.getItem("store_info");
    if (info) { try { setStoreName(JSON.parse(info).name || "Papas Willow"); } catch { /* */ } }

    posApi("/kiosk")
      .then(d => setProducts(d || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Block render until auth check completes
  if (authed === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-[#f69a39] text-3xl" />
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set<string>(products.map(p => p.category).filter((c): c is string => Boolean(c))))];

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  function addToCart(product: Product, variant: Variant, quantity: number) {
    setCart(prev => {
      const idx = prev.findIndex(i => i.variant.id === variant.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + quantity, variant.stock) };
        return next;
      }
      return [...prev, { product, variant, quantity }];
    });
    setCartOpen(true);
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  function updateQty(idx: number, qty: number) {
    if (qty < 1) { removeFromCart(idx); return; }
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: Math.min(qty, item.variant.stock) } : item));
  }

  function sendToCounter() {
    setCartOpen(false);
    setCounterScreen(true);
  }

  function newSession() {
    setCart([]);
    setCounterScreen(false);
    setSearch("");
    setActiveCategory("All");
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  if (counterScreen) {
    return <CounterScreen cart={cart} onNewSession={newSession} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="bg-[#111] border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <div className="flex-shrink-0 flex flex-col items-start">
          <Image src="/logo.png" alt="Papas Willow" width={110} height={40} className="object-contain" />
          <div className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">{storeName}</div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3 pl-11 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#f69a39]/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* Cart */}
        <button onClick={() => setCartOpen(true)}
          className="relative flex-shrink-0 w-14 h-14 bg-[#f69a39] rounded-full flex items-center justify-center hover:bg-[#e8880d] active:scale-95 transition-all">
          <i className="fa-solid fa-cart-shopping text-black text-xl" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{totalItems}</span>
          )}
        </button>
      </header>

      {/* Category pills */}
      <div className="bg-[#111] border-b border-white/10 px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat ? "bg-[#f69a39] text-black" : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#222]"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <main className="flex-1 px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600">
            <i className="fa-solid fa-spinner fa-spin text-4xl mb-3" />
            <p>Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600">
            <i className="fa-solid fa-box-open text-5xl mb-3" />
            <p className="text-lg">No products found</p>
            {search && <button onClick={() => setSearch("")} className="mt-2 text-[#f69a39] text-sm hover:underline">Clear search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(product => {
              const displayPrice = Number(product.min_price);
              const maxPrice = Number(product.max_price);
              const hasRange = displayPrice !== maxPrice;
              return (
                <button key={product.id} onClick={() => setSelectedProduct(product)}
                  className={`bg-[#111] rounded-2xl overflow-hidden text-left group transition-all hover:border-[#f69a39]/50 hover:scale-[1.02] active:scale-[0.98] border ${product.in_stock ? "border-white/5" : "border-white/5 opacity-60"}`}>
                  {/* Image */}
                  <div className="relative h-44 bg-[#0d0d0d]">
                    {product.image ? (
                      <Image
                        src={`${UPLOADS}${product.image}`}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-700">
                        <i className="fa-solid fa-image text-4xl" />
                      </div>
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-900/80 text-red-300 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                    {product.category && (
                      <span className="absolute top-2 left-2 bg-black/60 text-gray-300 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-2 group-hover:text-[#f69a39] transition-colors">{product.name}</p>
                    <p className="text-[#f69a39] font-bold text-base">
                      {hasRange ? `$${displayPrice.toFixed(2)}–$${maxPrice.toFixed(2)}` : `$${displayPrice.toFixed(2)}`}
                    </p>
                    <p className="text-xs mt-1 font-medium">
                      {product.in_stock
                        ? <span className="text-green-500"><i className="fa-solid fa-circle text-[7px] mr-1 align-middle" />In Stock</span>
                        : <span className="text-red-500"><i className="fa-solid fa-circle text-[7px] mr-1 align-middle" />Out of Stock</span>}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#111] border-t border-white/10 py-3 text-center">
        <p className="text-gray-600 text-xs">Touch a product to view details &amp; add to cart · Ask a staff member for assistance</p>
      </footer>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(v, qty) => { addToCart(selectedProduct, v, qty); setSelectedProduct(null); }}
        />
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onQtyChange={updateQty}
          onSendToCounter={sendToCounter}
        />
      )}
    </div>
  );
}
