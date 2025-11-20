"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HardDrive } from "lucide-react";
import { _isAdmin, _isLoggedIn } from "@/lib/api/helper";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsLoggedIn(_isLoggedIn());
    setIsAdmin(_isAdmin());
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-blue-600 p-1.5 rounded text-white">
          <HardDrive size={20} />
        </div>
        <span className="font-bold text-xl text-gray-900">SecureShare</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/upload" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
          Upload Mới
        </Link>
        
        {/* Only render dynamic logic after mount to prevent Hydration Error */}
        {mounted && isLoggedIn ? (
          <>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Admin Dashboard
              </Link>
            )}

            <Link href="/dashboard" className="text-sm font-medium text-gray-900 hover:text-gray-700">
              Dashboard
            </Link>
          </>
        ) : (
          // Default view (rendered on Server and initial Client load)
          <>
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Đăng nhập
            </Link>
            <Link 
              href="/auth/register" 
              className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}