export const APP_NAME = 'Programador VMC';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', route: '/', icon: 'LayoutDashboard' },
  { labelKey: 'nav.publishers', route: '/publishers', icon: 'Users' },
  { labelKey: 'nav.meetings', route: '/weeks', icon: 'CalendarDays' },
  { labelKey: 'nav.history', route: '/history', icon: 'Clock' },
  { labelKey: 'nav.attendants', route: '/attendants', icon: 'Shield' },
  { labelKey: 'nav.settings', route: '/settings', icon: 'Settings' },
] as const;
