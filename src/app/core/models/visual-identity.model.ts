export interface VisualIdentityDto {
  uuid: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  font_family: string | null;
  custom_css: string | null;
  updated_at: string;
}

export interface UpdateVisualIdentityDto {
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  favicon_url?: string | null;
  font_family?: string | null;
  custom_css?: string | null;
}
