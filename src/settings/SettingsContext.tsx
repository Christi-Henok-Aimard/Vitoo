import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Language, ThemeColor } from './settings.types.js';
import { SettingsContext } from './settings.types.js';
import { loadSaved } from './settingsHooks.js';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = useMemo(() => loadSaved(), []);
  const [language, setLanguageState] = useState<Language>(saved.language === 'en' ? 'en' : 'fr');
  const [themeColor, setThemeColorState] = useState<ThemeColor>((saved.themeColor as ThemeColor) || 'blue');
  const [darkMode, setDarkModeState] = useState<boolean>(Boolean(saved.darkMode));

  useEffect(() => {
    localStorage.setItem('vitoo_settings', JSON.stringify({ language, themeColor, darkMode }));
    const root = document.documentElement;
    root.classList.toggle('theme-dark', darkMode);
    root.classList.remove('theme-blue', 'theme-corail', 'theme-vert');
    root.classList.add(`theme-${themeColor}`);
  }, [language, themeColor, darkMode]);

  const setLanguage = useCallback((value: Language) => setLanguageState(value), []);
  const setThemeColor = useCallback((value: ThemeColor) => setThemeColorState(value), []);
  const setDarkMode = useCallback((value: boolean) => setDarkModeState(value), []);

  const value = useMemo(
    () => ({ language, themeColor, darkMode, setLanguage, setThemeColor, setDarkMode }),
    [language, themeColor, darkMode, setLanguage, setThemeColor, setDarkMode],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
