import { API_BASE_URL } from "./constants";
import type { ApiError, DetectionHistoryResponse, DetectionResult } from "@/types";

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown>;
  token?: string | null;
}

/**
 * Thin fetch wrapper for the DeepShield AI FastAPI backend. Centralizes the
 * base URL, JSON handling, and error normalization so future phases can add
 * endpoints without re-deriving this plumbing.
 */
export async function apiFetch<T>(
  path: string,
  { body, token, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody?.detail) message = errorBody.detail;
    } catch {
      // Response body was not JSON; fall back to the generic message.
    }
    throw new ApiRequestError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

interface UploadVideoHandle {
  promise: Promise<DetectionResult>;
  abort: () => void;
}

/**
 * Uploads a video for deepfake analysis via XMLHttpRequest (rather than
 * fetch) so we can report real upload progress and support cancellation —
 * neither of which the fetch API exposes for request bodies.
 */
export function uploadVideo(file: File, token: string, onProgress?: (percent: number) => void): UploadVideoHandle {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);

  const promise = new Promise<DetectionResult>((resolve, reject) => {
    xhr.open("POST", `${API_BASE_URL}/detection/analyze`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as DetectionResult);
        } catch {
          reject(new ApiRequestError(xhr.status, "Received an invalid response from the server."));
        }
        return;
      }

      let message = `Request failed with status ${xhr.status}`;
      try {
        const errorBody = JSON.parse(xhr.responseText) as ApiError;
        if (errorBody?.detail) message = errorBody.detail;
      } catch {
        // Response body was not JSON; fall back to the generic message.
      }
      reject(new ApiRequestError(xhr.status, message));
    };

    xhr.onerror = () => reject(new ApiRequestError(0, "Network error — the backend may be unavailable."));
    xhr.onabort = () => reject(new ApiRequestError(0, "Upload cancelled."));
    xhr.ontimeout = () => reject(new ApiRequestError(0, "The request timed out."));

    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

export function getDetectionHistory(token: string, limit = 20, offset = 0) {
  return apiFetch<DetectionHistoryResponse>(`/detection/history?limit=${limit}&offset=${offset}`, { token });
}

export function getDetectionById(token: string, id: number) {
  return apiFetch<DetectionResult>(`/detection/${id}`, { token });
}

export function deleteDetectionById(token: string, id: number) {
  return apiFetch<void>(`/detection/${id}`, { method: "DELETE", token });
}

/**
 * Fetches the server-generated PDF report as a blob (auth requires a
 * header, so this can't be a plain `<a href>` link) and triggers a download.
 */
export async function downloadPdfReport(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/detection/${id}/report/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody?.detail) message = errorBody.detail;
    } catch {
      // Response body was not JSON; fall back to the generic message.
    }
    throw new ApiRequestError(response.status, message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `deepshield-report-DS-${String(id).padStart(6, "0")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
