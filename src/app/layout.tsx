import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papas Admin Panel",
  description: "Papas Willow Admin Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      </head>
      <body className="antialiased bg-gray-50 text-[#1e1e21]">{children}</body>
    </html>
  );
}
