'use client';

import { useEffect, useMemo, useState } from 'react';
import { Globe, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/app-header';
import { useRegionalSettings } from '@/components/providers/regional-settings-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DATE_STYLE_OPTIONS,
  HOUR_CYCLE_OPTIONS,
  TIME_STYLE_OPTIONS,
  WEEK_START_OPTIONS,
} from '@/lib/regional-settings';
import { RegionalDateStyle, RegionalHourCycle, RegionalTimeStyle, WeekStartsOn } from '@/lib/types';
import { toast } from 'sonner';

const SYSTEM_VALUE = '__system__';
const FIXED_LOCALE = 'tr-TR';
const COMMON_TIME_ZONES = [
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'Asia/Dubai',
  'Asia/Tokyo',
];

const WEEK_START_LABELS: Record<WeekStartsOn, string> = {
  0: 'Pazar',
  1: 'Pazartesi',
  6: 'Cumartesi',
};

type FormState = {
  locale: string;
  timeZone: string;
  weekStartsOn: string;
  dateStyle: string;
  timeStyle: string;
  hourCycle: string;
};

export default function SettingsPage() {
  const { loading, regionalSettings, effectiveSettings, formatDateTime, saveSettings } = useRegionalSettings();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    locale: FIXED_LOCALE,
    timeZone: SYSTEM_VALUE,
    weekStartsOn: SYSTEM_VALUE,
    dateStyle: SYSTEM_VALUE,
    timeStyle: SYSTEM_VALUE,
    hourCycle: SYSTEM_VALUE,
  });

  useEffect(() => {
    setForm({
      locale: FIXED_LOCALE,
      timeZone: regionalSettings?.timeZone ?? SYSTEM_VALUE,
      weekStartsOn:
        regionalSettings?.weekStartsOn === 0 || regionalSettings?.weekStartsOn === 1 || regionalSettings?.weekStartsOn === 6
          ? String(regionalSettings.weekStartsOn)
          : SYSTEM_VALUE,
      dateStyle: regionalSettings?.dateStyle ?? SYSTEM_VALUE,
      timeStyle: regionalSettings?.timeStyle ?? SYSTEM_VALUE,
      hourCycle: regionalSettings?.hourCycle ?? SYSTEM_VALUE,
    });
  }, [regionalSettings]);

  const supportedTimeZones = useMemo(() => {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      const values = Intl.supportedValuesOf('timeZone');
      return Array.from(new Set([...COMMON_TIME_ZONES, ...values]));
    }
    return COMMON_TIME_ZONES;
  }, []);

  const dateStyleLabel =
    DATE_STYLE_OPTIONS.find((item) => item.value === effectiveSettings.dateStyle)?.label ??
    effectiveSettings.dateStyle;
  const timeStyleLabel =
    TIME_STYLE_OPTIONS.find((item) => item.value === effectiveSettings.timeStyle)?.label ??
    effectiveSettings.timeStyle;
  const hourCycleLabel =
    HOUR_CYCLE_OPTIONS.find((item) => item.value === effectiveSettings.hourCycle)?.label ??
    effectiveSettings.hourCycle;
  const weekStartLabel = WEEK_START_LABELS[effectiveSettings.weekStartsOn] ?? String(effectiveSettings.weekStartsOn);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({
        locale: FIXED_LOCALE,
        timeZone: form.timeZone === SYSTEM_VALUE ? null : form.timeZone,
        weekStartsOn:
          form.weekStartsOn === SYSTEM_VALUE
            ? null
            : (Number(form.weekStartsOn) as WeekStartsOn),
        dateStyle:
          form.dateStyle === SYSTEM_VALUE
            ? null
            : (form.dateStyle as RegionalDateStyle),
        timeStyle:
          form.timeStyle === SYSTEM_VALUE
            ? null
            : (form.timeStyle as RegionalTimeStyle),
        hourCycle:
          form.hourCycle === SYSTEM_VALUE
            ? null
            : (form.hourCycle as RegionalHourCycle),
      });
      toast.success('Bölgesel ayarlar kaydedildi');
    } catch (error) {
      console.error('Regional settings save error', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bölgesel Ayarlar"
        description="Varsayılan olarak sistem ayarları kullanılır. İsterseniz aşağıdaki alanlarla kullanıcı bazlı override tanımlayabilirsiniz."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Globe className="h-5 w-5" />
            Tarih, Saat ve Bölge Tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Locale</p>
              <Select value={form.locale} disabled>
                <SelectTrigger disabled>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIXED_LOCALE}>{FIXED_LOCALE}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Kullanılan: {effectiveSettings.locale}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Saat Dilimi</p>
              <Select value={form.timeZone} onValueChange={(value) => setForm((prev) => ({ ...prev, timeZone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SYSTEM_VALUE}>Sistem varsayılanı</SelectItem>
                  {supportedTimeZones.map((timeZone) => (
                    <SelectItem key={timeZone} value={timeZone}>
                      {timeZone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Kullanılan: {effectiveSettings.timeZone}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Haftanın İlk Günü</p>
              <Select value={form.weekStartsOn} onValueChange={(value) => setForm((prev) => ({ ...prev, weekStartsOn: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SYSTEM_VALUE}>Sistem varsayılanı</SelectItem>
                  {WEEK_START_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={String(item.value)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Kullanılan: {weekStartLabel}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tarih Formatı</p>
              <Select value={form.dateStyle} onValueChange={(value) => setForm((prev) => ({ ...prev, dateStyle: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SYSTEM_VALUE}>Sistem varsayılanı</SelectItem>
                  {DATE_STYLE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Kullanılan: {dateStyleLabel}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Saat Formatı</p>
              <Select value={form.timeStyle} onValueChange={(value) => setForm((prev) => ({ ...prev, timeStyle: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SYSTEM_VALUE}>Sistem varsayılanı</SelectItem>
                  {TIME_STYLE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Kullanılan: {timeStyleLabel}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">12/24 Saat Döngüsü</p>
              <Select value={form.hourCycle} onValueChange={(value) => setForm((prev) => ({ ...prev, hourCycle: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SYSTEM_VALUE}>Sistem varsayılanı</SelectItem>
                  {HOUR_CYCLE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Kullanılan: {hourCycleLabel}</p>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Canlı Önizleme</p>
            <p className="text-muted-foreground">{formatDateTime(new Date())}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Etkin ayarlar: {effectiveSettings.locale} / {effectiveSettings.timeZone}
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
