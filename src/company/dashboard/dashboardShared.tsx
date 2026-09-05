import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Bus, QrCode, Copy, Printer, User } from 'lucide-react';
import QRCode from 'qrcode';

export interface CompanyBranding {
  logo?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentMethods?: string[];
}

export interface TicketHistoryItem {
  id: string;
  code?: string;
  tripId: string;
  tripLabel: string;
  depart: string;
  arrivee: string;
  date: string;
  time: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber?: string;
  amount: number;
  paymentMethod: string;
  soldBy: string;
  soldAt: string;
  commissionAmount?: number;
  status: 'paid' | 'boarded' | 'present' | 'delayed';
}

export const COMMISSION_RATE = 0.08;

export const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode; type?: string; required?: boolean; placeholder?: string; min?: string }> = ({ label, value, onChange, icon, type = 'text', required, placeholder, min }) => (
  <div className="form-field">
    <label className="field-label">{icon} {label}</label>
    <input className="field-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} min={min} />
  </div>
);

/* ==================== TICKET DETAIL VIEW ==================== */
export const TicketDetailView: React.FC<{ ticket: TicketHistoryItem; branding: CompanyBranding; onBack: () => void }> = ({ ticket, branding, onBack }) => {
  const [copied, setCopied] = useState(false);
  const reference = ticket.code || `TKT-${ticket.id.slice(-6).toUpperCase()}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(reference, { margin: 1, width: 240 })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [reference]);

  const copyCode = async () => {
    await navigator.clipboard?.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fade-in">
      <button onClick={onBack} className="back-link"><ArrowLeft size={16} /> Retour à l'historique</button>

      <div className="ticket-card-company" style={{ '--company-color': branding.primaryColor || '#2563eb' } as React.CSSProperties}>
        <div className="ticket-card-header" style={{ background: branding.primaryColor || '#2563eb' }}>
          <div className="ticket-company-logo">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" />
            ) : (
              <Building2 size={24} />
            )}
          </div>
          <div className="ticket-company-info">
            <h3>{branding.companyName || 'Ma Compagnie'}</h3>
            <p>Billet de voyage</p>
          </div>
          <div className="ticket-bus-icon">
            <Bus size={32} />
          </div>
        </div>

        <div className="ticket-card-body">
          <div className="ticket-route-display">
            <div className="ticket-city">
              <span className="ticket-city-label">Départ</span>
              <strong>{ticket.depart}</strong>
            </div>
            <div className="ticket-arrow">→</div>
            <div className="ticket-city">
              <span className="ticket-city-label">Arrivée</span>
              <strong>{ticket.arrivee}</strong>
            </div>
          </div>

          <div className="ticket-details-grid">
            <div className="ticket-detail-item">
              <span>Passager</span>
              <strong>{ticket.passengerName}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Téléphone</span>
              <strong>{ticket.passengerPhone}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Date</span>
              <strong>{ticket.date}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Heure</span>
              <strong>{ticket.time}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Paiement</span>
              <strong>{ticket.paymentMethod}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Montant</span>
              <strong className="text-green-600">{ticket.amount} FCFA</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Siège</span>
              <strong>{ticket.seatNumber || '—'}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Canal de vente</span>
              <strong>{ticket.soldBy === 'online' ? 'En ligne' : 'Guichet'}</strong>
            </div>
          </div>

          <div className="ticket-qr-section">
            <div className="ticket-qr-placeholder">
              {qrDataUrl ? <img src={qrDataUrl} alt={`QR code ${reference}`} className="h-20 w-20" /> : <QrCode size={80} />}
              <p>{reference}</p>
            </div>
          </div>

          <div className="ticket-actions">
            <button className="secondary-action" onClick={() => window.print()}><Printer size={16} /> Imprimer</button>
            <button className="secondary-action" onClick={copyCode}><Copy size={16} /> {copied ? 'Copié!' : 'Copier'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TicketUserIcon = User;
