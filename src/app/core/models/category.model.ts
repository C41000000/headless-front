export interface CategoryDto {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  order: number;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  order?: number;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface CategoryFiltersDto {
  search?: string | null;
  is_active?: boolean | null;
}
