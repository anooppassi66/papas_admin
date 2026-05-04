"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem { id: number; title: string; slug: string; data: string; sort_order: number; is_active: boolean }
interface BuilderItem { id: string; label: string; href: string; depth: number } // depth 0 = heading, 1 = link
interface Category { id: number; name: string; slug: string; parent_id: number | null; level: number; parent_name: string | null }
interface Product { id: number; name: string; slug: string; brand_name: string }

const genId = () => Math.random().toString(36).slice(2, 9);

// Build full URL path from category + parent chain
function buildCatPath(cat: Category, map: Map<number, Category>): string {
  const segs: string[] = [];
  let cur: Category | undefined = cat;
  while (cur) { segs.unshift(cur.slug); cur = cur.parent_id != null ? map.get(cur.parent_id) : undefined; }
  return "/" + segs.join("/");
}

// Parse stored data JSON → BuilderItems
function parseData(raw: string | object): BuilderItem[] {
  try {
    const d = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (d?.version === 2 && Array.isArray(d.items)) return d.items;
    // Migrate v1 cols → v2
    if (d?.cols) {
      const items: BuilderItem[] = [];
      for (const col of d.cols) {
        if (col.heading) items.push({ id: genId(), label: col.heading, href: "", depth: 0 });
        for (const l of col.links ?? []) items.push({ id: genId(), label: l.label, href: l.href, depth: 1 });
      }
      return items;
    }
    return [];
  } catch { return []; }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MegaMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editing, setEditing]     = useState<MenuItem | null>(null);
  const [builder, setBuilder]     = useState<BuilderItem[]>([]);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    try { setMenuItems(await api.get("/mega-menu")); } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(item: MenuItem) {
    setEditing(item);
    setBuilder(parseData(item.data));
  }

  async function saveMenu() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/mega-menu/${editing.id}`, {
        title: editing.title, slug: editing.slug, sort_order: editing.sort_order,
        data: { version: 2, items: builder },
      });
      setEditing(null);
      load();
    } catch (_) {} finally { setSaving(false); }
  }

  async function toggleActive(id: number) { await api.patch(`/mega-menu/${id}/toggle`); load(); }
  async function deleteMenu(id: number) {
    if (!confirm("Delete this menu item?")) return;
    await api.delete(`/mega-menu/${id}`); load();
  }

  async function createNew() {
    const title = prompt('Menu title — must exactly match a nav label (e.g. "Bats", "Shoes"):');
    if (!title?.trim()) return;
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await api.post("/mega-menu", { title: title.trim(), slug, data: { version: 2, items: [] }, sort_order: 0 });
    load();
  }

  // ── Builder view ─────────────────────────────────────────────────────────
  if (editing) {
    return (
      <Builder
        menuItem={editing}
        items={builder}
        onChange={setBuilder}
        onSave={saveMenu}
        onBack={() => setEditing(null)}
        saving={saving}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div>
      <AdminHeader
        title="Mega Menu"
        action={
          <button onClick={createNew} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            + New Menu Item
          </button>
        }
      />

      <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">How it works</p>
        <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-600">
          <li>Create a menu item. <strong>Title must match the nav label exactly</strong> — e.g. <code>Bats</code>, <code>Shoes</code>, <code>Helmets</code>.</li>
          <li>Click <strong>Edit Menu</strong> to open the visual builder — add categories, products or custom links.</li>
          <li><strong>Section Headings</strong> become column titles. <strong>Indented items</strong> become clickable links inside that column.</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Title", "Items", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {menuItems.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                No mega menu items yet — create one above
              </td></tr>
            ) : menuItems.map(m => {
              let count = 0;
              try { const d = typeof m.data === "string" ? JSON.parse(m.data) : m.data; count = d?.items?.length ?? 0; } catch {}
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{count} items</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${m.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-green-500" : "bg-red-400"}`} />
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(m)} className="text-[#f69a39] hover:text-[#e8880d] text-xs font-semibold">Edit Menu</button>
                      <button onClick={() => toggleActive(m.id)} className={`text-xs font-medium ${m.is_active ? "text-orange-500" : "text-green-600"}`}>
                        {m.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => deleteMenu(m.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Visual builder ─────────────────────────────────────────────────────────────
function Builder({
  menuItem, items, onChange, onSave, onBack, saving,
}: {
  menuItem: MenuItem;
  items: BuilderItem[];
  onChange: (items: BuilderItem[]) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [categories, setCategories]     = useState<Category[]>([]);
  const [products, setProducts]         = useState<Product[]>([]);
  const [catSearch, setCatSearch]       = useState("");
  const [prodSearch, setProdSearch]     = useState("");
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [selectedProds, setSelectedProds] = useState<number[]>([]);
  const [customLabel, setCustomLabel]   = useState("");
  const [customHref, setCustomHref]     = useState("");
  const [panel, setPanel]               = useState<"cats" | "prods" | "custom">("cats");
  const catMap = useRef(new Map<number, Category>());

  useEffect(() => {
    api.get("/categories").then((cats: Category[]) => {
      setCategories(cats);
      catMap.current = new Map(cats.map((c: Category) => [c.id, c]));
    }).catch(() => {});
    api.get("/products").then((prods: Product[]) => setProducts(prods)).catch(() => {});
  }, []);

  // Filtered lists
  const filteredCats  = categories.filter(c => !catSearch  || c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredProds = products.filter(p  => !prodSearch  || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.brand_name?.toLowerCase().includes(prodSearch.toLowerCase()));

  // ── Add items ────────────────────────────────────────────────────────────
  function addCats() {
    const newItems = categories.filter(c => selectedCats.includes(c.id)).map(c => ({
      id: genId(), label: c.name, href: buildCatPath(c, catMap.current), depth: 1,
    }));
    onChange([...items, ...newItems]);
    setSelectedCats([]);
  }

  function addProds() {
    const newItems = products.filter(p => selectedProds.includes(p.id)).map(p => ({
      id: genId(), label: p.name, href: `/products/${p.slug}`, depth: 1,
    }));
    onChange([...items, ...newItems]);
    setSelectedProds([]);
  }

  function addCustom() {
    if (!customLabel.trim()) return;
    onChange([...items, { id: genId(), label: customLabel.trim(), href: customHref.trim(), depth: 1 }]);
    setCustomLabel(""); setCustomHref("");
  }

  function addHeading() {
    onChange([...items, { id: genId(), label: "New Section", href: "", depth: 0 }]);
  }

  // ── Mutate items ──────────────────────────────────────────────────────────
  function update(id: string, field: "label" | "href", val: string) {
    onChange(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const arr = [...items];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  }

  function setDepth(id: string, d: 0 | 1) {
    onChange(items.map(i => i.id === id ? { ...i, depth: d } : i));
  }

  function remove(id: string) { onChange(items.filter(i => i.id !== id)); }

  // ── Columns preview ───────────────────────────────────────────────────────
  const previewCols: { heading: string; href: string; links: { label: string; href: string }[] }[] = [];
  let cur: (typeof previewCols)[0] | null = null;
  for (const item of items) {
    if (item.depth === 0) { cur = { heading: item.label, href: item.href, links: [] }; previewCols.push(cur); }
    else if (cur) cur.links.push({ label: item.label, href: item.href });
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={`Edit Menu: ${menuItem.title}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button onClick={onSave} disabled={saving}
              className="bg-[#f69a39] hover:bg-[#e8880d] disabled:opacity-60 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors">
              {saving ? "Saving…" : "Save Menu"}
            </button>
          </div>
        }
      />

      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Left panel ── */}
        <div className="w-[270px] flex-shrink-0 flex flex-col gap-3">

          {/* Panel tabs */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(["cats", "prods", "custom"] as const).map((p, i) => (
                <button key={p} onClick={() => setPanel(p)}
                  className={`flex-1 text-xs py-2.5 font-medium transition-colors border-b-2 -mb-px ${panel === p ? "border-[#f69a39] text-[#f69a39]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  {["Categories", "Products", "Custom Link"][i]}
                </button>
              ))}
            </div>

            <div className="p-3">
              {/* Categories panel */}
              {panel === "cats" && (
                <>
                  <input value={catSearch} onChange={e => setCatSearch(e.target.value)}
                    placeholder="Search categories…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-2 outline-none focus:border-[#f69a39]" />
                  <div className="max-h-[260px] overflow-y-auto space-y-0.5 mb-3">
                    {filteredCats.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No categories</p>}
                    {filteredCats.map(c => (
                      <label key={c.id} className="flex items-start gap-2 px-1 py-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input type="checkbox" checked={selectedCats.includes(c.id)}
                          onChange={() => setSelectedCats(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                          className="mt-0.5 rounded border-gray-300" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-800 truncate">{c.name}</p>
                          {c.parent_name && <p className="text-[10px] text-gray-400">{c.parent_name}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                  <button onClick={addCats} disabled={!selectedCats.length}
                    className="w-full py-1.5 bg-[#1e1e21] text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-opacity">
                    Add to Menu ({selectedCats.length})
                  </button>
                </>
              )}

              {/* Products panel */}
              {panel === "prods" && (
                <>
                  <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-2 outline-none focus:border-[#f69a39]" />
                  <div className="max-h-[260px] overflow-y-auto space-y-0.5 mb-3">
                    {filteredProds.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No products</p>}
                    {filteredProds.map(p => (
                      <label key={p.id} className="flex items-start gap-2 px-1 py-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input type="checkbox" checked={selectedProds.includes(p.id)}
                          onChange={() => setSelectedProds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                          className="mt-0.5 rounded border-gray-300" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.brand_name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button onClick={addProds} disabled={!selectedProds.length}
                    className="w-full py-1.5 bg-[#1e1e21] text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-opacity">
                    Add to Menu ({selectedProds.length})
                  </button>
                </>
              )}

              {/* Custom link panel */}
              {panel === "custom" && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">URL</label>
                    <input value={customHref} onChange={e => setCustomHref(e.target.value)}
                      placeholder="/cricket/bats"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#f69a39]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Link Text</label>
                    <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                      placeholder="e.g. Gray-Nicolls Bats"
                      onKeyDown={e => e.key === "Enter" && addCustom()}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#f69a39]" />
                  </div>
                  <button onClick={addCustom} disabled={!customLabel.trim()}
                    className="w-full py-1.5 bg-[#1e1e21] text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-opacity">
                    Add to Menu
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add section heading button */}
          <button onClick={addHeading}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 text-xs text-gray-400 rounded-xl hover:border-[#f69a39] hover:text-[#f69a39] transition-colors font-medium">
            + Add Section Heading
          </button>

          {/* Legend */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1.5">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#f69a39] flex-shrink-0" /><span>Section heading → column title</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-gray-300 flex-shrink-0" /><span>Indented item → link in column</span></div>
            <p className="text-gray-400 pt-1">Use ← → to indent/unindent items</p>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 overflow-auto p-4 flex flex-col gap-4">

          {/* Menu structure */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#1e1e21]">Menu Structure</p>
              <p className="text-xs text-gray-400">{items.length} items</p>
            </div>

            {items.length === 0 ? (
              <div className="border-2 border-dashed border-gray-100 rounded-xl h-48 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <p className="text-sm">No items yet</p>
                <p className="text-xs mt-0.5">Add items from the left panel</p>
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item, idx) => (
                  <div key={item.id}
                    style={{ marginLeft: item.depth === 1 ? 36 : 0 }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors group ${
                      item.depth === 0 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}>

                    {/* Type dot */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.depth === 0 ? "bg-[#f69a39]" : "bg-gray-400"}`} />

                    {/* Label */}
                    <input value={item.label} onChange={e => update(item.id, "label", e.target.value)}
                      className={`flex-1 min-w-0 text-xs bg-transparent outline-none ${item.depth === 0 ? "font-semibold text-[#1e1e21]" : "text-gray-700"}`}
                      placeholder="Link text" />

                    {/* URL */}
                    <input value={item.href} onChange={e => update(item.id, "href", e.target.value)}
                      className="w-[200px] text-xs text-gray-400 bg-transparent outline-none font-mono border-b border-transparent focus:border-gray-300 shrink-0"
                      placeholder={item.depth === 0 ? "URL (optional)" : "/path/to/page"} />

                    {/* Controls */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Indent toggle */}
                      <button title={item.depth === 0 ? "Make sub-item (→)" : "Make heading (←)"}
                        onClick={() => setDepth(item.id, item.depth === 0 ? 1 : 0)}
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[#f69a39] hover:bg-orange-50 transition-colors text-[10px] font-bold">
                        {item.depth === 0 ? "→" : "←"}
                      </button>
                      {/* Up */}
                      <button onClick={() => move(idx, -1)} disabled={idx === 0}
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[#1e1e21] disabled:opacity-20 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      {/* Down */}
                      <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[#1e1e21] disabled:opacity-20 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {/* Delete */}
                      <button onClick={() => remove(item.id)}
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live preview */}
          {previewCols.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Mega Menu Preview</p>
              <div className="bg-[#1a1a1a] rounded-xl p-5 flex gap-8 flex-wrap overflow-x-auto">
                {previewCols.map((col, i) => (
                  <div key={i} className="min-w-[130px]">
                    <p className="text-[12px] font-bold text-[#f69a39] border-b border-[#f69a39] pb-1 mb-2 whitespace-nowrap">{col.heading || "—"}</p>
                    {col.links.map((l, j) => (
                      <div key={j} className="text-[11px] text-white border border-[#444] px-2 py-1 mb-1 whitespace-nowrap">{l.label}</div>
                    ))}
                    {col.links.length === 0 && <p className="text-[10px] text-gray-600 italic">No links yet</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
