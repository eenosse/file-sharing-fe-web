import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar"; // (Code ở phần Bonus bên dưới)
import Footer from "@/components/layout/Footer"; // (Code ở phần Bonus bên dưới)
import { Toaster } from "sonner"; // Hoặc thư viện toast bạn chọn

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecureShare - Chia sẻ file bảo mật",
  description: "Hệ thống chia sẻ file an toàn, tự hủy và bảo mật 2 lớp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* THÊM class "antialiased bg-gray-50 text-gray-900" VÀO ĐÂY */}
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-gray-50 text-gray-900`}>
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}