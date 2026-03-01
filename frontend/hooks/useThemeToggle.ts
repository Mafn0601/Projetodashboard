'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';

export function useThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    if (!mounted || !theme) return;

    const currentTheme = theme === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log('Toggle theme - current:', currentTheme, 'new:', newTheme);
    
    // Aplicar o tema
    setTheme(newTheme);
    
    // Força síncrona do DOM
    setTimeout(() => {
      const html = document.documentElement;
      html.classList.toggle('dark', newTheme === 'dark');
      document.body.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('theme-preference', newTheme);
      console.log('Theme applied to DOM:', newTheme);
    }, 0);
  }, [mounted, theme, setTheme]);

  return {
    theme: mounted ? theme : systemTheme,
    mounted,
    toggleTheme,
  };
}
