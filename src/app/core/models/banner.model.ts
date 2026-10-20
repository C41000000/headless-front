export type BannerTarget = '_self' | '_blank';

export interface BannerDto {
  uuid: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  target: BannerTarget;
  placement: string;
  order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerDto {
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  mobile_image_url?: string | null;
  link_url?: string | null;
  target?: BannerTarget;
  placement?: string;
  order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export type UpdateBannerDto = Partial<CreateBannerDto>;

export interface BannerFiltersDto {
  placement?: string | null;
  is_active?: boolean | null;
}
