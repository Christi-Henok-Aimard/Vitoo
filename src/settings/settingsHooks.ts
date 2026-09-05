import { useCallback, useContext } from 'react';
import { SettingsContext } from './settings.types.js';
import type { SettingsState, TranslationKey } from './settings.types.js';
import { translations } from './settings.types.js';

const STORAGE_KEY = 'vitoo_settings';

export const loadSaved = (): Partial<SettingsState> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<SettingsState>;
  } catch {
    return {};
  }
};

export const useSettings = (): SettingsState => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings doit être utilisé dans SettingsProvider');
  return context;
};

export const useTranslation = () => {
  const { language } = useSettings();
  return useCallback((key: TranslationKey) => translations[language][key], [language]);
};
