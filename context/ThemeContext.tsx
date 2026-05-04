import React, { createContext, useContext } from 'react';

// Couleurs Ghibli fixes (pas de mode sombre)
export const LightColors = {
  background: '#FDF6E3',
  card: '#FFFFFF',
  text: '#4A3728',
  subtext: '#8B735B',
  primary: '#8BAF76',
  accent: '#C4A882',
  border: '#F0E6D2',
  danger: '#D48C8C',
};

// On garde la même structure pour éviter de casser les imports dans les autres fichiers
export const DarkColors = LightColors; 

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  theme: typeof LightColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDark = false; // Toujours faux
  const toggleTheme = () => {}; // Ne fait rien
  const theme = LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback silencieux pour éviter les crashs si le provider est manquant
    return { isDark: false, toggleTheme: () => {}, theme: LightColors };
  }
  return context;
};
