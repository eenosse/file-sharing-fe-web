import { uploadClient } from "@/lib/api/client";

export interface UploadFileResponse {
  fileId: string;
  fileName: string;
  shareLink: string;
  availableFrom?: string;
  availableTo?: string;
  sharedWith?: string[];
  expiresAt?: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type AxiosErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

function isAxiosErrorLike(error: unknown): error is AxiosErrorLike {
  return typeof error === "object" && error !== null && "response" in error;
}

export async function uploadFile(formData: FormData): Promise<UploadFileResponse> {
  try {
    return await uploadClient.post<UploadFileResponse>("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
  } catch (error: unknown) {
    if (isAxiosErrorLike(error)) {
      const status = error.response?.status ?? 500;
      const data = error.response?.data;
      const message =
        typeof data === "object" && data !== null && "message" in data && typeof (data as { message?: unknown }).message === "string"
          ? String((data as { message?: unknown }).message)
          : "Upload file thất bại";

      throw new ApiError(status, message, data);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    const fallbackMessage = error instanceof Error ? error.message : "Upload file thất bại";
    throw new ApiError(500, fallbackMessage, error);
  }
}