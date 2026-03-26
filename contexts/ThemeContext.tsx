import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LightColors, DarkColors, type ColorPalette } from '../constants/Colors';

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
  colors: ColorPalette;
}

const ThemeContext = createContext<ThemeCtx>({
  isDark: false,
  toggle: () => {},
  setDark: () => {},
  colors: LightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const colors = isDark ? DarkColors : LightColors;
  const toggle = useCallback(() => setIsDark(v => !v), []);
  const setDark = useCallback((v: boolean) => setIsDark(v), []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;
