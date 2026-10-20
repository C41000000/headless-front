import { BannerDto } from '@core/models';
import { bannerStatus } from './banner-status';

const base = { is_active: true, starts_at: null, ends_at: null } as BannerDto;
const now = new Date('2026-10-20T12:00:00Z');

describe('bannerStatus', () => {
  it('should follow activation and schedule', () => {
    expect(bannerStatus(base, now)).toBe('live');
    expect(bannerStatus({ ...base, is_active: false }, now)).toBe('inactive');
    expect(bannerStatus({ ...base, starts_at: '2026-11-01T00:00:00Z' }, now)).toBe('scheduled');
    expect(bannerStatus({ ...base, ends_at: '2026-10-01T00:00:00Z' }, now)).toBe('ended');
  });
});
