import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar si hay un tema guardado en localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('strider-theme') as Theme;
      if (savedTheme) {
        return savedTheme;
      }
      // Si no hay tema guardado, usar preferencia del sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remover clase anterior
    root.classList.remove('light', 'dark');
    
    // Agregar nueva clase de tema
    root.classList.add(theme);
    
    // Guardar en localStorage
    localStorage.setItem('strider-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    setTheme,
    toggleTheme
  };
}