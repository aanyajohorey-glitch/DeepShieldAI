import { API_BASE_URL } from "./constants";
import type { ApiError } from "@/types";

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
