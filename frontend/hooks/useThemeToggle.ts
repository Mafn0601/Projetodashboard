'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function useThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;

    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Atualizar o tema via next-themes
    setTheme(newTheme);
    
    // Forçar atualização imediata do DOM
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Salvar no localStorage
    localStorage.setItem('theme-preference', newTheme);
    
    console.log('Theme toggled to:', newTheme);
  };

  return {
    theme,
    mounted,
    toggleTheme,
  };
}
