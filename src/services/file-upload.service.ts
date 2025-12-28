/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/file-upload.service.ts
import type { AxiosResponse, AxiosProgressEvent } from "axios";
import axiosClient from "../api/axiosClient";

export interface FileResponse {
  id: string;
  filename?: string;
  url?: string;
  // مكمّل حسب ما يعيده السيرفر فعلاً
}

export async function uploadSingleFile(
  declarationId: string,
  file: File,
  documentType: string,
  onProgress?: (percent: number) => void
): Promise<FileResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const url = `/files/${declarationId}/upload`;

  try {
    // هنا نمرر النوعين الصحيحين: T = FileResponse و R = AxiosResponse<FileResponse>
    const response: AxiosResponse<FileResponse> = await axiosClient.post<
      FileResponse,
      AxiosResponse<FileResponse>
    >(url, formData, {
      // لا تضع Content-Type هنا
      onUploadProgress: (progressEvent?: AxiosProgressEvent) => {
        if (!onProgress || !progressEvent) return;
        // AxiosProgressEvent قد يكون undefined أو يحوي loaded/total
        const loaded = progressEvent.loaded ?? 0;
        const total = progressEvent.total ?? 0;
        if (total > 0) {
          const percent = Math.round((loaded / total) * 100);
          onProgress(percent);
        }
      },
    });

    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ??
      err?.response?.data?.error ??
      err?.message ??
      "Upload failed";
    throw new Error(message);
  }
}
