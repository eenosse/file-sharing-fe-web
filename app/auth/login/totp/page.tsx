"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { setAccessToken, setCurrentUser } from "@/lib/api/helper";
import LoginTotpForm, {
  LoginTotpFormData,
} from "@/components/auth/LoginTotpForm";

function LoginTotpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [formData, setFormData] = useState<LoginTotpFormData>({
    code: "",
  });
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("No email provided for TOTP verification.");
      router.push("/auth/login");
    }
  }, [email, router]);

  const updateField = (field: keyof LoginTotpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await authApi.loginTotp({
        email,
        code: formData.code,
      });

      if ("accessToken" in res) {
        setAccessToken(res.accessToken);
        setCurrentUser(res.user);
        toast.success("Đăng nhập thành công!");
        router.push("/");
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Sai mã TOTP hoặc đã hết hạn. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <LoginTotpForm
      email={email}
      formData={formData}
      updateField={updateField}
      handleSubmit={handleSubmit}
      verifying={verifying}
    />
  );
}

export default function LoginTotpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginTotpPageContent />
    </Suspense>
  );
}
