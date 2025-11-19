"use client";

import type { ReactNode } from "react";
// import { useAuth } from "@/context/AuthContext";
import NotAdminPage from "./templates/notadmin";
import { _isAdmin, _isLoggedIn } from "@/lib/api/helper";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {

  if (!_isLoggedIn() || !_isAdmin()) {
    return <NotAdminPage />;
  }

  return <>{children}</>;
}
