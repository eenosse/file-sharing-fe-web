"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
import { _isLoggedIn } from "@/lib/api/helper";

interface AuthTOTPLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AuthTOTPLayoutProps) {
    const router = useRouter();
    if (!_isLoggedIn()) {
        router.push("/login");
    }
    return <>{children}</>;
}
