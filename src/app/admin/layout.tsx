"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setReady(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-56 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
