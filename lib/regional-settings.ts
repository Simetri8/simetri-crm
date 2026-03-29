import {
  RegionalDateStyle,
  RegionalHourCycle,
  RegionalSettings,
  RegionalTimeStyle,
  WeekStartsOn,
} from '@/lib/types';

export type EffectiveRegionalSettings = {
  locale: string;
  timeZone: string;
  weekStartsOn: WeekStartsOn;
  dateStyle: RegionalDateStyle;
  timeStyle: RegionalTimeStyle;
  hourCycle: RegionalHourCycle;
};

const FALLBACK_LOCALE = 'tr-TR';
const FALLBACK_TIME_ZONE = 'Europe/Istanbul';
const FALLBACK_WEEK_START: WeekStartsOn = 1;
const FALLBACK_DATE_STYLE: RegionalDateStyle = 'medium';
const FALLBACK_TIME_STYLE: RegionalTimeStyle = 'short';
const FALLBACK_HOUR_CYCLE: RegionalHourCycle = 'h23';

export const DATE_STYLE_OPTIONS: Array<{ value: RegionalDateStyle; label: string }> = [
  { value: 'short', label: 'Kısa' },
  { value: 'medium', label: 'Orta' },
  { value: 'long', label: 'Uzun' },
  { value: 'full', label: 'Tam' },
];

export const TIME_STYLE_OPTIONS: Array<{ value: RegionalTimeStyle; label: string }> = [
  { value: 'short', label: 'Kısa' },
  { value: 'medium', label: 'Orta' },
  { value: 'long', label: 'Uzun' },
  { value: 'full', label: 'Tam' },
];

export const HOUR_CYCLE_OPTIONS: Array<{ value: RegionalHourCycle; label: string }> = [
  { value: 'h11', label: '12 saat (0-11)' },
  { value: 'h12', label: '12 saat (1-12)' },
  { value: 'h23', label: '24 saat (0-23)' },
  { value: 'h24', label: '24 saat (1-24)' },
];

export const WEEK_START_OPTIONS: Array<{ value: WeekStartsOn; label: string }> = [
  { value: 1, label: 'Pazartesi' },
  { value: 0, label: 'Pazar' },
  { value: 6, label: 'Cumartesi' },
];

function normalizeWeekStart(value: number | null | undefined): WeekStartsOn | undefined {
  if (value === 0 || value === 1 || value === 6) return value;
  return undefined;
}

function normalizeHourCycle(value: string | null | undefined): RegionalHourCycle | undefined {
  if (value === 'h11' || value === 'h12' || value === 'h23' || value === 'h24') return value;
  return undefined;
}

function normalizeDateStyle(value: string | null | undefined): RegionalDateStyle | undefined {
  if (value === 'short' || value === 'medium' || value === 'long' || value === 'full') return value;
  return undefined;
}

function normalizeTimeStyle(value: string | null | undefined): RegionalTimeStyle | undefined {
  if (value === 'short' || value === 'medium' || value === 'long' || value === 'full') return value;
  return undefined;
}

function safeLocale(candidate: string | null | undefined): string | undefined {
  if (!candidate) return undefined;
  try {
    return Intl.getCanonicalLocales(candidate)[0];
  } catch {
    return undefined;
  }
}

function safeTimeZone(candidate: string | null | undefined): string | undefined {
  if (!candidate) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return undefined;
  }
}

export function getWeekStartFromLocale(locale: string): WeekStartsOn {
  try {
    const localeInfo = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    const firstDay = localeInfo.weekInfo?.firstDay;
    if (firstDay === 7) return 0;
    if (firstDay === 6) return 6;
    if (firstDay === 1) return 1;
  } catch {
    // ignore and use fallback below
  }

  if (locale.toLowerCase().startsWith('en-us')) return 0;
  return FALLBACK_WEEK_START;
}

export function getBrowserRegionalDefaults(): Partial<EffectiveRegionalSettings> {
  const browserLocale =
    typeof navigator !== 'undefined' && navigator.language ? safeLocale(navigator.language) : undefined;
  const timeZone =
    typeof Intl !== 'undefined'
      ? safeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      : undefined;
  const hourCycle =
    typeof Intl !== 'undefined'
      ? normalizeHourCycle(Intl.DateTimeFormat().resolvedOptions().hourCycle)
      : undefined;

  return {
    locale: browserLocale,
    timeZone,
    weekStartsOn: browserLocale ? getWeekStartFromLocale(browserLocale) : undefined,
    hourCycle,
  };
}

export function resolveRegionalSettings(overrides?: RegionalSettings | null): EffectiveRegionalSettings {
  const browserDefaults = getBrowserRegionalDefaults();
  const locale =
    safeLocale(overrides?.locale) ??
    browserDefaults.locale ??
    FALLBACK_LOCALE;
  const timeZone =
    safeTimeZone(overrides?.timeZone) ??
    browserDefaults.timeZone ??
    FALLBACK_TIME_ZONE;
  const weekStartsOn =
    normalizeWeekStart(overrides?.weekStartsOn ?? undefined) ??
    browserDefaults.weekStartsOn ??
    getWeekStartFromLocale(locale);
  const dateStyle =
    normalizeDateStyle(overrides?.dateStyle) ??
    FALLBACK_DATE_STYLE;
  const timeStyle =
    normalizeTimeStyle(overrides?.timeStyle) ??
    FALLBACK_TIME_STYLE;
  const hourCycle =
    normalizeHourCycle(overrides?.hourCycle) ??
    browserDefaults.hourCycle ??
    FALLBACK_HOUR_CYCLE;

  return {
    locale,
    timeZone,
    weekStartsOn,
    dateStyle,
    timeStyle,
    hourCycle,
  };
}

export function formatDateWithSettings(date: Date, settings: EffectiveRegionalSettings): string {
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: settings.dateStyle,
    timeZone: settings.timeZone,
  }).format(date);
}

export function formatTimeWithSettings(date: Date, settings: EffectiveRegionalSettings): string {
  return new Intl.DateTimeFormat(settings.locale, {
    timeStyle: settings.timeStyle,
    hourCycle: settings.hourCycle,
    timeZone: settings.timeZone,
  }).format(date);
}

export function formatDateTimeWithSettings(date: Date, settings: EffectiveRegionalSettings): string {
  return new Intl.DateTimeFormat(settings.locale, {
    dateStyle: settings.dateStyle,
    timeStyle: settings.timeStyle,
    hourCycle: settings.hourCycle,
    timeZone: settings.timeZone,
  }).format(date);
}

export function compactRegionalSettings(
  settings: RegionalSettings
): Partial<RegionalSettings> {
  const compacted: Partial<RegionalSettings> = {};

  if (settings.locale) compacted.locale = settings.locale;
  if (settings.timeZone) compacted.timeZone = settings.timeZone;
  if (settings.weekStartsOn === 0 || settings.weekStartsOn === 1 || settings.weekStartsOn === 6) {
    compacted.weekStartsOn = settings.weekStartsOn;
  }
  if (settings.dateStyle) compacted.dateStyle = settings.dateStyle;
  if (settings.timeStyle) compacted.timeStyle = settings.timeStyle;
  if (settings.hourCycle) compacted.hourCycle = settings.hourCycle;

  return compacted;
}
