export type Category = "top" | "bottom" | "outerwear" | "shoes" | "accessory";

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  avatar_image_url: string | null;
}

export interface ClothingItemPhoto {
  id: number;
  item_id: number;
  original_url: string | null;
  processed_url: string;
  angle_label: string | null;
  created_at: string;
}

export interface ClothingItem {
  id: number;
  owner_id: number;
  name: string | null;
  original_url: string | null;
  processed_url: string;
  category: Category;
  color: string | null;
  created_at: string;
  photos: ClothingItemPhoto[];
}

export interface UploadResponse {
  item: ClothingItem;
  message: string;
}

export interface TryOnRequest {
  user_id: number;
  top_id?: number;
  bottom_id?: number;
  shoes_id?: number;
  accessory_id?: number;
}

export interface TryOnResponse {
  outfit_id: number;
  generated_image_url: string;
  message: string;
}

export interface ApiErrorShape {
  detail?: string;
  message?: string;
}
