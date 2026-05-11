"use client";
import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { api } from "@/lib/api";

interface Stats {
  stores: number;
  products: number;
  variants: number;
  vendors: number;
  brands: number;
  categories: number;
  invoices: number;
  services: number;
}

const CARD_STYLE = "bg-white rounded-xl p-5 shadow-sm border border-gray-100";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    stores: 0, products: 0, variants: 0, vendors: 0,
    brands: 0, categories: 0, invoices: 0, services: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [stores, products, variants, vendors, brands, categories, invoices] = await Promise.allSettled([
          api.get("/stores"),
          api.get("/products"),
          api.get("/product-variants"),
          api.get("/vendors"),
          api.get("/brands"),
          api.get("/categories"),
          api.get("/invoices"),
        ]);
        setStats({
          stores: stores.status === "fulfilled" ? stores.value.length : 0,
          products: products.status === "fulfilled" ? products.value.length : 0,
          variants: variants.status === "fulfilled" ? variants.value.length : 0,
          vendors: vendors.status === "fulfilled" ? vendors.value.length : 0,
          brands: brands.status === "fulfilled" ? brands.value.length : 0,
          categories: categories.status === "fulfilled" ? categories.value.length : 0,
          invoices: invoices.status === "fulfilled" ? invoices.value.length : 0,
          services: 0,
        });
      } catch (_) {}
    }
    loadStats();
  }, []);

  const cards = [
    { label: "Stores",      value: stats.stores,     icon: "fa-solid fa-store",               color: "bg-orange-50 text-[#f69a39]",  href: "/admin/stores" },
    { label: "Products",    value: stats.products,   icon: "fa-solid fa-box",                 color: "bg-blue-50 text-blue-600",     href: "/admin/products" },
    { label: "Variations",  value: stats.variants,   icon: "fa-solid fa-shuffle",             color: "bg-purple-50 text-purple-600", href: "/admin/product-variants" },
    { label: "Vendors",     value: stats.vendors,    icon: "fa-solid fa-truck",               color: "bg-green-50 text-green-600",   href: "/admin/vendors" },
    { label: "Brands",      value: stats.brands,     icon: "fa-solid fa-tag",                 color: "bg-yellow-50 text-yellow-600", href: "/admin/brands" },
    { label: "Categories",  value: stats.categories, icon: "fa-solid fa-folder",              color: "bg-pink-50 text-pink-600",     href: "/admin/categories" },
    { label: "Invoices",    value: stats.invoices,   icon: "fa-solid fa-file-invoice",        color: "bg-indigo-50 text-indigo-600", href: "/admin/invoices" },
    { label: "Services",    value: stats.services,   icon: "fa-solid fa-screwdriver-wrench",  color: "bg-red-50 text-red-600",       href: "/admin/services" },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className={`${CARD_STYLE} hover:shadow-md transition-shadow cursor-pointer`}>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${c.color} mb-3`}>
              <i className={`${c.icon} text-lg`} />
            </div>
            <div className="text-2xl font-bold text-[#1e1e21]">{c.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={CARD_STYLE}>
          <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: "Add new product", href: "/admin/products" },
              { label: "Create invoice", href: "/admin/invoices" },
              { label: "View P&L Statement", href: "/admin/profit-loss" },
              { label: "Manage banners", href: "/admin/banners" },
              { label: "Update settings", href: "/admin/settings" },
            ].map(({ label, href }) => (
              <a key={href} href={href}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f69a39] transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f69a39]" />
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className={CARD_STYLE}>
          <h3 className="font-semibold text-sm mb-3">System Info</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Backend API</span>
              <span className="text-green-600 font-medium">● Online</span>
            </div>
            <div className="flex justify-between">
              <span>Database</span>
              <span className="text-green-600 font-medium">● Connected</span>
            </div>
            <div className="flex justify-between">
              <span>API Port</span>
              <span className="font-medium">5001</span>
            </div>
            <div className="flex justify-between">
              <span>Admin Port</span>
              <span className="font-medium">4005</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
