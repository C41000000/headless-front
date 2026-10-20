export interface BannerDto {
  uuid: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  target: '_self' | '_blank';
  placement: string;
  order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerDto {
  title: string;
  subtitle?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  link_url?: string | null;
  target?: '_self' | '_blank';
  placement: string;
  order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface UpdateBannerDto {
  title?: string;
  subtitle?: string | null;
  image_url?: string;
  mobile_image_url?: string | null;
  link_url?: string | null;
  target?: '_self' | '_blank';
  placement?: string;
  order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}
