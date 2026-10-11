import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pokedex-theme';

/**
 * Lee el tema inicial desde el atributo `data-theme` en <html>, que ya lo dejó
 * fijado el script inline de index.html (localStorage o preferencia del
 * sistema) antes de que React monte, para evitar un parpadeo de tema.
 */
function getInitialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }

  return [theme, toggleTheme];
}
