"use client";

import { Component, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { setAccessToken, setCurrentUser } from "@/lib/api/client";

export default class LoginPage extends Component {
    render() {
        const router = useRouter();
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            try {
                const res = authApi.login({
                    email: email,
                    password,
                });
                // if (email === "test@example.com" && password === "testP455w0rd") {
                //   router.push("/");

                if (!("requireTOTP" in res)) {
                    setAccessToken(res.accessToken);
                    setCurrentUser(res.user);
                    
                    toast.success("Đăng nhập thành công!");

                    router.push("");
                }
                else {
                    toast.error("Invalid credentials. Please try again.");
                }
            } catch (err: any) {
                const msg =
                    err?.response?.data?.message || "Sai thông tin đăng nhập. Vui lòng thử lại.";
                toast.error(msg);
            }
        };
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Đăng nhập</h1>
                        <p className="mt-2 text-gray-500">
                            Chào mừng trở lại! Đăng nhập để quản lý file của bạn.
                        </p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Mail className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 pl-10 pr-4 text-gray-900 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                                placeholder="Email"
                                required
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3 pl-10 pr-4 text-gray-900 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                                placeholder="Mật khẩu"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Đăng nhập
                        </button>
                    </form>
                    <div className="text-center text-gray-500">
                        Chưa có tài khoản?{" "}
                        <Link href="/auth/register" className="font-medium text-blue-600 hover:underline">
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}