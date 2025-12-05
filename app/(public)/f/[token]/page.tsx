"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    getFileByToken,
    downloadFile,
    loadFilePreview,
    canPreviewFile,
    formatFileSize,
} from "@/lib/api/fileService";
import type { FileInfo } from "@/lib/components/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

export default function Page() {
    const params = useParams();
    const { token } = params as { token: string };
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloaded, setDownloaded] = useState(false);
    const [countdown, setCountdown] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [canPreview, setCanPreview] = useState(false);

    // Fetch file info on mount
    useEffect(() => {
        const fetchFileInfo = async () => {
            try {
                const data = await getFileByToken(token);
                setFileInfo(data);
                setCanPreview(canPreviewFile(data.mimeType));
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchFileInfo();
    }, [token]);

    // Countdown timer for pending files
    useEffect(() => {
        if (!fileInfo || fileInfo.status !== "pending" || !fileInfo.availableFrom) return;

        const availableFromDate = new Date(fileInfo.availableFrom);
        const timer = setInterval(() => {
            const diff = (availableFromDate.getTime() - new Date().getTime()) / 1000;

            if (diff <= 0) {
                setCountdown("Đang mở…");
                window.location.reload();
                return;
            }

            const d = Math.floor(diff / 86400);
            const h = Math.floor((diff % 86400) / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = Math.floor(diff % 60);

            if (d > 0) {
                setCountdown(`${d}d ${h}h ${m}m ${s}s`);
            } else {
                setCountdown(`${h}h ${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [fileInfo]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Copy link
    const copyLink = () => {
        const link = `${window.location.origin}/f/${token}`;
        navigator.clipboard.writeText(link);
        alert("Đã copy link chia sẻ!");
    };

    // -------------------------------
    // XỬ LÝ 3 TRẠNG THÁI FILE
    // -------------------------------
    const isExpired = fileInfo?.status === "expired";
    const isPending = fileInfo?.status === "pending";
    const isActive = fileInfo?.status === "active";

    // Load preview
    const loadPreview = async () => {
        if (!fileInfo || !canPreview || !isActive) return;
        if (fileInfo.hasPassword && password === "") return;

        setPreviewLoading(true);
        try {
            const url = await loadFilePreview(token, password);
            setPreviewUrl(url);
            setPreviewLoading(false);
        } catch (err: any) {
            setPreviewLoading(false);
        }
    };

    // --- UI Preview ---
    const renderPreview = () => {
        if (!canPreview) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                    <div className="text-8xl mb-4">📄</div>
                    <p className="text-lg font-medium">{fileInfo?.fileName}</p>
                    <p className="text-sm text-gray-500 mt-2">Preview không khả dụng cho loại file này</p>
                </div>
            );
        }

        if (!isActive) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                    <div className="text-8xl mb-4">🔒</div>
                    <p className="text-lg font-medium">Preview không khả dụng</p>
                    <p className="text-sm text-gray-500 mt-2">
                        {isPending ? "File chưa đến thời gian mở khóa" : "File đã hết hạn"}
                    </p>
                </div>
            );
        }

        if (fileInfo?.hasPassword && password === "" && !previewUrl) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                    <div className="text-8xl mb-4">🔐</div>
                    <p className="text-lg font-medium">Nhập mật khẩu để xem preview</p>
                </div>
            );
        }

        if (!previewUrl && !previewLoading) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                    <div className="text-8xl mb-4">👁️</div>
                    <Button
                        onClick={loadPreview}
                        variant="primary"
                    >
                        Tải Preview
                    </Button>
                </div>
            );
        }

        if (previewLoading) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                    <div className="text-8xl mb-4 animate-pulse">⏳</div>
                    <p className="text-lg font-medium">Đang tải preview...</p>
                </div>
            );
        }

        if (!previewUrl) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                    <div className="text-8xl mb-4">📄</div>
                    <p className="text-lg font-medium">Preview không khả dụng</p>
                </div>
            );
        }

        const mime = fileInfo?.mimeType || "";

        // Image preview
        if (mime.startsWith("image/")) {
            return (
                <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
                    <img
                        src={previewUrl}
                        alt={fileInfo?.fileName}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            );
        }

        // Video preview
        if (mime.startsWith("video/")) {
            return (
                <div className="w-full h-[600px] bg-black rounded-xl overflow-hidden">
                    <video
                        src={previewUrl}
                        controls
                        className="w-full h-full"
                    >
                        Trình duyệt không hỗ trợ video preview
                    </video>
                </div>
            );
        }

        // Audio preview
        if (mime.startsWith("audio/")) {
            return (
                <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center p-8">
                    <div className="text-8xl mb-8">🎵</div>
                    <audio src={previewUrl} controls className="w-full max-w-md">
                        Trình duyệt không hỗ trợ audio preview
                    </audio>
                    <p className="text-sm text-gray-600 mt-4">{fileInfo?.fileName}</p>
                </div>
            );
        }

        // PDF preview
        if (mime === "application/pdf") {
            return (
                <div className="w-full h-[600px] rounded-xl overflow-hidden">
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title="PDF Preview"
                    >
                        Trình duyệt không hỗ trợ PDF preview
                    </iframe>
                </div>
            );
        }

        // Text preview
        if (mime.startsWith("text/")) {
            return (
                <div className="bg-gray-50 rounded-xl w-full h-[600px] overflow-auto p-4">
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title="Text Preview"
                    >
                        Trình duyệt không hỗ trợ text preview
                    </iframe>
                </div>
            );
        }

        return (
            <div className="bg-gray-50 border-2 border-dashed rounded-xl w-full h-[600px] flex flex-col items-center justify-center text-gray-600 p-8">
                <div className="text-8xl mb-4">📄</div>
                <p className="text-lg font-medium">Preview không khả dụng</p>
            </div>
        );
    };

    if (loading || !fileInfo) {
        return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (error && !fileInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="max-w-md">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </Card>
            </div>
        );
    }

    // Download
    const download = async () => {
        if (!isActive) return;

        if (fileInfo.hasPassword && password === "") {
            setError("Vui lòng nhập mật khẩu.");
            return;
        }

        setDownloadLoading(true);
        setError(null);

        try {
            await downloadFile(token, fileInfo.fileName, password);
            setDownloaded(true);
            setPassword("");
        } catch (err: any) {
            if (err.message === "AUTH_REQUIRED") {
                setError("Yêu cầu đăng nhập. File này chỉ chia sẻ với một số người dùng cụ thể.");
                setTimeout(() => {
                    window.location.href = `/login?redirect=/f/${token}`;
                }, 2000);
            } else {
                setError(err.message);
            }
        } finally {
            setDownloadLoading(false);
        }
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
                    <Alert
                        type="success"
                        message="Đã bắt đầu tải file thành công!"
                        className="mb-6 text-center font-medium"
                    />
                )}

                {/* ERROR */}
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        className="mb-6"
                    />
                )}

                <div className="grid md:grid-cols-2 gap-8">

                    {/* LEFT PREVIEW */}
                    <div className="order-2 md:order-1">
                        <Card header="Xem trước file">
                            {renderPreview()}
                        </Card>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="order-1 md:order-2">
                        <Card>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {fileInfo.fileName}
                            </h2>

                            <p className="text-gray-600 mb-4">
                                {formatFileSize(fileInfo.fileSize ?? 0)} • {fileInfo.mimeType || "File"}
                            </p>

                            {/* FILE STATUS */}
                            <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isActive ? 'bg-green-100 text-green-800' :
                                    isPending ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {isActive ? '🟢 Khả dụng' : isPending ? '🟡 Chưa mở' : '🔴 Hết hạn'}
                                </span>
                            </div>

                            {/* COPY LINK */}
                            <Button
                                onClick={copyLink}
                                variant="secondary"
                                className="mb-4 w-full cursor-pointer"
                            >
                                📋 Copy Link Chia Sẻ
                            </Button>

                            {/* EXPIRY INFO */}
                            {fileInfo.availableTo && (
                                <p className="text-sm text-gray-600 mb-6">
                                    {isExpired ? "Đã hết hạn" : "Hết hạn"}:{" "}
                                    <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                                        {new Date(fileInfo.availableTo).toLocaleString("vi-VN")}
                                    </span>
                                </p>
                            )}

                            {/* 3 TRẠNG THÁI FILE */}
                            {isExpired && (
                                <div className="p-4 bg-red-100 text-red-700 rounded-lg font-medium text-center">
                                    🔴 File đã hết hạn.
                                </div>
                            )}

                            {isPending && (
                                <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-center">
                                    🟡 Chưa đến thời gian mở khóa<br />
                                    {fileInfo.availableFrom && (
                                        <div className="text-sm mt-1 mb-2">
                                            Khả dụng từ: {new Date(fileInfo.availableFrom).toLocaleString("vi-VN")}
                                        </div>
                                    )}
                                    <div className="text-lg mt-2">{countdown}</div>
                                </div>
                            )}

                            {isActive && (
                                <>
                                    {/* PASSWORD */}
                                    {fileInfo.hasPassword && (
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            label="🔒 File được bảo vệ bằng mật khẩu"
                                            placeholder="Nhập mật khẩu..."
                                            className="mb-6"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    download();
                                                }
                                            }}
                                        />
                                    )}

                                    {/* DOWNLOAD BTN */}
                                    <Button
                                        onClick={download}
                                        loading={downloadLoading}
                                        variant="primary"
                                        size="lg"
                                        className="w-full cursor-pointer"
                                    >
                                        ⬇️ Tải xuống
                                    </Button>
                                </>
                            )}

                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
