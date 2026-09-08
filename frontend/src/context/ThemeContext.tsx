import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'alterego_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  setMode: () => {},
  setThemeMode: () => {},
  toggleTheme: () => {},
});

const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const resolveInitialMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }

  return 'system';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(resolveInitialMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(getSystemPrefersDark);

  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const isFirstThemeApply = useRef(true);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const applyTheme = () => {
      root.classList.toggle('dark', isDark);
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    // Ease colours only while the theme is actually switching. A permanent
    // global colour transition made frequently re-rendering surfaces (the
    // calendar's live time indicator, say) visibly lag their real colours.
    if (isFirstThemeApply.current) {
      isFirstThemeApply.current = false;
      applyTheme();
      return;
    }

    root.classList.add('theme-transition');
    applyTheme();

    const timeout = window.setTimeout(() => root.classList.remove('theme-transition'), 320);
    return () => {
      window.clearTimeout(timeout);
      root.classList.remove('theme-transition');
    };
  }, [isDark]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const setThemeMode = useCallback((nextMode: 'light' | 'dark') => {
    setModeState(nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const currentlyDark = prev === 'dark' || (prev === 'system' && getSystemPrefersDark());
      return currentlyDark ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      setMode,
      setThemeMode,
      toggleTheme,
    }),
    [mode, isDark, setMode, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
