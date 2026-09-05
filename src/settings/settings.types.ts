import { createContext } from 'react';

export type Language = 'fr' | 'en';
export type ThemeColor = 'blue' | 'corail' | 'vert';

export interface SettingsState {
  language: Language;
  themeColor: ThemeColor;
  darkMode: boolean;
  setLanguage: (value: Language) => void;
  setThemeColor: (value: ThemeColor) => void;
  setDarkMode: (value: boolean) => void;
}

export const SettingsContext = createContext<SettingsState | null>(null);

export type TranslationKey = keyof typeof translations.fr;

const translations = {
  fr: {
    search: 'Rechercher', companies: 'Compagnies', tickets: 'Mes billets', bookings: 'Mes réservations', tracking: 'Suivi de course',
    logout: 'Déconnexion', profile: 'Mon profil', settings: 'Paramètres', notifications: 'Notifications',
    heroEyebrow: 'Votre prochain départ', heroTitle: 'Partez plus loin, simplement.', heroText: "Les meilleurs trajets interurbains de Côte d'Ivoire réunis au même endroit.",
    availableTrips: 'Trajets disponibles', settingsTitle: 'Paramètres', settingsText: 'Personnalisez Vitoo comme vous aimez voyager.',
  },
  en: {
    search: 'Search', companies: 'Companies', tickets: 'My tickets', bookings: 'My bookings', tracking: 'Trip tracking',
    logout: 'Log out', profile: 'My profile', settings: 'Settings', notifications: 'Notifications',
    heroEyebrow: 'Your next departure', heroTitle: 'Travel further, simply.', heroText: "The best intercity routes in Côte d'Ivoire in one place.",
    availableTrips: 'Available trips', settingsTitle: 'Settings', settingsText: 'Customize Vitoo the way you like to travel.',
  },
} as const;

export { translations };
