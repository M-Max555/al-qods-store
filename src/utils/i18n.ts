import ar from '../locales/ar.json';
import en from '../locales/en.json';

const translations: Record<string, any> = { ar, en };

export function t(key: string): string {
  const lang = localStorage.getItem('alquds_lang') || 'ar';
  
  // Try to find the key in the current language
  let value = translations[lang][key];
  
  // Fallback to Arabic if not found in English
  if (value === undefined && lang === 'en') {
    value = translations['ar'][key];
  }
  
  // Fallback to the key itself if still not found
  return value !== undefined ? value : key;
}

export function getCurrentLang(): string {
  return localStorage.getItem('alquds_lang') || 'ar';
}
