import React, { useState } from 'react';
import { Bell, ChevronRight, Globe, HelpCircle, LogOut, Moon, Palette, Phone, MessageCircle, Building2, Paperclip, CreditCard, Pencil, Settings, Check as CheckMark } from 'lucide-react';
import { useSettings, useTranslation } from '../../settings/settingsHooks.js';
import type { Language, ThemeColor } from '../../settings/settings.types.js';
import type { UserSession } from '../../auth/passenger/types/auth';
import { updateCompanyProfileApi } from '../../api/companyAuthApi';
import { normalizePaymentMethods } from '../dashboard/paymentMethods';

interface CompanyBranding {
  logo?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentMethods?: string[];
}

interface CompanySettingsProps {
  onLogout?: () => void;
  currentUser?: UserSession | null;
  onUserUpdate?: (user: UserSession) => void;
  onBrandingUpdate?: (branding: CompanyBranding) => void;
}

const SUPPORT_NUMBERS = [
  { display: '01 02 21 80 53', link: '+2250102218053', whatsapp: '2250102218053' },
  { display: '07 78 46 47 06', link: '+2250778464706', whatsapp: '2250778464706' },
];

const BRANDING_KEY = 'vitoo_company_branding';

export const CompanySettings: React.FC<CompanySettingsProps> = ({ onLogout, currentUser, onUserUpdate, onBrandingUpdate }) => {
  const { language, themeColor, darkMode, setLanguage, setThemeColor, setDarkMode } = useSettings();
  const t = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
  const [openSupport, setOpenSupport] = useState<string | null>(null);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [editingCompanyName, setEditingCompanyName] = useState(false);
  const [companyNameDraft, setCompanyNameDraft] = useState('');

  const [branding, setBranding] = useState<CompanyBranding>(() => {
    try {
      const raw = localStorage.getItem(BRANDING_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return { ...saved, companyName: saved.companyName || currentUser?.companyName || currentUser?.lastName, logo: saved.logo || currentUser?.companyLogo, primaryColor: saved.primaryColor || currentUser?.primaryColor, secondaryColor: saved.secondaryColor || currentUser?.secondaryColor, paymentMethods: normalizePaymentMethods(saved.paymentMethods || currentUser?.paymentMethods) };
    } catch { return {}; }
  });

  const updateBranding = (field: string, value: string) => {
    setBrandingSaved(false);
    setBranding((prev: CompanyBranding) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem(BRANDING_KEY, JSON.stringify(updated));
      return updated;
    });
    onBrandingUpdate?.({ ...branding, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      updateBranding('logo', result);
      setBrandingSaved(true);
    };
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(branding));
    onBrandingUpdate?.(branding);
    const savedUser = await updateCompanyProfileApi({
      companyName: branding.companyName || currentUser?.companyName,
      companyLogo: branding.logo,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      paymentMethods: branding.paymentMethods,
    });
    onUserUpdate?.({ ...(currentUser || {} as UserSession), ...savedUser } as UserSession);
    setBrandingSaved(true);
  };

  const isFr = language === 'fr';

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow">{isFr ? 'Paramètres' : 'Settings'}</span>
        <h1>{isFr ? 'Paramètres de la compagnie' : 'Company settings'}</h1>
        <p>{isFr ? 'Personnalisez votre espace et votre marque blanche.' : 'Customize your space and white-label.'}</p>
      </div>

      <div className="settings-sections">
        {/* Section: Marque blanche */}
        <div className="settings-group">
          <div className="settings-group-title">
            <Building2 size={18} /> {isFr ? 'Marque blanche' : 'White-label'}
          </div>
          <div className="settings-group-content">
            <div className="setting-row">
              <span className="setting-label">
                <Building2 size={16} />
                <div>
                  <b>{isFr ? "Nom de l'entreprise" : 'Company name'}</b>
                  <small>{isFr ? 'Affiché sur votre portail client' : 'Shown on your client portal'}</small>
                </div>
              </span>
              {editingCompanyName ? (
                <form className="inline-edit" onSubmit={(e) => { e.preventDefault(); updateBranding('companyName', companyNameDraft.trim()); setEditingCompanyName(false); }}>
                  <input autoFocus type="text" className="setting-input" value={companyNameDraft} onChange={(e) => setCompanyNameDraft(e.target.value)} placeholder="Ma Compagnie" />
                  <button type="submit" className="icon-btn" aria-label={isFr ? 'Enregistrer le nom' : 'Save company name'} title={isFr ? 'Enregistrer' : 'Save'}><CheckMark size={16} /></button>
                </form>
              ) : (
                <div className="setting-value-with-action">
                  <strong>{branding.companyName || currentUser?.companyName || (isFr ? 'Ma Compagnie' : 'My company')}</strong>
                  <button type="button" className="icon-btn" onClick={() => { setCompanyNameDraft(branding.companyName || currentUser?.companyName || ''); setEditingCompanyName(true); }} aria-label={isFr ? 'Modifier le nom' : 'Edit company name'} title={isFr ? 'Modifier' : 'Edit'}><Pencil size={15} /></button>
                </div>
              )}
            </div>
            <div className="setting-row logo-setting-row">
              <span className="setting-label">
                <Paperclip size={16} />
                <div>
                  <b>{isFr ? "Logo de l'entreprise" : 'Company logo'}</b>
                  <small>{isFr ? 'Importez votre logo (PNG, JPG)' : 'Upload your logo (PNG, JPG)'}</small>
                </div>
              </span>
              <label className="upload-pin" htmlFor="company-logo-upload">
                <span className="upload-pin-icon"><Paperclip size={20} /></span>
                <span className="upload-pin-text">{branding.logo ? (isFr ? 'Remplacer le logo' : 'Replace logo') : (isFr ? 'Épingler un logo' : 'Pin a logo')}</span>
                <input id="company-logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="setting-file" />
              </label>
            {branding.logo && (
              <div className="setting-logo-preview">
                <img src={branding.logo} alt={isFr ? 'Aperçu du logo' : 'Logo preview'} />
                <button type="button" className="icon-btn" onClick={() => updateBranding('logo', '')} aria-label={isFr ? 'Supprimer le logo' : 'Remove logo'}>×</button>
              </div>
            )}
            </div>
            <label className="setting-row">
              <span className="setting-label">
                <Palette size={16} />
                <div>
                  <b>{isFr ? 'Couleur principale' : 'Primary color'}</b>
                  <small>{isFr ? "Couleur d'accent de votre marque" : 'Your brand accent color'}</small>
                </div>
              </span>
              <input type="color" value={branding.primaryColor || '#2563eb'} onChange={(e) => updateBranding('primaryColor', e.target.value)} className="setting-color" />
            </label>
            <label className="setting-row">
              <span className="setting-label">
                <Palette size={16} />
                <div>
                  <b>{isFr ? 'Couleur secondaire' : 'Secondary color'}</b>
                  <small>{isFr ? 'Couleur de fond' : 'Background color'}</small>
                </div>
              </span>
              <input type="color" value={branding.secondaryColor || '#f8fafc'} onChange={(e) => updateBranding('secondaryColor', e.target.value)} className="setting-color" />
            </label>
            <button className="primary-action" onClick={saveBranding}>
              {isFr ? 'Enregistrer la marque blanche' : 'Save white-label'}
            </button>
            {brandingSaved && <p className="success-text">{isFr ? 'Marque blanche enregistrée !' : 'White-label saved!'}</p>}
          </div>
        </div>

        {/* Section: Préférences */}
        <div className="settings-group">
          <div className="settings-group-title">
            <Palette size={18} /> {isFr ? 'Préférences' : 'Preferences'}
          </div>
          <div className="settings-group-content">
            <label className="setting-row">
              <span className="setting-label">
                <Globe size={16} />
                <div><b>{isFr ? 'Langue' : 'Language'}</b><small>{isFr ? 'Choisissez votre langue' : 'Choose your language'}</small></div>
              </span>
              <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="setting-select">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="setting-row">
              <span className="setting-label">
                <Palette size={16} />
                <div><b>{isFr ? "Couleur de l'application" : 'App color'}</b><small>{isFr ? 'Bleu, corail ou vert forêt' : 'Blue, coral or forest green'}</small></div>
              </span>
              <select value={themeColor} onChange={(e) => setThemeColor(e.target.value as ThemeColor)} className="setting-select">
                <option value="blue">Bleu Vitoo</option>
                <option value="corail">Corail</option>
                <option value="vert">Vert forêt</option>
              </select>
            </label>
            <button className="setting-row" type="button" onClick={() => { setNotifications((v) => !v); }}>
              <span className="setting-label">
                <Bell size={16} />
                <div><b>Notifications</b><small>{notifications ? (isFr ? 'Activées' : 'Enabled') : (isFr ? 'Désactivées' : 'Disabled')}</small></div>
              </span>
              <div className={`toggle ${notifications ? 'active' : ''}`}>
                <div className="toggle-knob" />
              </div>
            </button>
            <label className="setting-row">
              <span className="setting-label">
                <Moon size={16} />
                <div><b>{isFr ? 'Mode sombre' : 'Dark mode'}</b><small>{isFr ? "Adapter l'apparence" : 'Adapt the appearance'}</small></div>
              </span>
              <div className={`toggle ${darkMode ? 'active' : ''}`} onClick={() => setDarkMode(!darkMode)}>
                <div className="toggle-knob" />
              </div>
            </label>
          </div>
        </div>

        {/* Section: Gestion */}
        <div className="settings-group">
          <div className="settings-group-title">
            <Settings size={18} /> {isFr ? 'Gestion' : 'Management'}
          </div>
          <div className="settings-group-content">
            <div className="setting-row">
              <span className="setting-label">
                <CreditCard size={16} />
                <div><b>{isFr ? 'Commission Vitoo' : 'Vitoo commission'}</b><small>{isFr ? '8% par billet vendu' : '8% per ticket sold'}</small></div>
              </span>
              <span className="setting-badge">8%</span>
            </div>
          </div>
        </div>

        {/* Section: Support */}
        <div className="settings-group">
          <div className="settings-group-title">
            <HelpCircle size={18} /> {isFr ? 'Aide & Support' : 'Help & Support'}
          </div>
          <div className="settings-group-content">
            <button className="setting-row" type="button" onClick={() => setFaqOpen(!faqOpen)}>
              <span className="setting-label">
                <HelpCircle size={16} />
                <div><b>{isFr ? "Centre d'aide" : 'Help center'}</b><small>{isFr ? 'Questions fréquentes' : 'Frequently asked questions'}</small></div>
              </span>
              <ChevronRight size={16} className={faqOpen ? 'rotated' : ''} />
            </button>
            {faqOpen && (
              <div className="faq-panel">
                <div className="faq-item">
                  <b>{isFr ? 'Comment ajouter des conducteurs ?' : 'How do I add drivers?'}</b>
                  <p>{isFr ? 'Allez dans Profil > Onglet Chauffeurs. Ces profils servent à alimenter votre base de données pour la programmation des trajets.' : 'Go to Profile > Drivers tab. These profiles populate your database for trip scheduling.'}</p>
                </div>
                <div className="faq-item">
                  <b>{isFr ? 'Comment fonctionne la marque blanche ?' : 'How does white-label work?'}</b>
                  <p>{isFr ? 'Importez votre logo et choisissez vos couleurs. Votre portail client affichera votre identité visuelle tout en restant hébergé sur Vitoo. Le logo Vitoo sera remplacé par le vôtre.' : 'Upload your logo and choose your colors. Your client portal shows your visual identity while staying hosted on Vitoo. The Vitoo logo will be replaced by yours.'}</p>
                </div>
                <div className="faq-item">
                  <b>{isFr ? 'Comment sont calculées les commissions ?' : 'How are commissions calculated?'}</b>
                  <p>{isFr ? 'Vitoo prend 8% sur chaque billet vendu. Les 92% restants sont versés à la compagnie.' : 'Vitoo takes 8% on each ticket sold. The remaining 92% goes to the company.'}</p>
                </div>
                <div className="support-call">
                  <b>{isFr ? "Besoin d'aide ? Contactez Vitoo :" : 'Need help? Contact Vitoo:'}</b>
                  {SUPPORT_NUMBERS.map((number) => (
                    <div key={number.link} className="support-entry">
                      <button className="support-number" onClick={() => setOpenSupport(openSupport === number.link ? null : number.link)}>
                        <Phone size={14} /> {number.display} <ChevronRight size={14} />
                      </button>
                      {openSupport === number.link && (
                        <div className="contact-options">
                          <a href={`tel:${number.link}`}>📞 {isFr ? 'Appeler' : 'Call'}</a>
                          <a href={`sms:${number.link}`}>✉️ SMS</a>
                          <a href={`https://wa.me/${number.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="setting-row logout-row" onClick={onLogout}>
          <span className="setting-label">
            <LogOut size={16} />
            <div><b>{t('logout')}</b><small>{isFr ? 'Fermer votre session' : 'Close your session'}</small></div>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
