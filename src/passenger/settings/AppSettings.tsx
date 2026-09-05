import React, { useState } from 'react';
import { Bell, ChevronRight, Globe, HelpCircle, LogOut, Moon, Palette, Phone, MessageCircle } from 'lucide-react';
import { useSettings, useTranslation } from '../../settings/settingsHooks.js';
import type { Language, ThemeColor } from '../../settings/settings.types.js';

interface AppSettingsProps { onLogout?: () => void; onNotifications?: () => void; }

// Numéros de support Vitoo : appel, SMS et WhatsApp fonctionnels.
const SUPPORT_NUMBERS = [
  { display: '01 02 21 80 53', link: '+2250102218053', whatsapp: '2250102218053' },
  { display: '07 78 46 47 06', link: '+2250778464706', whatsapp: '2250778464706' },
];

export const AppSettings: React.FC<AppSettingsProps> = ({ onLogout, onNotifications }) => {
  const { language, themeColor, darkMode, setLanguage, setThemeColor, setDarkMode } = useSettings();
  const t = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
  const [openSupport, setOpenSupport] = useState<string | null>(null);

  return (
    <section className="settings-page">
      <div className="page-heading"><span className="hero-eyebrow">{language === 'fr' ? 'Préférences' : 'Preferences'}</span><h1>{t('settingsTitle')}</h1><p>{t('settingsText')}</p></div>
      <div className="settings-list">
        <label className="setting-row"><span><Globe /><b>{language === 'fr' ? 'Langue' : 'Language'}</b><small>{language === 'fr' ? 'Choisissez votre langue' : 'Choose your language'}</small></span><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="fr">Français</option><option value="en">English</option></select></label>
        <label className="setting-row"><span><Palette /><b>{language === 'fr' ? "Couleur de l'application" : 'App color'}</b><small>{language === 'fr' ? 'Bleu Vitoo, corail ou vert forêt' : 'Vitoo blue, coral or forest green'}</small></span><select value={themeColor} onChange={(event) => setThemeColor(event.target.value as ThemeColor)}><option value="blue">Bleu Vitoo</option><option value="corail">Corail</option><option value="vert">Vert forêt</option></select></label>
        <button className="setting-row" onClick={() => { setNotifications((value) => !value); onNotifications?.(); }}><span><Bell /><b>Notifications</b><small>{notifications ? (language === 'fr' ? 'Activées' : 'Enabled') : (language === 'fr' ? 'Désactivées' : 'Disabled')} · {language === 'fr' ? "alertes dans l'application" : 'in-app alerts'}</small></span><ChevronRight /></button>
        <label className="setting-row"><span><Moon /><b>{language === 'fr' ? 'Mode sombre' : 'Dark mode'}</b><small>{language === 'fr' ? "Adapter l'apparence de l'application" : 'Adapt the app appearance'}</small></span><input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} /></label>
        <button className="setting-row" onClick={() => setFaqOpen(!faqOpen)}><span><HelpCircle /><b>{language === 'fr' ? 'Centre d’aide et FAQ' : 'Help center & FAQ'}</b><small>{language === 'fr' ? 'Questions fréquentes des passagers' : 'Frequent passenger questions'}</small></span><ChevronRight /></button>
        {faqOpen && (
          <div className="faq-panel">
            <b>{language === 'fr' ? 'Comment réserver un trajet ?' : 'How do I book a trip?'}</b>
            <p>{language === 'fr' ? 'Recherchez une ville, sélectionnez un départ puis confirmez votre place et payez.' : 'Search a city, pick a departure, confirm your seat and pay.'}</p>
            <b>{language === 'fr' ? 'Où trouver mon billet ?' : 'Where is my ticket?'}</b>
            <p>{language === 'fr' ? "Ouvrez l'onglet Mes billets après votre réservation : le QR code s'y trouve." : 'Open My tickets after booking: the QR code is there.'}</p>
            <b>{language === 'fr' ? 'Comment suivre mon car ?' : 'How do I track my bus?'}</b>
            <p>{language === 'fr' ? 'Onglet Suivi de course : position en direct, itinéraire et prochain arrêt.' : 'Trip tracking tab: live position, itinerary and next stop.'}</p>
            <div className="support-call">
              <b>{language === 'fr' ? 'Besoin de plus d’informations ? Contactez Vitoo :' : 'Need more information? Contact Vitoo:'}</b>
              {SUPPORT_NUMBERS.map((number) => (
                <div key={number.link} className="support-entry">
                  <button className="support-number" onClick={() => setOpenSupport(openSupport === number.link ? null : number.link)}>
                    <Phone /> {number.display} <ChevronRight />
                  </button>
                  {openSupport === number.link && (
                    <div className="contact-options">
                      <a href={`tel:${number.link}`}>📞 {language === 'fr' ? 'Appeler' : 'Call'}</a>
                      <a href={`sms:${number.link}`}>✉️ SMS</a>
                      <a href={`https://wa.me/${number.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="setting-row danger-row" onClick={onLogout}><span><LogOut /><b>{t('logout')}</b><small>{language === 'fr' ? 'Fermer votre session Vitoo' : 'Close your Vitoo session'}</small></span><ChevronRight /></button>
      </div>
    </section>
  );
};
