"use client";

import { Component, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";

// Mock API response for demonstration
// In a real app, this would be fetched from your API
const MOCK_API_RESPONSE = {
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/SecureShare:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SecureShare",
  secretKey: "JBSWY3DPEHPK3PXP",
};

export default class TotpSetupPage extends Component {
  render() {
    const router = useRouter();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secretKey, setSecretKey] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
      const fetchTotpSetup = async () => {
        const token = Cookies.get("authToken");

        if (!token) {
          router.push("/auth/login");
          return;
        }

        try {
          setLoading(true);
          // In a real application, you would make a POST request here
          // const response = await fetch("/api/auth/topt/setup", {
          //   method: "POST",
          //   headers: {
          //     "Authorization": `Bearer ${token}`,
          //   },
          // });

          // if (!response.ok) {
          //   throw new Error("Failed to fetch TOTP setup information.");
          // }

          // const data = await response.json();
          
          // Using mock data for now
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
          const data = MOCK_API_RESPONSE;

          setQrCodeUrl(data.qrCodeUrl);
          setSecretKey(data.secretKey);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred.");
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
        // Mock verification logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (totpCode === "123456") { // Replace with actual verification against your backend
          alert("TOTP setup successful!");
          router.push("/dashboard"); // Redirect to a protected page
        } else {
          throw new Error("Invalid TOTP code. Please try again.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.");
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

    if (error && !qrCodeUrl) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600">
          <ShieldAlert className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold">Error</p>
          <p className="mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Go back to Dashboard
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
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="TOTP QR Code" width={200} height={200} />
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse"></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-gray-600">Or enter this key manually:</p>
              <div className="mt-2 font-mono tracking-widest text-lg bg-gray-100 text-gray-800 px-4 py-2 rounded-md inline-block">
                {secretKey || "LOADING..."}
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
                pattern="\d{6}"
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
}
