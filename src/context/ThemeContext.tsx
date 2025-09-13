import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // ✅ Obtener el estado inicial desde localStorage
  const [isDark, setIsDark] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('theme');
      return storedTheme === 'dark';
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return false; // Retornar un valor predeterminado si hay un error
    }
  });

  useEffect(() => {
    // ✅ Cambiar la clase en el elemento <html>
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // ✅ Guardar la preferencia en localStorage cada vez que cambie
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);