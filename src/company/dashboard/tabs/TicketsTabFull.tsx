import React, { useState } from 'react';
import { Bus, Ticket, Phone, CreditCard, User, Plus, X as XClose, Check as CheckMark, Eye } from 'lucide-react';
import type { TripData } from '../../../api/companyApi';
import { InputField, TicketDetailView, type CompanyBranding, type TicketHistoryItem } from '../dashboardShared';
import type { SellTicketPayload } from '../CompanyDashboard';
import { normalizePaymentMethods } from '../paymentMethods';

interface Props {
  trips: TripData[];
  ticketHistory: TicketHistoryItem[];
  onSellTicket: (d: SellTicketPayload) => Promise<void>;
  branding: CompanyBranding;
}

/* ==================== TICKETS TAB ==================== */
export const TicketsTabFull: React.FC<Props> = ({ trips, ticketHistory, onSellTicket, branding }) => {
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketHistoryItem | null>(null);
  const paymentOptions = (() => {
    const methods = normalizePaymentMethods(branding.paymentMethods);
    return methods.length ? methods : ['Espèces'];
  })();
  const defaultMethod = paymentOptions[0] || 'Espèces';
  const [formData, setFormData] = useState({ tripId: '', passengerName: '', passengerPhone: '', paymentMethod: defaultMethod });
  const [saleSuccess, setSaleSuccess] = useState(false);

  const selectedTrip = trips.find(t => t.id === formData.tripId);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSellTicket(formData);
      setFormData({ tripId: '', passengerName: '', passengerPhone: '', paymentMethod: defaultMethod });
      setSaleSuccess(true);
      setTimeout(() => setSaleSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedTicket) {
    return <TicketDetailView ticket={selectedTicket} branding={branding} onBack={() => setSelectedTicket(null)} />;
  }

  return (
    <div className="fade-in">
      <div className="page-heading">
        <div>
          <span className="hero-eyebrow">Ventes</span>
          <h1>Guichet</h1>
          <p>Vendez des billets et consultez l'historique.</p>
        </div>
        <button className="primary-action" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><XClose size={16} /> Fermer</> : <><Plus size={16} /> Vendre un billet</>}
        </button>
      </div>

      {saleSuccess && (
        <div className="alert-success"><CheckMark size={16} /> Billet vendu avec succès !</div>
      )}

      {showForm && (
        <form onSubmit={handleSell} className="form-card">
          <div className="form-grid">
            <div className="form-field full-width">
              <label className="field-label"><Bus size={16} /> Trajet</label>
              <select className="field-input" value={formData.tripId} onChange={(e) => setFormData({ ...formData, tripId: e.target.value })} required>
                <option value="">Sélectionner un trajet</option>
                {trips.filter(t => t.status === 'scheduled' && t.availableSeats > 0).map(t => (
                  <option key={t.id} value={t.id}>{t.depart} → {t.arrivee} ({t.date} {t.time}) - {t.price} FCFA</option>
                ))}
              </select>
            </div>
            <InputField label="Nom du passager" value={formData.passengerName} onChange={(v) => setFormData({ ...formData, passengerName: v })} icon={<User size={16} />} required />
            <InputField label="Téléphone" value={formData.passengerPhone} onChange={(v) => setFormData({ ...formData, passengerPhone: v })} icon={<Phone size={16} />} required />
            <div className="form-field">
              <label className="field-label"><CreditCard size={16} /> Paiement</label>
              <select className="field-input" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedTrip && (
            <div className="commission-breakdown">
              <div><span>Prix:</span><strong>{selectedTrip.price} FCFA</strong></div>
              <div><span>Commission Vitoo:</span><strong className="text-orange-600">Calculée au serveur</strong></div>
              <div><span>Net compagnie:</span><strong className="text-green-600">Renseigné après la vente</strong></div>
            </div>
          )}
          <button type="submit" className="primary-action" disabled={isLoading}>
            {isLoading ? 'Vente...' : <><CheckMark size={16} /> Vendre le billet</>}
          </button>
        </form>
      )}

      <h3 className="section-title">Historique des ventes ({ticketHistory.length})</h3>
      {ticketHistory.length === 0 ? (
        <div className="empty-state"><Ticket size={48} /><p>Aucune vente enregistrée.</p></div>
      ) : (
        <div className="ticket-history-list">
          {ticketHistory.map((ticket) => (
            <div key={ticket.id} className="ticket-history-item" onClick={() => setSelectedTicket(ticket)}>
              <div className="ticket-history-main">
                <div className="ticket-history-passenger">
                  <User size={16} />
                  <strong>{ticket.passengerName}</strong>
                  <span className={`pill ${ticket.soldBy === 'online' ? 'pill-blue' : 'pill-orange'}`}>{ticket.soldBy === 'online' ? 'En ligne' : 'Guichet'}</span>
                </div>
                <div className="text-sm text-slate-500">{ticket.tripLabel}</div>
              </div>
              <div className="ticket-history-info">
                <div className="text-sm text-slate-500">{ticket.date} {ticket.time}</div>
                <div className="text-sm">{ticket.paymentMethod}</div>
              </div>
              <div className="ticket-history-amount">
                <strong>{ticket.amount} FCFA</strong>
                <Eye size={14} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
