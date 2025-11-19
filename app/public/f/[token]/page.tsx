"use client";

import React, { useState } from "react";

// Dữ liệu giả lập (hard-code)
const mockMeta = {
    id: "abc123xyz",
    fileName: "Báo cáo tài chính Q3 2025 - Bí mật tuyệt đối.pdf",
    size: 8_543_210,
    mimeType: "application/pdf",
    expiresAt: "2025-12-31T23:59:59Z",
    availableFrom: null,
    passwordProtected: true,
    requiresTotp: false,
};

export default function Page({ params }: { params: { token: string } }) {
    const { token } = params;
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloaded, setDownloaded] = useState(false);

    // Giả lập tải xuống (chỉ để thấy hiệu ứng)
    const download = async () => {
        if (mockMeta.passwordProtected && password !== "123456") {
            setError("Mật khẩu không đúng. Gợi ý: 123456 😉");
            return;
        }

        setLoading(true);
        setError(null);

        // Giả lập delay tải file
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Tạo file giả để download (blob rỗng hoặc file mẫu)
        const fakeContent = `
      Đây là file giả lập cho mockup.
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
        const units = ["B", "KB", "MB", "GB", "TB"];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(1)} ${units[i]}`;
    };

    // Preview giả lập theo loại file
    const renderPreview = () => {
        const type = mockMeta.mimeType;

        if (type.startsWith("image/")) {
            return (
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center text-gray-500">
                    <span>📷 Preview ảnh (kích thước thật: 1920×1080)</span>
                </div>
            );
        }

        if (type.startsWith("video/")) {
            return (
                <div className="bg-black rounded-xl w-full h-96 flex items-center justify-center text-white">
                    <span className="text-6xl">▶️</span>
                    <p className="ml-4 text-xl">Video preview sẽ hiện ở đây</p>
                </div>
            );
        }

        // PDF, text, office...
        return (
            <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-96 flex flex-col items-center justify-center text-gray-600 p-8">
                <div className="text-8xl mb-4">📄</div>
                <p className="text-lg font-medium">Preview không khả dụng</p>
                <p className="text-sm">File PDF, Word, Excel... sẽ được tải về máy</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center py-12 px-4">
            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">File đã được chia sẻ với bạn</h1>
                    <p className="text-gray-600">Nhấn nút tải xuống để nhận file</p>
                </div>

                {/* Thông báo thành công */}
                {downloaded && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg text-center font-medium">
                        ✅ Đã bắt đầu tải file thành công!
                    </div>
                )}

                {/* Lỗi */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Bên trái: Preview */}
                    <div className="order-2 md:order-1">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 text-center font-medium">
                                Xem trước file
                            </div>
                            <div className="p-6">{renderPreview()}</div>
                        </div>
                    </div>

                    {/* Bên phải: Thông tin + Tải xuống */}
                    <div className="order-1 md:order-2">
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {mockMeta.fileName}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                <span className="font-medium">{humanFileSize(mockMeta.size)}</span> •{" "}
                                {mockMeta.mimeType.split("/").pop()?.toUpperCase() || "File"}
                            </p>

                            {mockMeta.expiresAt && (
                                <div className="mb-4 text-sm">
                                    <span className="text-gray-500">Hết hạn:</span>{" "}
                                    <span className="font-medium text-red-600">
                                        {new Date(mockMeta.expiresAt).toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            )}

                            {/* Password input */}
                            {mockMeta.passwordProtected && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🔒 File được bảo vệ bằng mật khẩu
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu (gợi ý: 123456)"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            {/* Nút tải */}
                            <button
                                onClick={download}
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all ${loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    }`}
                            >
                                {loading ? "Đang chuẩn bị file..." : "⬇️ Tải xuống ngay"}
                            </button>

                            {/* Token info nhỏ nhỏ */}
                            <div className="mt-6 text-center text-xs text-gray-500">
                                Token: <code className="bg-gray-100 px-2 py-1 rounded">{token}</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}