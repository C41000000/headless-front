import { BannerDto } from '@core/models';

export type BannerStatus = 'live' | 'scheduled' | 'ended' | 'inactive';

export const BANNER_STATUS_LABELS: Record<BannerStatus, string> = {
  live: 'No ar',
  scheduled: 'Agendado',
  ended: 'Encerrado',
  inactive: 'Inativo',
};

/** Mesma regra do scope `active` do backend: ativo e dentro da vigência. */
export function bannerStatus(banner: BannerDto, now: Date = new Date()): BannerStatus {
  if (!banner.is_active) {
    return 'inactive';
  }
  if (banner.starts_at && new Date(banner.starts_at) > now) {
    return 'scheduled';
  }
  if (banner.ends_at && new Date(banner.ends_at) < now) {
    return 'ended';
  }
  return 'live';
}

/** Posições sugeridas no formulário (o campo aceita qualquer texto até 50 caracteres). */
export const SUGGESTED_PLACEMENTS = ['home', 'sidebar', 'footer', 'checkout'];
