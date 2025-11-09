import { LanguageCode } from './i18n';

// Cookie utility functions
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/`;
}

export function getLanguageFromCookie(): LanguageCode {
  const saved = getCookie('mark6-language');
  if (saved === 'en' || saved === 'zh-TW') {
    return saved;
  }
  return 'en';
}

export function setLanguageCookie(lang: LanguageCode) {
  setCookie('mark6-language', lang);
}