"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "⊞" },
  { label: "Stores", href: "/admin/stores", icon: "🏪" },
  { label: "Brands", href: "/admin/brands", icon: "🏷" },
  { label: "Categories", href: "/admin/categories", icon: "📁" },
  { label: "Products", href: "/admin/products", icon: "📦" },
  { label: "Variations", href: "/admin/product-variants", icon: "🔀" },
  { label: "Vendors", href: "/admin/vendors", icon: "🚚" },
  { label: "Invoices", href: "/admin/invoices", icon: "🧾" },
  { label: "Purchase Lines", href: "/admin/purchase-lines", icon: "📋" },
  { label: "Inventory", href: "/admin/inventory", icon: "🗃" },
  { label: "Services", href: "/admin/services", icon: "🔧" },
  { label: "P&L Statement", href: "/admin/profit-loss", icon: "📊" },
  { label: "Settings", href: "/admin/settings", icon: "⚙" },
  { label: "Mega Menu", href: "/admin/mega-menu", icon: "☰" },
  { label: "Banners", href: "/admin/banners", icon: "🖼" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-[#1e1e21] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-[#f69a39] font-bold text-xl tracking-wide">PAPAS</div>
        <div className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">Admin Panel</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-[13px] transition-all ${
                active
                  ? "bg-[#f69a39]/15 text-[#f69a39] border-r-2 border-[#f69a39]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-5 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full text-left text-white/40 text-[12px] hover:text-white/70 transition-colors"
        >
          ⎋ Logout
        </button>
      </div>
    </aside>
  );
}
