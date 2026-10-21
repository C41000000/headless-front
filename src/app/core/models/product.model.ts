import { CategoryDto } from './category.model';

export interface ProductDto {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  stock: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  category?: CategoryDto | null;
  category_uuid?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDto {
  name: string;
  price: number;
  slug?: string;
  description?: string | null;
  promotional_price?: number | null;
  stock?: number;
  sku?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  category_uuid?: string | null;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductFiltersDto {
  search?: string | null;
  category_uuid?: string | null;
  category_slug?: string | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  page?: number;
}
