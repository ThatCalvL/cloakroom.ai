import { API_BASE_URL } from "@/lib/config";
import type {
  ApiErrorShape,
  ClothingItem,
  TryOnRequest,
  TryOnResponse,
  UploadResponse,
  UserResponse,
} from "@/lib/types";

class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const typed = payload as ApiErrorShape;
  return typed.detail ?? typed.message ?? fallback;
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: { absolute?: boolean },
): Promise<T> {
  const url = options?.absolute ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(0, "Network error while calling API.");
  }

  const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, toErrorMessage(payload, `Request failed (${response.status})`));
  }

  return payload as T;
}

export async function fetchHealth(): Promise<boolean> {
  const payload = await apiRequest<{ status: string }>("/health");
  return payload.status === "ok";
}

export async function bootstrapUser(
  email: string,
  fullName: string,
  avatarImageUrl?: string,
): Promise<UserResponse> {
  return apiRequest<UserResponse>("/api/users/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      full_name: fullName,
      avatar_image_url: avatarImageUrl ?? null,
    }),
  });
}

export async function uploadItem(ownerId: number, file: File, itemName?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("owner_id", String(ownerId));
  formData.append("file", file);
  if (itemName && itemName.trim()) {
    formData.append("item_name", itemName.trim());
  }

  return apiRequest<UploadResponse>("/api/upload/", {
    method: "POST",
    body: formData,
  });
}

export async function fetchCloset(ownerId: number): Promise<ClothingItem[]> {
  return apiRequest<ClothingItem[]>(`/api/closet/${ownerId}`);
}

export async function updateItemName(itemId: number, name: string): Promise<ClothingItem> {
  return apiRequest<ClothingItem>(`/api/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function addItemPhotos(
  itemId: number,
  files: FileList | File[],
  angleLabel?: string,
): Promise<ClothingItem> {
  const formData = new FormData();
  const normalizedFiles = Array.from(files);
  for (const file of normalizedFiles) {
    formData.append("files", file);
  }
  if (angleLabel && angleLabel.trim()) {
    formData.append("angle_label", angleLabel.trim());
  }

  return apiRequest<ClothingItem>(`/api/items/${itemId}/photos`, {
    method: "POST",
    body: formData,
  });
}

export async function generateTryOn(payload: TryOnRequest): Promise<TryOnResponse> {
  return apiRequest<TryOnResponse>("/api/tryon/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function toAssetUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) {
    return "";
  }
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${API_BASE_URL}${pathOrUrl}`;
}

export { ApiError };
