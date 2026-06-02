"use client";
import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function posApi(path: string) {
  const token = localStorage.getItem("store_token");
  return fetch(`${API}/pos${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
}

interface Variant { sku: string; product_name: string; size: string; color: string; selling_price: number; stock: number; }

function BarcodeLabel({ item, copies }: { item: Variant; copies: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && item.sku) {
      try {
        JsBarcode(svgRef.current, item.sku, {
          format: "CODE128", width: 1.5, height: 40,
          displayValue: true, fontSize: 10, margin: 4,
        });
      } catch { /* invalid SKU chars */ }
    }
  }, [item.sku]);

  return (
    <>
      {Array.from({ length: copies }).map((_, i) => (
        <div key={i} className="border border-gray-300 rounded p-2 text-center w-[200px] bg-white print:border-black print:break-inside-avoid">
          <p className="text-[9px] font-bold text-gray-700 truncate mb-1">{item.product_name}</p>
          {item.size && <p className="text-[8px] text-gray-500">{item.size}{item.color ? ` · ${item.color}` : ""}</p>}
          <svg ref={i === 0 ? svgRef : undefined} className="w-full" />
          <p className="text-[8px] text-gray-500 mt-1">${Number(item.selling_price).toFixed(2)}</p>
        </div>
      ))}
    </>
  );
}

function BarcodeLabelMulti({ items, copiesMap }: { items: Variant[]; copiesMap: Record<string, number> }) {
  return (
    <>
      {items.map(item => {
        const copies = copiesMap[item.sku] || 1;
        return Array.from({ length: copies }).map((_, i) => (
          <SingleBarcode key={`${item.sku}-${i}`} item={item} />
        ));
      })}
    </>
  );
}

function SingleBarcode({ item }: { item: Variant }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svgRef.current && item.sku) {
      try { JsBarcode(svgRef.current, item.sku, { format: "CODE128", width: 1.5, height: 40, displayValue: true, fontSize: 10, margin: 4 }); }
      catch { /* skip */ }
    }
  }, [item.sku]);
  return (
    <div className="border border-gray-300 rounded p-2 text-center w-[200px] bg-white print:border-black print:break-inside-avoid">
      <p className="text-[9px] font-bold text-gray-700 truncate mb-1">{item.product_name}</p>
      {item.size && <p className="text-[8px] text-gray-500">{item.size}{item.color ? ` · ${item.color}` : ""}</p>}
      <svg ref={svgRef} className="w-full" />
      <p className="text-[8px] text-gray-500 mt-1">${Number(item.selling_price).toFixed(2)}</p>
    </div>
  );
}

export default function BarcodeePage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copies, setCopies] = useState<Record<string, number>>({});

  useEffect(() => {
    posApi("/barcodes").then(d => setVariants(d || [])).catch(() => setVariants([])).finally(() => setLoading(false));
  }, []);

  const filtered = variants.filter(v =>
    !search || v.sku?.toLowerCase().includes(search.toLowerCase()) ||
    v.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(v => v.sku)));
  }

  const selectedItems = variants.filter(v => selected.has(v.sku));

  return (
    <div>
      <style>{`@media print {
        .no-print { display: none !important; }
        #barcode-print { display: flex !important; flex-wrap: wrap; gap: 8px; padding: 8px; }
      }`}</style>

      {/* Print area */}
      <div id="barcode-print" className="hidden">
        <BarcodeLabelMulti items={selectedItems} copiesMap={copies} />
      </div>

      <div className="no-print">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-bold text-[#1e1e21]"><i className="fa-solid fa-barcode text-[#f69a39] mr-2" />Barcode Printing</h1>
          <div className="flex gap-2">
            <button onClick={toggleAll} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-400 transition-colors">
              {selected.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={() => window.print()}
              disabled={selected.size === 0}
              className="px-4 py-2 bg-[#f69a39] text-white text-sm font-semibold rounded-lg hover:bg-[#e8880d] transition-colors disabled:opacity-50">
              <i className="fa-solid fa-print mr-2" />Print {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU or product name…"
          className="w-full mb-4 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#f69a39]" />

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No SKUs found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wide">
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" /></th>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">SKU</th>
                  <th className="text-left px-4 py-3">Variant</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-center px-4 py-3">Copies</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.sku} className={`border-b border-gray-50 hover:bg-gray-50/50 ${selected.has(v.sku) ? "bg-[#fff8f0]" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(v.sku)}
                        onChange={() => {
                          const s = new Set(selected);
                          s.has(v.sku) ? s.delete(v.sku) : s.add(v.sku);
                          setSelected(s);
                        }} className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1e1e21] text-[13px]">{v.product_name}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-600">{v.sku}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{v.size}{v.color ? ` · ${v.color}` : ""}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#f69a39]">${Number(v.selling_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[12px] text-gray-500">{v.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="number" min="1" max="50"
                        value={copies[v.sku] || 1}
                        onChange={e => setCopies(c => ({ ...c, [v.sku]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-[#f69a39]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Live preview */}
        {selected.size > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preview</p>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-100 rounded-xl">
              {selectedItems.slice(0, 6).map(item => <SingleBarcode key={item.sku} item={item} />)}
              {selected.size > 6 && <div className="w-[200px] flex items-center justify-center text-gray-400 text-sm">+{selected.size - 6} more</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
