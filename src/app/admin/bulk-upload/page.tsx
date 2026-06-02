"use client";
import { useState, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

type Tab = "categories" | "products" | "inventory";

interface UploadResult {
  total: number;
  inserted?: number;
  updated?: number;
  variants_inserted?: number;
  variants_updated?: number;
  services_linked?: number;
  addons_linked?: number;
  errors: string[];
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "categories", label: "Categories", icon: "fa-solid fa-folder" },
  { id: "products",   label: "Products",   icon: "fa-solid fa-box" },
  { id: "inventory",  label: "Inventory",  icon: "fa-solid fa-warehouse" },
];


export default function BulkUploadPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTabChange(t: Tab) {
    setTab(t);
    setFile(null);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/bulk-upload/${tab}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <AdminHeader title="Bulk Upload" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-[#1e1e21] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <i className={`${t.icon} text-[12px]`} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upload panel */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-[#1e1e21] mb-1">Upload {TABS.find(t => t.id === tab)?.label} CSV</h2>
          <p className="text-xs text-gray-400 mb-5">Upload a CSV file to bulk insert or update records. Existing entries are matched and updated.</p>

          {/* Drop zone */}
          <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            file ? "border-[#f69a39] bg-[#fff8f0]" : "border-gray-200 hover:border-[#f69a39]"
          }`}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(""); }} />
            <i className={`fa-solid fa-file-csv text-3xl mb-3 ${file ? "text-[#f69a39]" : "text-gray-300"}`} />
            {file ? (
              <div>
                <p className="text-sm font-semibold text-[#1e1e21]">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Click to select CSV file</p>
                <p className="text-xs text-gray-400 mt-1">Max 5 MB</p>
              </div>
            )}
          </label>

          <button onClick={handleUpload} disabled={!file || loading}
            className="w-full mt-4 py-2.5 bg-[#f69a39] text-white text-sm font-semibold rounded-lg hover:bg-[#e8880d] transition-colors disabled:opacity-50">
            {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Uploading…</> : <><i className="fa-solid fa-upload mr-2" />Upload & Import</>}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
              <i className="fa-solid fa-circle-exclamation mr-2" />{error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-green-700 mb-2"><i className="fa-solid fa-circle-check mr-2" />Import complete</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>Total rows: <strong>{result.total}</strong></span>
                  {result.inserted !== undefined && <span>Inserted: <strong>{result.inserted}</strong></span>}
                  {result.updated !== undefined && <span>Updated: <strong>{result.updated}</strong></span>}
                  {result.variants_inserted !== undefined && <span>Variants added: <strong>{result.variants_inserted}</strong></span>}
                  {result.variants_updated !== undefined && <span>Variants updated: <strong>{result.variants_updated}</strong></span>}
                  {result.services_linked !== undefined && result.services_linked > 0 && <span>Services linked: <strong>{result.services_linked}</strong></span>}
                  {result.addons_linked !== undefined && result.addons_linked > 0 && <span>Addons linked: <strong>{result.addons_linked}</strong></span>}
                  <span>Errors: <strong className={result.errors.length ? "text-red-600" : ""}>{result.errors.length}</strong></span>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-600 mb-1">Row errors:</p>
                  {result.errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions + demo download */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-[#1e1e21] mb-3">CSV Format</h2>
            {tab === "categories" && (
              <div className="text-xs text-gray-600 space-y-1.5">
                <p><strong>name</strong> — Category name (required)</p>
                <p><strong>slug</strong> — URL slug (auto-generated from name if blank)</p>
                <p><strong>parent_name</strong> — Exact name of parent category (leave blank for top-level)</p>
                <p className="pt-2 text-gray-400">Existing categories matched by name are updated.</p>
              </div>
            )}
            {tab === "products" && (
              <div className="text-xs text-gray-600 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 pt-1">Product fields</p>
                <p><strong>product_code</strong> — Unique code (used to match for updates)</p>
                <p><strong>name</strong> — Product name (required)</p>
                <p><strong>slug</strong> — URL slug (auto-generated if blank)</p>
                <p><strong>category_name</strong> — Exact category name</p>
                <p><strong>brand_name</strong> — Exact brand name</p>
                <p><strong>description</strong> — Product description</p>
                <p><strong>sell_price</strong> — Default selling price</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 pt-2">Variant fields</p>
                <p><strong>sku</strong> — Variant SKU (creates/updates a variant if provided)</p>
                <p><strong>size, color</strong> — Variant attributes</p>
                <p><strong>actual_price</strong> — Variant cost/purchase price</p>
                <p><strong>selling_price</strong> — Variant regular selling price</p>
                <p><strong>offer_price</strong> — Discounted price shown on site (leave blank for no discount)</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 pt-2">Services &amp; Add-ons</p>
                <p><strong>service_names</strong> — Pipe-separated service offering names to link <span className="text-gray-400">(e.g. Machine Knocking|Hand Knocking)</span></p>
                <p><strong>addon_names</strong> — Pipe-separated addon names to link <span className="text-gray-400">(e.g. Extra Grip|Bat Cover)</span></p>
                <p className="pt-2 text-gray-400">Repeat a product row with different SKUs to add multiple variants. Services &amp; addons are set from the first row per product.</p>
              </div>
            )}
            {tab === "inventory" && (
              <div className="text-xs text-gray-600 space-y-1.5">
                <p><strong>sku</strong> — Product variant SKU (required)</p>
                <p><strong>store_name</strong> — Exact store name (required)</p>
                <p><strong>quantity</strong> — Stock quantity (sets absolute value)</p>
                <p className="pt-2 text-gray-400">Sets inventory quantity. Use the Inventory Transfer feature to move stock between stores.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-[#1e1e21] mb-1">Demo CSV</h2>
            <p className="text-xs text-gray-400 mb-4">Download a pre-filled sample file with realistic cricket store data.</p>
            <div className="space-y-2">
              <a href="/demo_categories.csv" download
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${tab === "categories" ? "border-[#f69a39] text-[#f69a39] bg-[#fff8f0]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                <i className="fa-solid fa-download" />
                demo_categories.csv <span className="ml-auto text-xs text-gray-400">35 rows</span>
              </a>
              <a href="/demo_products.csv" download
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${tab === "products" ? "border-[#f69a39] text-[#f69a39] bg-[#fff8f0]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                <i className="fa-solid fa-download" />
                demo_products.csv <span className="ml-auto text-xs text-gray-400">55 rows</span>
              </a>
              <a href="/demo_inventory.csv" download
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${tab === "inventory" ? "border-[#f69a39] text-[#f69a39] bg-[#fff8f0]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                <i className="fa-solid fa-download" />
                demo_inventory.csv <span className="ml-auto text-xs text-gray-400">53 rows</span>
              </a>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Upload categories first, then products, then inventory.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
