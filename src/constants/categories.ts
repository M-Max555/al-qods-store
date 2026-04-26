export const CATEGORIES = {
  appliances: "الأجهزة الكهربائية",
  kitchen: "لوازم المطبخ",
  furniture: "الأثاث",
  decor: "المفروشات",
  home_supplies: "لوازم المنزل",
  offers: "العروض"
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([key, label]) => ({
  key,
  label
}));

export function getCategoryLabel(key: string): string {
  return CATEGORIES[key as CategoryKey] || key;
}

export function mapOldCategoryToKey(oldCat: string): string {
  const mapping: Record<string, string> = {
    "الأجهزة الكهربائية": "appliances",
    "لوازم المطابخ": "kitchen",
    "لوازم المطبخ": "kitchen",
    "الأثاث": "furniture",
    "المفروشات": "decor",
    "لوازم المنزل": "home_supplies",
    "home_supplies": "home_supplies",
    "العروض": "offers",
    "تجهيز العرائس": "furniture",
    "uncategorized": "uncategorized"
  };
  return mapping[oldCat] || oldCat;
}
