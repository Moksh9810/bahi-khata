import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    // Get theme from localStorage or system preference
    const stored = localStorage.getItem('bahi-khata-theme');
    if (stored) return stored;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    localStorage.setItem('bahi-khata-theme', theme);
  }, [theme, mounted]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: mounted ? theme : 'dark',
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}
