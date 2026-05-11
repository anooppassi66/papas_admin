"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";

interface Category { id: number; name: string; level: number; slug: string; }
interface Brand { id: number; brand_name: string; }
interface Section { section_key: string; category_ids: string | null; brand_id: number | null; }

const INDENT = ["", "└─ ", "  └─ ", "    └─ "];

const SECTION_META: Record<string, { label: string; desc: string; type: "categories" | "brand"; max?: number }> = {
  shop_by_department: { label: "Shop by Department", desc: "Shown as a horizontal card carousel on the homepage.", type: "categories", max: 8 },
  essentials:         { label: "Cricket Essentials", desc: "4-column image grid below the department carousel.", type: "categories", max: 4 },
  shoes:              { label: "Cricket Shoes", desc: "2-column wide image tiles section.", type: "categories", max: 2 },
  featured_brand:     { label: "Featured Brand", desc: "Shows brand image on the left and 4 products on the right.", type: "brand" },
  other_departments:  { label: "Other Departments", desc: "Dark section at the bottom with department tiles.", type: "categories", max: 5 },
};

const SECTION_ORDER = ["shop_by_department", "essentials", "shoes", "featured_brand", "other_departments"];

export default function HomepagePage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});

  // Per-section local selections (category IDs or brand ID)
  const [catSelections, setCatSelections] = useState<Record<string, number[]>>({});
  const [brandSelections, setBrandSelections] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [c, b, s] = await Promise.all([
      api.get("/categories") as Promise<Category[]>,
      api.get("/brands") as Promise<Brand[]>,
      api.get("/homepage-sections") as Promise<Section[]>,
    ]);
    setCats(c);
    setBrands(b);
    const map: Record<string, Section> = {};
    for (const sec of s) map[sec.section_key] = sec;
    setSections(map);

    const catSel: Record<string, number[]> = {};
    const brandSel: Record<string, string> = {};
    for (const sec of s) {
      if (sec.category_ids) {
        catSel[sec.section_key] = sec.category_ids.split(",").map(Number).filter(Boolean);
      } else {
        catSel[sec.section_key] = [];
      }
      brandSel[sec.section_key] = sec.brand_id ? String(sec.brand_id) : "";
    }
    setCatSelections(catSel);
    setBrandSelections(brandSel);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleCat(sectionKey: string, id: number, max: number) {
    setCatSelections(prev => {
      const cur = prev[sectionKey] || [];
      if (cur.includes(id)) return { ...prev, [sectionKey]: cur.filter(x => x !== id) };
      if (cur.length >= max) return prev; // enforce max
      return { ...prev, [sectionKey]: [...cur, id] };
    });
  }

  async function save(sectionKey: string) {
    const meta = SECTION_META[sectionKey];
    setSaving(p => ({ ...p, [sectionKey]: true }));
    setError(p => ({ ...p, [sectionKey]: "" }));
    try {
      if (meta.type === "categories") {
        await api.put(`/homepage-sections/${sectionKey}`, {
          category_ids: (catSelections[sectionKey] || []).join(",") || null,
          brand_id: null,
        });
      } else {
        await api.put(`/homepage-sections/${sectionKey}`, {
          category_ids: null,
          brand_id: brandSelections[sectionKey] ? Number(brandSelections[sectionKey]) : null,
        });
      }
      setSaved(p => ({ ...p, [sectionKey]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [sectionKey]: false })), 2000);
    } catch (err: unknown) {
      setError(p => ({ ...p, [sectionKey]: err instanceof Error ? err.message : "Error saving" }));
    } finally {
      setSaving(p => ({ ...p, [sectionKey]: false }));
    }
  }

  return (
    <div>
      <AdminHeader title="Homepage Sections" />
      <div className="space-y-5">
        {SECTION_ORDER.map(key => {
          const meta = SECTION_META[key];
          if (!meta) return null;
          const isCat = meta.type === "categories";
          const selected = catSelections[key] || [];
          const brandVal = brandSelections[key] || "";
          const max = meta.max || 99;

          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1e1e21]">{meta.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{meta.desc}{isCat && meta.max && ` (max ${meta.max})`}</p>
                </div>
                <div className="flex items-center gap-3">
                  {error[key] && <span className="text-xs text-red-500">{error[key]}</span>}
                  {saved[key] && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
                  <button
                    onClick={() => save(key)}
                    disabled={saving[key]}
                    className="px-4 py-1.5 bg-[#f69a39] hover:bg-[#e8880d] text-white text-xs font-medium rounded-lg disabled:opacity-60 transition-colors"
                  >
                    {saving[key] ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div className="p-5">
                {isCat ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {selected.length} of {max} selected
                      </span>
                      {selected.length > 0 && (
                        <button
                          onClick={() => setCatSelections(p => ({ ...p, [key]: [] }))}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-[220px] divide-y divide-gray-50">
                      {cats.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3">No categories found</p>
                      ) : cats.map(c => {
                        const isChecked = selected.includes(c.id);
                        const disabled = !isChecked && selected.length >= max;
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${
                              isChecked ? "bg-[#fff8f0] cursor-pointer" : disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabled}
                              onChange={() => toggleCat(key, c.id, max)}
                              className="accent-[#f69a39] w-3.5 h-3.5 flex-shrink-0"
                            />
                            <span className="text-sm flex-1">
                              <span className="text-gray-300 text-xs">{INDENT[Math.min(c.level, 3)]}</span>
                              <span className={isChecked ? "text-[#1e1e21] font-medium" : "text-gray-600"}>{c.name}</span>
                            </span>
                            {isChecked && (
                              <span className="text-[10px] text-gray-400">#{selected.indexOf(c.id) + 1}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {selected.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selected.map(id => {
                          const cat = cats.find(c => c.id === id);
                          return cat ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f69a39]/10 text-[#f69a39] text-[11px] rounded-full font-medium">
                              {cat.name}
                              <button onClick={() => toggleCat(key, id, max)} className="hover:text-red-500 transition-colors">×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Brand</label>
                    <select
                      value={brandVal}
                      onChange={e => setBrandSelections(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]"
                    >
                      <option value="">— None —</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.brand_name}</option>
                      ))}
                    </select>
                    {brandVal && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        Homepage will show the brand image + 4 most recent products from this brand.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
