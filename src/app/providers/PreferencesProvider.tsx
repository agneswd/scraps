import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import i18n from '@/shared/i18n/i18n';
import { loadLanguageResources } from '@/shared/i18n/languages';

export type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesContextValue = {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
};

const LANGUAGE_STORAGE_KEY = 'scraps.preferences.language';
const THEME_STORAGE_KEY = 'scraps.preferences.theme';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

function getStoredLanguage() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'en';
}

function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : 'system';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(getStoredLanguage);
  const [theme, setThemeState] = useState<ThemePreference>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    updateTheme();

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

    void loadLanguageResources(language)
      .then(() => i18n.changeLanguage(language))
      .catch(() => i18n.changeLanguage('en'));
  }, [language]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      language,
      setLanguage: async (nextLanguage: string) => {
        setLanguageState(nextLanguage);
      },
      theme,
      resolvedTheme,
      setTheme: setThemeState,
    }),
    [language, resolvedTheme, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }

  return context;
}