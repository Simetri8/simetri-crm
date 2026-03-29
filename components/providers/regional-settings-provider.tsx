'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { userService } from '@/lib/firebase/users';
import { RegionalSettings } from '@/lib/types';
import {
  compactRegionalSettings,
  EffectiveRegionalSettings,
  formatDateTimeWithSettings,
  formatDateWithSettings,
  formatTimeWithSettings,
  resolveRegionalSettings,
} from '@/lib/regional-settings';

type RegionalSettingsContextValue = {
  loading: boolean;
  regionalSettings: RegionalSettings | null;
  effectiveSettings: EffectiveRegionalSettings;
  refresh: () => Promise<void>;
  saveSettings: (settings: RegionalSettings) => Promise<void>;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
};

const RegionalSettingsContext = createContext<RegionalSettingsContextValue | undefined>(undefined);

export function RegionalSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regionalSettings, setRegionalSettings] = useState<RegionalSettings | null>(null);

  const effectiveSettings = useMemo(
    () => resolveRegionalSettings(regionalSettings),
    [regionalSettings]
  );

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setRegionalSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const settings = await userService.getUserRegionalSettings(user.uid);
      setRegionalSettings(settings);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSettings = useCallback(
    async (settings: RegionalSettings) => {
      if (!user?.uid) return;
      const compacted = compactRegionalSettings(settings);
      await userService.updateUserRegionalSettings(user.uid, compacted);
      setRegionalSettings(compacted);
    },
    [user?.uid]
  );

  const contextValue = useMemo<RegionalSettingsContextValue>(
    () => ({
      loading,
      regionalSettings,
      effectiveSettings,
      refresh,
      saveSettings,
      formatDate: (date) => formatDateWithSettings(date, effectiveSettings),
      formatTime: (date) => formatTimeWithSettings(date, effectiveSettings),
      formatDateTime: (date) => formatDateTimeWithSettings(date, effectiveSettings),
    }),
    [loading, regionalSettings, effectiveSettings, refresh, saveSettings]
  );

  return (
    <RegionalSettingsContext.Provider value={contextValue}>
      {children}
    </RegionalSettingsContext.Provider>
  );
}

export function useRegionalSettings() {
  const context = useContext(RegionalSettingsContext);
  if (!context) {
    throw new Error('useRegionalSettings must be used within RegionalSettingsProvider');
  }
  return context;
}
