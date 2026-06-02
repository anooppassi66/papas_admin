"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import SearchableSelect from "@/components/admin/SearchableSelect";
import StatusBadge from "@/components/admin/StatusBadge";
import { api, UPLOADS } from "@/lib/api";

interface Blog {
  id: number; category_id: number | null; category_name: string | null;
  title: string; slug: string; description: string;
  image: string | null; is_active: boolean; created_at: string;
}
interface BlogCategory { id: number; name: string; }

const EMPTY = { category_id: "" as string | number, title: "", description: "" };

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [cats, setCats] = useState<BlogCategory[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api.get("/blogs"), api.get("/blog-categories")]);
      setBlogs(b as Blog[]); setCats(c as BlogCategory[]);
    } catch (_) {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null); setError(""); setModal(true);
  }
  function openEdit(b: Blog) {
    setEditing(b);
    setForm({ category_id: b.category_id ?? "", title: b.title, description: b.description || "" });
    setImageFile(null);
    setImagePreview(b.image ? `${UPLOADS}${b.image}` : null);
    setError(""); setModal(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category_id", String(form.category_id));
      if (imageFile) fd.append("image", imageFile);
      if (editing) await api.put(`/blogs/${editing.id}`, fd);
      else await api.post("/blogs", fd);
      setModal(false); load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  async function toggle(id: number) { await api.patch(`/blogs/${id}/toggle`); load(); }

  function excerpt(text: string) {
    return text.length > 80 ? text.slice(0, 80) + "…" : text;
  }

  return (
    <div>
      <AdminHeader
        title="Blog Posts"
        action={<button onClick={openAdd} className="bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">+ Add Blog</button>}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1e1e21] text-white">
            <tr>{["Image", "Title", "Category", "Date", "Status", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {blogs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No blog posts yet</td></tr>
            ) : blogs.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {b.image ? (
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                      <Image src={`${UPLOADS}${b.image}`} alt={b.title} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="font-medium text-[#1e1e21] truncate">{b.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{excerpt(b.description || "")}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{b.category_name || "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(b.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3"><StatusBadge active={!!b.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(b)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={() => toggle(b.id)} className={`text-xs font-medium ${b.is_active ? "text-red-500" : "text-green-600"}`}>
                      {b.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? "Edit Blog Post" : "Add Blog Post"} onClose={() => setModal(false)} wide>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Blog Category</label>
                <SearchableSelect
                  value={form.category_id}
                  onChange={v => setForm({ ...form, category_id: v })}
                  placeholder="— No category —"
                  options={[{ value: "", label: "— No category —" }, ...cats.map(c => ({ value: String(c.id), label: c.name }))]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Blog Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Blog Image {editing && "(leave blank to keep current)"}
              </label>
              {imagePreview && (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 mb-2">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="128px" />
                  <button type="button"
                    onClick={() => { setImageFile(null); setImagePreview(editing?.image ? `${UPLOADS}${editing.image}` : null); }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 transition-colors">
                    ×
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#f69a39]/10 file:text-[#f69a39] file:text-xs file:font-medium" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Blog Content *</label>
              <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={12} placeholder="Write your blog content here. Use blank lines to separate paragraphs."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f69a39] resize-y font-mono" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-[#f69a39] hover:bg-[#e8880d] text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {loading ? "Saving…" : editing ? "Update" : "Publish"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
