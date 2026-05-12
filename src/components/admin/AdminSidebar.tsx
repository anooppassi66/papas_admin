"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard",      href: "/admin/dashboard",       icon: "fa-solid fa-gauge-high" },
  { label: "Stores",         href: "/admin/stores",          icon: "fa-solid fa-store" },
  { label: "Brands",         href: "/admin/brands",          icon: "fa-solid fa-tag" },
  { label: "Categories",     href: "/admin/categories",      icon: "fa-solid fa-folder" },
  { label: "Products",       href: "/admin/products",        icon: "fa-solid fa-box" },
  { label: "Variations",     href: "/admin/product-variants",icon: "fa-solid fa-shuffle" },
  { label: "Vendors",        href: "/admin/vendors",         icon: "fa-solid fa-truck" },
  { label: "Invoices",       href: "/admin/invoices",        icon: "fa-solid fa-file-invoice" },
  { label: "Purchase Lines", href: "/admin/purchase-lines",  icon: "fa-solid fa-clipboard-list" },
  { label: "Inventory",      href: "/admin/inventory",       icon: "fa-solid fa-warehouse" },
  { label: "Services",       href: "/admin/services",        icon: "fa-solid fa-screwdriver-wrench" },
  { label: "P&L Statement",  href: "/admin/profit-loss",     icon: "fa-solid fa-chart-line" },
  { label: "Settings",       href: "/admin/settings",        icon: "fa-solid fa-gear" },
  { label: "Mega Menu",      href: "/admin/mega-menu",       icon: "fa-solid fa-bars" },
  { label: "Banners",        href: "/admin/banners",         icon: "fa-solid fa-image" },
  { label: "Orders",         href: "/admin/orders",          icon: "fa-solid fa-cart-shopping" },
  { label: "Returns",        href: "/admin/returns",         icon: "fa-solid fa-rotate-left" },
  { label: "Blog Posts",     href: "/admin/blogs",           icon: "fa-solid fa-pen-nib" },
  { label: "Blog Categories",href: "/admin/blog-categories", icon: "fa-solid fa-folder-open" },
  { label: "Newsletter",     href: "/admin/newsletter",      icon: "fa-solid fa-envelope" },
  { label: "Gift Cards",     href: "/admin/gift-cards",      icon: "fa-solid fa-gift" },
  { label: "Homepage",       href: "/admin/homepage",        icon: "fa-solid fa-house" },
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
              <i className={`${item.icon} w-5 text-center text-[13px]`} />
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

      {/* Powered by Keydos */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-center gap-2">
        <span className="text-[10px] text-white/70">Powered by</span>
        <Image src="/keydos-logo.webp" alt="Keydos" width={70} height={24} className="opacity-90 hover:opacity-100 transition-opacity" />
      </div>
    </aside>
  );
}
