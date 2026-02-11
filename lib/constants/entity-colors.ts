/**
 * Merkezi entity renk sistemi
 * Proje genelinde tutarlı renk kullanımı için tek kaynak
 */

export type EntityType = 'contact' | 'company' | 'deal' | 'work-order' | 'request';

export type EntityColorConfig = {
  hex: string;
  label: string;
  tailwind: {
    bg: string;
    text: string;
    darkBg: string;
    darkText: string;
  };
};

export const ENTITY_COLORS: Record<EntityType, EntityColorConfig> = {
  contact: {
    hex: '#22c55e',
    label: 'Kişi',
    tailwind: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      darkBg: 'dark:bg-green-900',
      darkText: 'dark:text-green-400',
    },
  },
  company: {
    hex: '#3b82f6',
    label: 'Şirket',
    tailwind: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      darkBg: 'dark:bg-blue-900',
      darkText: 'dark:text-blue-400',
    },
  },
  deal: {
    hex: '#a855f7',
    label: 'Fırsat',
    tailwind: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      darkBg: 'dark:bg-purple-900',
      darkText: 'dark:text-purple-400',
    },
  },
  'work-order': {
    hex: '#f97316',
    label: 'İş Emri',
    tailwind: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      darkBg: 'dark:bg-orange-900',
      darkText: 'dark:text-orange-400',
    },
  },
  request: {
    hex: '#ef4444',
    label: 'Talep',
    tailwind: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      darkBg: 'dark:bg-red-900',
      darkText: 'dark:text-red-400',
    },
  },
} as const;

/**
 * Helper: Hex rengi döndürür
 */
export function getEntityHexColor(type: EntityType): string {
  return ENTITY_COLORS[type].hex;
}

/**
 * Helper: Tailwind sınıflarını döndürür
 */
export function getEntityTailwindClasses(type: EntityType, includeDark = true): string {
  const config = ENTITY_COLORS[type].tailwind;
  if (includeDark) {
    return `${config.bg} ${config.text} ${config.darkBg} ${config.darkText}`;
  }
  return `${config.bg} ${config.text}`;
}

/**
 * Helper: Label döndürür
 */
export function getEntityLabel(type: EntityType): string {
  return ENTITY_COLORS[type].label;
}
