"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { label: "New Sale",   href: "/pos/sale",     icon: "fa-solid fa-cash-register" },
  { label: "Sales",      href: "/pos/sales",    icon: "fa-solid fa-receipt" },
  { label: "Orders",     href: "/pos/orders",   icon: "fa-solid fa-cart-shopping" },
  { label: "Products",   href: "/pos/products", icon: "fa-solid fa-box" },
  // { label: "Barcodes",   href: "/pos/barcode",  icon: "fa-solid fa-barcode" },
];

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = useState<{ name: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/pos/login") { setReady(true); return; }
    const token = localStorage.getItem("store_token");
    if (!token) { router.replace("/pos/login"); return; }
    const info = localStorage.getItem("store_info");
    if (info) setStore(JSON.parse(info));
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  if (pathname === "/pos/login") return <>{children}</>;

  function logout() {
    localStorage.removeItem("store_token");
    localStorage.removeItem("store_info");
    router.push("/pos/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-52 bg-[#1e1e21] flex flex-col z-50">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-[#f69a39] font-bold text-lg tracking-wide">PAPAS POS</div>
          <div className="text-white/40 text-[10px] mt-0.5 truncate">{store?.name || "Store"}</div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-[13px] transition-all ${active ? "bg-[#f69a39]/15 text-[#f69a39] border-r-2 border-[#f69a39]" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                <i className={`${item.icon} w-5 text-center text-[13px]`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <button onClick={logout} className="w-full text-left text-white/40 text-[12px] hover:text-white/70 transition-colors">
            <i className="fa-solid fa-right-from-bracket mr-2" />Logout
          </button>
        </div>
      </aside>

      <main className="ml-52 flex-1 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
