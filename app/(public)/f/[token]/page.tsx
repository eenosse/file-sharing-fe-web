"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// Dữ liệu giả lập (hard-code)
const mockMeta = {
    id: "abc123xyz",
    fileName: "File Sharing Backend API Documentation.pdf",
    size: 194_560,
    mimeType: "application/pdf",
    expiresAt: "2025-12-31T23:59:59Z",      // ← Đặt "2025-11-19T00:00:00Z" để test expired
    availableFrom: null,                    // ← Đặt "2025-11-22T12:00:00Z" để test pending
    passwordProtected: true,
    requiresTotp: false,
    uploadedBy: "me.dev"
};

export default function Page() {
    const params = useParams();
    const { token } = params as { token: string };
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloaded, setDownloaded] = useState(false);

    // Countdown cho trạng thái Pending
    const [countdown, setCountdown] = useState("");

    // Copy link
    const copyLink = () => {
        const link = `${window.location.origin}/public/f/${token}`;
        navigator.clipboard.writeText(link);
        alert("Đã copy link chia sẻ!");
    };

    // -------------------------------
    // XỬ LÝ 3 TRẠNG THÁI FILE
    // -------------------------------
    const now = new Date();
    const expiresAt = new Date(mockMeta.expiresAt);
    const availableFrom = mockMeta.availableFrom ? new Date(mockMeta.availableFrom) : null;

    const isExpired = now > expiresAt;
    const isPending = availableFrom && now < availableFrom;
    const isActive = !isExpired && !isPending;

    useEffect(() => {
        if (!isPending) return;

        const timer = setInterval(() => {
            const diff = (availableFrom!.getTime() - new Date().getTime()) / 1000;

            if (diff <= 0) {
                setCountdown("Đang mở…");
                return;
            }

            const d = Math.floor(diff / 86400);                  // ngày
            const h = Math.floor((diff % 86400) / 3600);         // giờ
            const m = Math.floor((diff % 3600) / 60);            // phút
            const s = Math.floor(diff % 60);                     // giây

            if (d > 0) {
                setCountdown(`${d}d ${h}h ${m}m ${s}s`);
            } else {
                setCountdown(`${h}h ${m}m ${s}s`);
            }

        }, 1000);

        return () => clearInterval(timer);
    }, [isPending]);


    // Download mô phỏng
    const hardPassword = "123456";

    const download = async () => {
        if (!isActive) return;

        if (mockMeta.passwordProtected && password !== hardPassword) {
            setDownloaded(false);
            setError("Mật khẩu không đúng.");
            return;
        }

        setLoading(true);
        setError(null);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const fakeContent = `
Tên file: ${mockMeta.fileName}
Token: ${token}
Thời gian: ${new Date().toLocaleString()}
        `;
        const blob = new Blob([fakeContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = mockMeta.fileName;
        a.click();
        URL.revokeObjectURL(url);

        setDownloaded(true);
        setLoading(false);
    };

    const humanFileSize = (bytes: number) => {
        const units = ["B", "KB", "MB", "GB"];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(1)} ${units[i]}`;
    };

    // --- UI Preview ---
    const renderPreview = () => {
        return (
            <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-96 flex flex-col items-center justify-center text-gray-600 p-8">
                <div className="text-8xl mb-4">📄</div>
                <p className="text-lg font-medium">Preview không khả dụng</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-5xl">

                {/* HEADER */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        File được chia sẻ với bạn
                    </h1>
                    <p className="text-gray-600">Token: {token}</p>
                </div>

                {/* SUCCESS */}
                {downloaded && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg text-center font-medium">
                        ✅ Đã bắt đầu tải file thành công!
                    </div>
                )}

                {/* ERROR */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">

                    {/* LEFT PREVIEW */}
                    <div className="order-2 md:order-1">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="bg-indigo-600 text-white p-4 text-center font-medium">
                                Xem trước file
                            </div>
                            <div className="p-6">{renderPreview()}</div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="order-1 md:order-2">
                        <div className="bg-white rounded-2xl shadow-xl p-8">

                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {mockMeta.fileName}
                            </h2>

                            <p className="text-gray-600 mb-4">
                                {humanFileSize(mockMeta.size)} • {mockMeta.mimeType}
                            </p>

                            {/* USER BY */}
                            <p className="text-sm text-gray-500 mb-4">
                                👤 Uploaded by: <span className="font-medium">{mockMeta.uploadedBy}</span>
                            </p>

                            {/* COPY LINK */}
                            <button
                                onClick={copyLink}
                                className="mb-4 w-full py-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                            >
                                📋 Copy Link Chia Sẻ
                            </button>

                            {/* EXPIRES */}
                            {isExpired && (<p className="text-sm text-gray-600 mb-6">
                                Hết hạn:{" "}
                                <span className="font-medium text-red-600">
                                    {new Date(mockMeta.expiresAt).toLocaleString("vi-VN")}
                                </span>
                            </p>)}

                            {/* 3 TRẠNG THÁI FILE */}
                            {isExpired && (
                                <div className="p-4 bg-red-100 text-red-700 rounded-lg font-medium text-center">
                                    🔴 File đã hết hạn và bị xóa.
                                </div>
                            )}

                            {isPending && (
                                <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-center">
                                    🟡 Chưa đến thời gian mở khóa<br />
                                    <div className="text-lg mt-2">{countdown}</div>
                                </div>
                            )}

                            {isActive && (
                                <>
                                    {/* PASSWORD */}
                                    {mockMeta.passwordProtected && (
                                        <div className="mb-6">
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2"
                                                placeholder="Nhập mật khẩu..."
                                            />
                                        </div>
                                    )}

                                    {/* DOWNLOAD BTN */}
                                    <button
                                        onClick={download}
                                        disabled={loading}
                                        className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-all 
                                            ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}
                                        `}
                                    >
                                        {loading ? "Đang chuẩn bị..." : "⬇️ Tải xuống"}
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
