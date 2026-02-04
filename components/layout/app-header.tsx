'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { useTheme } from "next-themes";

type HeaderState = {
  title?: string;
  description?: string;
};

type AppHeaderContextValue = {
  header: HeaderState;
  setHeader: (value: HeaderState) => void;
};

const AppHeaderContext = createContext<AppHeaderContextValue | undefined>(undefined);

export function AppHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<HeaderState>({});

  return (
    <AppHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </AppHeaderContext.Provider>
  );
}

export function useAppHeader() {
  const ctx = useContext(AppHeaderContext);
  if (!ctx) {
    throw new Error("useAppHeader sadece AppHeaderProvider içinde kullanılabilir");
  }
  return ctx;
}

export function PageHeader({ title, description }: HeaderState) {
  const { setHeader } = useAppHeader();

  useEffect(() => {
    setHeader({ title, description });
    return () => setHeader({});
  }, [title, description, setHeader]);

  // Görsel çıktı üretmiyoruz, sadece header state'ini güncelliyoruz
  return null;
}

export function AppHeader() {
  const { header } = useAppHeader();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mb-0 flex justify-between">
      <div className="flex min-w-0 pb-2 gap-2">
        <SidebarTrigger />
        {header.title && (
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight">
              {header.title}
            </h1>
            {header.description && (
              <p className="truncate text-sm text-muted-foreground">
                {header.description}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-4">
        <div className="hidden gap-2 md:flex">
          <ThemeSwitcher
            value={theme as "light" | "dark" | "system"}
            onChange={(t) => setTheme(t)}
          />
        </div>
        <div className="md:hidden">
          <ThemeSwitcher
            value={theme as "light" | "dark" | "system"}
            onChange={(t) => setTheme(t)}
          />
        </div>
      </div>
    </div>
  );
}

