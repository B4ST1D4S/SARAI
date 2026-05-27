import { useState, useEffect } from 'react';

export type ThemeId = 'dark' | 'premium-light' | 'soft-medical' | 'executive-ai';

const STORAGE_KEY = 'sarai-theme';
const EVENT_NAME  = 'sarai-theme-change';

/** Aplica el tema guardado en localStorage al elemento <html> */
export function initTheme() {
  const id = (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'dark';
  document.documentElement.setAttribute('data-theme', id);
}

/** Hook para leer y cambiar el tema activo */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() =>
    (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'dark'
  );

  useEffect(() => {
    const handler = (e: Event) =>
      setThemeState((e as CustomEvent<ThemeId>).detail);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const setTheme = (id: ThemeId) => {
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.setAttribute('data-theme', id);
    window.dispatchEvent(new CustomEvent<ThemeId>(EVENT_NAME, { detail: id }));
  };

  return { theme, setTheme };
}
