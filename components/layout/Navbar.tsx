import Link from "next/link";
import { HardDrive } from "lucide-react";

export default function Navbar() {
  // TODO: Integrate with Auth Context (Bảo Minh) to show User Avatar when logged in
  const isLoggedIn = false; 

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
        
        {isLoggedIn ? (
          <Link href="/dashboard" className="text-sm font-medium text-gray-900">
            Dashboard
          </Link>
        ) : (
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