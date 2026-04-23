import type {
  CommentRecord,
  CommentsResponse,
  CreateDealInput,
  DealDetailResponse,
  ImageUploadResponse,
  PaginatedDealsResponse
} from "./types";
import { apiBaseUrl } from "./config";
import { getSessionUser } from "./session";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const user = getSessionUser();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-firesale-user-id": user.id,
      "x-firesale-username": user.username,
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Request failed");
  }

  return (await response.json()) as T;
}

export function listDeals(params: {
  cursor?: string;
  lat?: number;
  lng?: number;
  sort: "hot" | "new" | "nearby";
}) {
  const search = new URLSearchParams({ sort: params.sort });
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.lat !== undefined) search.set("lat", String(params.lat));
  if (params.lng !== undefined) search.set("lng", String(params.lng));
  search.set("limit", "12");
  return request<PaginatedDealsResponse>(`/api/deals?${search.toString()}`);
}

export function getDeal(id: string, location?: { lat?: number; lng?: number }) {
  const search = new URLSearchParams();
  if (location?.lat !== undefined) search.set("lat", String(location.lat));
  if (location?.lng !== undefined) search.set("lng", String(location.lng));
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return request<DealDetailResponse>(`/api/deals/${id}${suffix}`);
}

export function createDeal(input: CreateDealInput) {
  return request<{ deal: DealDetailResponse["deal"] }>("/api/deals", {
    method: "POST",
    body: input
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read image."));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export async function uploadDealImage(file: File) {
  const user = getSessionUser();
  const response = await fetch(`${apiBaseUrl}/api/uploads/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-firesale-user-id": user.id,
      "x-firesale-username": user.username
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      data: await readFileAsDataUrl(file)
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "Image upload failed");
  }

  return (await response.json()) as ImageUploadResponse;
}

export function voteDeal(id: string, value: 1 | -1, location?: { lat?: number; lng?: number }) {
  return request<{ deal: DealDetailResponse["deal"] }>(`/api/deals/${id}/vote`, {
    method: "POST",
    body: { value, ...location }
  });
}

export function expireDeal(id: string) {
  return request<{ deal: DealDetailResponse["deal"] }>(`/api/deals/${id}/expire`, {
    method: "POST"
  });
}

export function getComments(id: string) {
  return request<CommentsResponse>(`/api/deals/${id}/comments`);
}

export function addComment(id: string, content: string) {
  return request<{ comment: CommentRecord }>(`/api/deals/${id}/comments`, {
    method: "POST",
    body: { content }
  });
}
