import { useState, useEffect } from 'react';
import { updatePreferenciasUsuario } from '../services/adminService';

export type ThemeId =
  | 'dark'
  | 'premium-light'
  | 'soft-medical'
  | 'executive-ai'
  | 'rose-care'
  | 'fuchsia-premium'
  | 'purple-care'
  | 'arctic-blue'
  | 'mint-premium'
  | 'sunset-care';

export const DEFAULT_THEME: ThemeId = 'dark';

export function getInitialTheme(): ThemeId {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.preferencias?.theme) return u.preferencias.theme as ThemeId;
    }
    return (localStorage.getItem('sarai-theme') as ThemeId) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sarai-theme', theme);
  window.dispatchEvent(new CustomEvent('sarai-theme-change', { detail: theme }));
}

// Inicializador ejecutado al arrancar en main.tsx
export function initTheme(): ThemeId {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => getInitialTheme());

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.preferencias = { ...(u.preferencias || {}), theme: newTheme };
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch { /* noop */ }

    updatePreferenciasUsuario({ theme: newTheme }).catch((err) => {
      console.warn('No se pudo guardar el tema en la base de datos:', err?.message || err);
    });
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeId>;
      if (customEvent.detail && customEvent.detail !== theme) {
        setThemeState(customEvent.detail);
      }
    };
    window.addEventListener('sarai-theme-change', handler);
    return () => window.removeEventListener('sarai-theme-change', handler);
  }, [theme]);

  return { theme, setTheme };
}