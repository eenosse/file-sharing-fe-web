import axios from "axios";
import type { FileInfo } from "@/lib/components/schemas";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/*
 * Lấy thông tin file theo share token
 */
export async function getFileByToken(token: string): Promise<FileInfo> {
    try {
        const tokenRes = await axios.get(`${apiBase}/files/${token}`);
        const fileId = tokenRes.data.file.id;

        const config: any = { headers: {} };
        const authToken = localStorage.getItem("token");
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        const infoRes = await axios.get(`${apiBase}/files/info/${fileId}`, config);
        return infoRes.data.file;
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 404) {
            throw new Error("File không tồn tại");
        } else if (status === 410) {
            throw new Error("File đã hết hạn");
        } else {
            throw new Error(error.response?.data?.message || "Không thể tải thông tin file");
        }
    }
}

/*
 * Tải xuống file theo token
 */
export async function downloadFile(
    token: string,
    fileName: string,
    password?: string
): Promise<void> {
    try {
        let downloadUrl = `${apiBase}/files/${token}/download`;
        if (password) {
            downloadUrl += `?password=${encodeURIComponent(password)}`;
        }

        const config: any = {
            responseType: "blob",
            headers: {},
        };

        const authToken = localStorage.getItem("token");
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        const res = await axios.get(downloadUrl, config);

        // Create download link
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 401) {
            throw new Error("AUTH_REQUIRED");
        } else if (status === 403) {
            if (message?.includes("password")) {
                throw new Error("Mật khẩu không chính xác");
            } else if (message?.includes("not allowed") || message?.includes("shared list")) {
                throw new Error("Bạn không có quyền tải file này. Email của bạn không nằm trong danh sách chia sẻ.");
            } else {
                throw new Error(message || "Không có quyền truy cập");
            }
        } else if (status === 404) {
            throw new Error("File không tồn tại");
        } else if (status === 410) {
            throw new Error("File đã hết hạn");
        } else if (status === 423) {
            throw new Error("File chưa đến thời gian khả dụng");
        } else {
            throw new Error(message || "Lỗi tải file");
        }
    }
}

/*
 * Tải preview file
 */
export async function loadFilePreview(
    token: string,
    password?: string
): Promise<string> {
    try {
        let previewUrl = `${apiBase}/files/${token}/download`;
        if (password) {
            previewUrl += `?password=${encodeURIComponent(password)}`;
        }

        const config: any = {
            responseType: "blob",
            headers: {},
        };

        const authToken = localStorage.getItem("token");
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        const res = await axios.get(previewUrl, config);
        return URL.createObjectURL(res.data);
    } catch (error: any) {
        throw new Error("Không thể tải preview");
    }
}

/*
 * Kiểm tra file có thể preview được không
 */
export function canPreviewFile(mimeType?: string): boolean {
    if (!mimeType) return false;

    return (
        mimeType.startsWith("image/") ||
        mimeType.startsWith("video/") ||
        mimeType.startsWith("audio/") ||
        mimeType === "application/pdf" ||
        mimeType.startsWith("text/")
    );
}

/*
 * Format file size
 */
export function formatFileSize(bytes: number = 0): string {
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
}
