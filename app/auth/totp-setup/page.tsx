"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/api/helper";

export default function TotpSetupPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchTotpSetup = async () => {
      const token = getAccessToken();

      if (!token) {
        toast.error("You must be logged in to set up TOTP.");
        router.push("/auth/login");
        return;
      }

      try {
        setLoading(true);
        const data = await authApi.setupTotp();
        setQrCode(data.toptSetup.qrCode);
        setSecret(data.toptSetup.secret);
        setError(null);
      } catch (err: any) {
        const msg = err?.response?.data?.message || "Failed to fetch TOTP setup information.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchTotpSetup();
  }, [router]);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const res = await authApi.verifyTotp({ code: totpCode });
      if (res.toptEnabled) {
        toast.success("Two-Factor Authentication enabled successfully!");
        router.push("/"); // Redirect to dashboard or home
      } else {
        throw new Error(res.message || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid TOTP code. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg">Loading Security Setup...</p>
      </div>
    );
  }

  if (error && !qrCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">Error</p>
        <p className="mb-4">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Go back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Set Up Two-Factor Authentication</h1>
          <p className="mt-2 text-gray-500">
            Scan the QR code with your authenticator app.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="p-4 bg-white border rounded-lg">
            {qrCode ? (
              <img src={qrCode} alt="TOTP QR Code" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse"></div>
            )}
          </div>
          <div className="text-center">
            <p className="text-gray-600">Or enter this key manually:</p>
            <div className="mt-2 font-mono tracking-widest text-lg bg-gray-100 text-gray-800 px-4 py-2 rounded-md inline-block">
              {secret || "LOADING..."}
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleVerify}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <KeyRound className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="totpCode"
              name="totpCode"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="w-full py-3 pl-10 pr-4 text-gray-900 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="6-digit code"
              required
              maxLength={6}
              pattern="\\d{6}"
            />
          </div>
          
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 flex items-center justify-center"
            disabled={verifying || totpCode.length !== 6}
          >
            {verifying && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Verify & Enable
          </button>
        </form>
      </div>
    </div>
  );
}
