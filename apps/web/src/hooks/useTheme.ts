import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'lap-theme';

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    // Storage can throw in private-browsing modes or when disabled — fall
    // back to the default rather than crash.
    return null;
  }
}

/**
 * Simple, class-based light/dark theme toggle. Defaults dark-first (per the
 * project's visual direction) and persists the choice in localStorage.
 * Toggles the `.dark` class on <html>, which Tailwind's custom `dark`
 * variant (see index.css) keys off.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Non-fatal — theme just won't persist across reloads.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
