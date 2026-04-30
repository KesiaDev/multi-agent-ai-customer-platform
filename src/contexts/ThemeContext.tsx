import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type Palette = 'green' | 'blue' | 'purple' | 'orange' | 'rose' | 'slate';

export const PALETTES: { id: Palette; label: string; swatch: string }[] = [
  { id: 'green',  label: 'Verde',   swatch: 'hsl(142 76% 36%)' },
  { id: 'blue',   label: 'Azul',    swatch: 'hsl(217 91% 50%)' },
  { id: 'purple', label: 'Roxo',    swatch: 'hsl(262 80% 55%)' },
  { id: 'orange', label: 'Laranja', swatch: 'hsl(24 95% 53%)' },
  { id: 'rose',   label: 'Rosa',    swatch: 'hsl(346 80% 55%)' },
  { id: 'slate',  label: 'Grafite', swatch: 'hsl(215 25% 27%)' },
];

interface ThemeContextValue {
  mode: ThemeMode;
  palette: Palette;
  setMode: (m: ThemeMode) => void;
  setPalette: (p: Palette) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const MODE_KEY = 'app-theme-mode';
const PALETTE_KEY = 'app-theme-palette';

function applyTheme(mode: ThemeMode, palette: Palette) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  // Remove existing palette classes
  root.classList.remove('palette-green', 'palette-blue', 'palette-purple', 'palette-orange', 'palette-rose', 'palette-slate');
  root.classList.add(`palette-${palette}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem(MODE_KEY) as ThemeMode) || 'light';
  });
  const [palette, setPaletteState] = useState<Palette>(() => {
    if (typeof window === 'undefined') return 'green';
    return (localStorage.getItem(PALETTE_KEY) as Palette) || 'green';
  });

  useEffect(() => {
    applyTheme(mode, palette);
  }, [mode, palette]);

  const setMode = (m: ThemeMode) => {
    localStorage.setItem(MODE_KEY, m);
    setModeState(m);
  };
  const setPalette = (p: Palette) => {
    localStorage.setItem(PALETTE_KEY, p);
    setPaletteState(p);
  };
  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ mode, palette, setMode, setPalette, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
