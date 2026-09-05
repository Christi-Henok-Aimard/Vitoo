import React, { useState } from 'react';
import { ArrowLeft, Banknote, Bus, ChevronRight, CreditCard, Ticket, TrendingUp, User } from 'lucide-react';
import type { DriverData, TripData, VehicleData } from '../../../api/companyApi';
import type { CompanyStats } from '../../../api/companyApi';
import { TicketDetailView, type CompanyBranding, type TicketHistoryItem } from '../dashboardShared';

interface Props {
  stats: CompanyStats | null;
  ticketHistory: TicketHistoryItem[];
  trips: TripData[];
  drivers: DriverData[];
  vehicles: VehicleData[];
  primaryColor: string;
  branding: CompanyBranding;
}

interface DailySale {
  key: string;
  label: string;
  tickets: number;
  revenue: number;
}

const getDailySales = (tickets: TicketHistoryItem[]): DailySale[] => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    const dayTickets = tickets.filter((ticket) => ticket.date === key || ticket.soldAt?.slice(0, 10) === key);
    return {
      key,
      label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      tickets: dayTickets.length,
      revenue: dayTickets.reduce((sum, ticket) => sum + ticket.amount, 0),
    };
  });
};

/* ==================== STATS TAB ==================== */
export const StatsTabFull: React.FC<Props> = ({ stats, ticketHistory, trips, drivers, vehicles, primaryColor, branding }) => {
  const [period, setPeriod] = useState<'today' | '7d' | 'month' | 'year' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [saleChannel, setSaleChannel] = useState<'all' | 'online' | 'counter'>('all');
  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  if (period === '7d') periodStart.setDate(periodStart.getDate() - 6);
  if (period === 'month') periodStart.setDate(1);
  if (period === 'year') periodStart.setMonth(0, 1);
  const startKey = period === 'custom' && customStart ? customStart : periodStart.toISOString().slice(0, 10);
  const endKey = period === 'custom' && customEnd ? customEnd : new Date().toISOString().slice(0, 10);
  const periodTickets = ticketHistory.filter((ticket) => {
    const ticketKey = ticket.date || ticket.soldAt.slice(0, 10);
    return ticketKey >= startKey && ticketKey <= endKey;
  });
  const visibleTickets = saleChannel === 'all' ? periodTickets : periodTickets.filter((ticket) => ticket.soldBy === saleChannel);
  const onlineTickets = periodTickets.filter((t) => t.soldBy === 'online');
  const counterTickets = periodTickets.filter((t) => t.soldBy === 'counter');
  const onlineRevenue = onlineTickets.reduce((sum, t) => sum + t.amount, 0);
  const counterRevenue = counterTickets.reduce((sum, t) => sum + t.amount, 0);
  const channelTotal = Math.max(onlineTickets.length + counterTickets.length, 1);
  const totalRevenue = visibleTickets.reduce((sum, t) => sum + t.amount, 0);
  const totalCommission = visibleTickets.reduce((sum, t) => sum + (t.commissionAmount ?? 0), 0);
  const netRevenue = totalRevenue - totalCommission;
  const dailySales = getDailySales(visibleTickets);
  const maxDailyRevenue = Math.max(...dailySales.map(day => day.revenue), 1);
  const maxDailyTickets = Math.max(...dailySales.map(day => day.tickets), 1);
  const tripStatuses = [
    { label: 'En attente', count: trips.filter(t => t.status === 'scheduled' || t.status === 'boarding').length, color: '#f59e0b' },
    { label: 'En cours', count: trips.filter(t => t.status === 'in_transit').length, color: '#10b981' },
    { label: 'Terminés', count: trips.filter(t => t.status === 'completed').length, color: '#64748b' },
  ];
  const totalStatusTrips = Math.max(tripStatuses.reduce((sum, status) => sum + status.count, 0), 1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketHistoryItem | null>(null);
  const [selectedTripStatus, setSelectedTripStatus] = useState<'scheduled' | 'in_transit' | 'completed' | null>(null);
  const [selectedManagedTrip, setSelectedManagedTrip] = useState<TripData | null>(null);
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'tickets' | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const paymentMethods = Array.from(new Set(visibleTickets.map(ticket => ticket.paymentMethod)));
  const filteredTickets = selectedPaymentMethod ? visibleTickets.filter(ticket => ticket.paymentMethod === selectedPaymentMethod) : [];

  if (selectedTicket) return <TicketDetailView ticket={selectedTicket} branding={branding} onBack={() => setSelectedTicket(null)} />;

  if (selectedPaymentMethod) {
    return (
      <div className="fade-in">
        <button type="button" onClick={() => setSelectedPaymentMethod(null)} className="back-link"><ArrowLeft size={16} /> Retour aux statistiques</button>
        <div className="page-heading"><span className="hero-eyebrow">Ventes</span><h1>Passagers · {selectedPaymentMethod}</h1><p>Billets réglés avec ce moyen de paiement.</p></div>
        {filteredTickets.length === 0 ? <div className="empty-state"><Ticket size={48} /><p>Aucun passager pour ce moyen de paiement.</p></div> : (
          <div className="payment-passenger-list">
            {filteredTickets.map(ticket => (
              <button type="button" key={ticket.id} className="payment-passenger-item" onClick={() => setSelectedTicket(ticket)}>
                <span className="payment-passenger-main"><User size={18} /><span><strong>{ticket.passengerName}</strong><small>{ticket.tripLabel}</small></span></span>
                <span className="payment-passenger-meta"><small>{ticket.date} {ticket.time}</small><strong>{ticket.amount.toLocaleString()} FCFA</strong></span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (selectedManagedTrip) {
    return (
      <div className="fade-in">
        <button type="button" onClick={() => setSelectedManagedTrip(null)} className="back-link"><ArrowLeft size={16} /> Retour aux trajets</button>
        <div className="page-heading"><span className="hero-eyebrow">Gestion</span><h1>{selectedManagedTrip.depart} → {selectedManagedTrip.arrivee}</h1><p>Détails de la mission sélectionnée.</p></div>
        <div className="managed-trip-detail">
          <div><span>Statut</span><strong>{selectedManagedTrip.status === 'in_transit' ? 'En cours' : selectedManagedTrip.status === 'completed' ? 'Terminé' : 'En attente'}</strong></div>
          <div><span>Date et heure</span><strong>{selectedManagedTrip.date} à {selectedManagedTrip.time}</strong></div>
          <div><span>Station</span><strong>{selectedManagedTrip.station}</strong></div>
          <div><span>Places</span><strong>{selectedManagedTrip.availableSeats}/{selectedManagedTrip.totalSeats}</strong></div>
          <div><span>Prix</span><strong>{selectedManagedTrip.price.toLocaleString()} FCFA</strong></div>
          <div><span>Escales</span><strong>{selectedManagedTrip.stops.length ? selectedManagedTrip.stops.join(', ') : 'Aucune'}</strong></div>
        </div>
      </div>
    );
  }

  if (selectedDayKey) {
    const selectedDay = dailySales.find(day => day.key === selectedDayKey);
    const dayTickets = visibleTickets.filter(ticket => ticket.date === selectedDayKey || ticket.soldAt?.slice(0, 10) === selectedDayKey);
    const dayTrips = trips.filter(trip => trip.date === selectedDayKey || dayTickets.some(ticket => ticket.tripId === trip.id));
    const dayDrivers = drivers.filter(driver => dayTrips.some(trip => trip.driverId === driver.id));
    const dayVehicles = vehicles.filter(vehicle => dayTrips.some(trip => trip.vehicleId === vehicle.id));
    return (
      <div className="fade-in">
        <button type="button" onClick={() => setSelectedDayKey(null)} className="back-link"><ArrowLeft size={16} /> Retour aux graphiques</button>
        <div className="page-heading"><span className="hero-eyebrow">Analyse détaillée</span><h1>{selectedDay?.label} · {selectedDayKey}</h1><p>{selectedDay?.revenue.toLocaleString()} FCFA de revenus · {dayTickets.length} billet{dayTickets.length > 1 ? 's' : ''}</p></div>
        <div className="day-detail-grid">
          <div className="day-detail-section"><h3>Trajets</h3>{dayTrips.length === 0 ? <p className="empty-detail">Aucun trajet ce jour.</p> : dayTrips.map(trip => <button type="button" className="day-detail-item" key={trip.id} onClick={() => setSelectedManagedTrip(trip)}><span><strong>{trip.depart} → {trip.arrivee}</strong><small>{trip.time} · {trip.availableSeats}/{trip.totalSeats} places</small></span><span className={`pill pill-${trip.status === 'in_transit' ? 'green' : trip.status === 'completed' ? 'grey' : 'orange'}`}>{trip.status === 'in_transit' ? 'En cours' : trip.status === 'completed' ? 'Terminé' : 'En attente'}</span><ChevronRight size={16} /></button>)}</div>
          <div className="day-detail-section"><h3>Billets et passagers</h3>{dayTickets.length === 0 ? <p className="empty-detail">Aucun billet ce jour.</p> : dayTickets.map(ticket => <button type="button" className="day-detail-item" key={ticket.id} onClick={() => setSelectedTicket(ticket)}><span><strong>{ticket.passengerName}</strong><small>{ticket.tripLabel} · {ticket.paymentMethod}</small></span><strong>{ticket.amount.toLocaleString()} FCFA</strong><ChevronRight size={16} /></button>)}</div>
          <div className="day-detail-section"><h3>Flotte mobilisée</h3>{dayVehicles.length === 0 ? <p className="empty-detail">Aucun véhicule affecté.</p> : dayVehicles.map(vehicle => <div className="day-detail-item" key={vehicle.id}><span><strong>{vehicle.plate}</strong><small>{vehicle.brand} {vehicle.model} · {vehicle.capacity} places</small></span><Bus size={16} /></div>)}</div>
          <div className="day-detail-section"><h3>Chauffeurs affectés</h3>{dayDrivers.length === 0 ? <p className="empty-detail">Aucun chauffeur affecté.</p> : dayDrivers.map(driver => <div className="day-detail-item" key={driver.id}><span><strong>{driver.firstName} {driver.lastName}</strong><small>{driver.phone}</small></span><User size={16} /></div>)}</div>
        </div>
      </div>
    );
  }

  if (selectedChart) {
    const chartTitle = selectedChart === 'revenue' ? 'Détails des revenus' : 'Détails des billets vendus';
    return (
      <div className="fade-in">
        <button type="button" onClick={() => setSelectedChart(null)} className="back-link"><ArrowLeft size={16} /> Retour aux statistiques</button>
        <div className="page-heading"><span className="hero-eyebrow">Analyse détaillée</span><h1>{chartTitle}</h1><p>Activité des sept derniers jours.</p></div>
        <div className="chart-detail-list">
          {dailySales.slice().reverse().map(day => {
            const dayTickets = ticketHistory.filter(ticket => ticket.date === day.key || ticket.soldAt?.slice(0, 10) === day.key);
            return <div className="chart-detail-row" key={day.key} role="button" tabIndex={0} onClick={() => setSelectedDayKey(day.key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedDayKey(day.key); }}><span><strong>{day.label}</strong><small>{day.key}</small></span>{selectedChart === 'revenue' ? <strong>{day.revenue.toLocaleString()} FCFA</strong> : <strong>{day.tickets} billet{day.tickets > 1 ? 's' : ''}</strong>}<ChevronRight size={16} className="chart-detail-arrow" />{selectedChart === 'tickets' && dayTickets.length > 0 && <div className="chart-detail-passengers">{dayTickets.map(ticket => <button type="button" key={ticket.id} onClick={(event) => { event.stopPropagation(); setSelectedTicket(ticket); }}><User size={14} /> {ticket.passengerName}<small>{ticket.paymentMethod}</small></button>)}</div>}</div>;
          })}
        </div>
      </div>
    );
  }

  return renderStatsMain();

  function renderStatsMain() {
    return (
      <div className="fade-in">
        <div className="page-heading">
          <span className="hero-eyebrow">Analyse financière</span>
          <h1>Gestion des revenus et billets</h1>
          <p>Suivez vos encaissements par période, canal et moyen de paiement.</p>
        </div>

        {stats && (
          <p className="text-sm text-slate-500 mb-4">
            Totaux serveur (toutes ventes) : {stats.totalSales.toLocaleString()} FCFA de ventes · {stats.totalTickets} billet{stats.totalTickets > 1 ? 's' : ''} · {stats.totalCommission.toLocaleString()} FCFA de commission Vitoo · {stats.totalNet.toLocaleString()} FCFA nets pour votre compagnie.
          </p>
        )}

        <div className="stats-filters glass">
          <div className="stats-filter-group"><span>Période</span><div className="stats-filter-buttons">{(['today', '7d', 'month', 'year'] as const).map(value => <button type="button" key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{value === 'today' ? "Aujourd'hui" : value === '7d' ? '7 jours' : value === 'month' ? 'Ce mois' : 'Cette année'}</button>)}</div></div>
          <div className="stats-filter-group"><span>Dates personnalisées</span><div className="stats-date-fields"><input type="date" value={customStart} onChange={(event) => { setCustomStart(event.target.value); setPeriod('custom'); }} /><span>à</span><input type="date" value={customEnd} onChange={(event) => { setCustomEnd(event.target.value); setPeriod('custom'); }} /></div></div>
          <div className="stats-filter-group"><span>Canal de vente</span><select value={saleChannel} onChange={(event) => setSaleChannel(event.target.value as typeof saleChannel)}><option value="all">Tous les canaux</option><option value="online">En ligne</option><option value="counter">Guichet</option></select></div>
        </div>

        <div className="stats-detail-grid">
          <div className="stat-detail-card glass">
            <div className="stat-detail-icon" style={{ background: `${primaryColor}20`, color: primaryColor }}><TrendingUp size={24} /></div>
            <div className="stat-detail-value">{totalRevenue.toLocaleString()}</div>
            <div className="stat-detail-label">Revenus total (FCFA)</div>
          </div>
          <div className="stat-detail-card glass">
            <div className="stat-detail-icon" style={{ background: '#10b98120', color: '#10b981' }}><Banknote size={24} /></div>
            <div className="stat-detail-value">{netRevenue.toLocaleString()}</div>
            <div className="stat-detail-label">Net compagnie (FCFA)</div>
          </div>
          <div className="stat-detail-card glass">
            <div className="stat-detail-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}><CreditCard size={24} /></div>
            <div className="stat-detail-value">{totalCommission.toLocaleString()}</div>
            <div className="stat-detail-label">Commission Vitoo (FCFA)</div>
          </div>
          <div className="stat-detail-card glass">
            <div className="stat-detail-icon" style={{ background: '#8b5cf620', color: '#8b5cf6' }}><Ticket size={24} /></div>
            <div className="stat-detail-value">{visibleTickets.length}</div>
            <div className="stat-detail-label">Billets vendus ({saleChannel === 'online' ? 'en ligne' : saleChannel === 'counter' ? 'au guichet' : 'total'})</div>
          </div>
        </div>

        <div className="stats-breakdown glass chart-card">
          <div className="chart-header"><div><h3 className="section-title">Ventes : en ligne vs guichet</h3><p>Répartition réelle des billets vendus sur la période</p></div><Ticket size={18} style={{ color: '#3b82f6' }} /></div>
          <div className="channel-breakdown">
            <button type="button" className={`channel-row ${saleChannel === 'online' ? 'active' : ''}`} onClick={() => setSaleChannel(saleChannel === 'online' ? 'all' : 'online')}>
              <span className="channel-icon">🌐</span>
              <div className="channel-info">
                <strong>En ligne</strong>
                <small>Réservations des passagers</small>
              </div>
              <div className="channel-bar"><div className="bar-fill" style={{ width: `${(onlineTickets.length / channelTotal) * 100}%`, background: '#3b82f6' }} /></div>
              <div className="channel-nums"><strong>{onlineTickets.length}</strong><small>{onlineRevenue.toLocaleString()} FCFA</small></div>
            </button>
            <button type="button" className={`channel-row ${saleChannel === 'counter' ? 'active' : ''}`} onClick={() => setSaleChannel(saleChannel === 'counter' ? 'all' : 'counter')}>
              <span className="channel-icon">🏪</span>
              <div className="channel-info">
                <strong>Guichet</strong>
                <small>Ventes au comptoir</small>
              </div>
              <div className="channel-bar"><div className="bar-fill" style={{ width: `${(counterTickets.length / channelTotal) * 100}%`, background: '#f59e0b' }} /></div>
              <div className="channel-nums"><strong>{counterTickets.length}</strong><small>{counterRevenue.toLocaleString()} FCFA</small></div>
            </button>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="stats-breakdown glass chart-card">
            <div className="chart-header"><div><h3 className="section-title">Revenus sur 7 jours</h3><p>Évolution quotidienne en FCFA</p></div><TrendingUp size={18} style={{ color: primaryColor }} /></div>
            <div className="line-chart" role="img" aria-label="Graphique des revenus des sept derniers jours">
              <div className="chart-y-labels"><span>{maxDailyRevenue.toLocaleString()}</span><span>{Math.round(maxDailyRevenue / 2).toLocaleString()}</span><span>0</span></div>
              <svg className="interactive-chart" viewBox="0 0 700 220" preserveAspectRatio="none" onClick={() => setSelectedChart('revenue')}>
                <line x1="0" y1="20" x2="700" y2="20" /><line x1="0" y1="110" x2="700" y2="110" /><line x1="0" y1="200" x2="700" y2="200" />
                <polyline points={dailySales.map((day, index) => `${index * 113.33 + 10},${200 - (day.revenue / maxDailyRevenue) * 170}`).join(' ')} fill="none" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {dailySales.map((day, index) => <circle key={day.key} cx={index * 113.33 + 10} cy={200 - (day.revenue / maxDailyRevenue) * 170} r="5" fill="white" stroke={primaryColor} strokeWidth="3"><title>{day.label}: {day.revenue.toLocaleString()} FCFA</title></circle>)}
              </svg>
            </div>
            <div className="chart-x-labels">{dailySales.map(day => <span key={day.key}>{day.label}</span>)}</div>
          </div>

          <div className="stats-breakdown glass chart-card">
            <div className="chart-header"><div><h3 className="section-title">Billets vendus</h3><p>Volume quotidien</p></div><Ticket size={18} style={{ color: '#f59e0b' }} /></div>
            <div className="bar-chart interactive-chart" role="img" aria-label="Graphique des billets vendus sur les sept derniers jours" onClick={() => setSelectedChart('tickets')}>
              {dailySales.map(day => <div className="bar-column" key={day.key}><span>{day.tickets || ''}</span><div className="bar-column-fill" style={{ height: `${(day.tickets / maxDailyTickets) * 100}%`, background: primaryColor }} /><small>{day.label}</small></div>)}
            </div>
          </div>
        </div>

        <div className="stats-breakdown glass chart-card">
          <div className="chart-header"><div><h3 className="section-title">Statut des trajets</h3><p>Vue globale de vos missions</p></div><Bus size={18} style={{ color: '#10b981' }} /></div>
          <div className="status-chart"><div className="status-track">{tripStatuses.map(status => <button type="button" key={status.label} aria-label={`Afficher les trajets ${status.label}`} onClick={() => setSelectedTripStatus(status.label === 'En cours' ? 'in_transit' : status.label === 'Terminés' ? 'completed' : 'scheduled')} style={{ width: `${(status.count / totalStatusTrips) * 100}%`, background: status.color }} />)}</div><div className="status-legend">{tripStatuses.map(status => <button type="button" key={status.label} onClick={() => setSelectedTripStatus(status.label === 'En cours' ? 'in_transit' : status.label === 'Terminés' ? 'completed' : 'scheduled')}><span className="status-dot" style={{ background: status.color }} /><strong>{status.count}</strong><small>{status.label}</small></button>)}</div></div>
        </div>

        {selectedTripStatus && (
          <div className="stats-breakdown glass management-panel">
            <div className="chart-header"><div><h3 className="section-title">Gestion des trajets</h3><p>{selectedTripStatus === 'in_transit' ? 'Trajets en cours' : selectedTripStatus === 'completed' ? 'Trajets terminés' : 'Trajets en attente'}</p></div><button type="button" className="icon-btn" onClick={() => setSelectedTripStatus(null)} aria-label="Fermer">×</button></div>
            <div className="managed-trip-list">
              {trips.filter(trip => selectedTripStatus === 'scheduled' ? trip.status === 'scheduled' || trip.status === 'boarding' : trip.status === selectedTripStatus).length === 0 ? <p className="empty-detail">Aucun trajet dans cette catégorie.</p> : trips.filter(trip => selectedTripStatus === 'scheduled' ? trip.status === 'scheduled' || trip.status === 'boarding' : trip.status === selectedTripStatus).map(trip => <button type="button" className="managed-trip-item" key={trip.id} onClick={() => setSelectedManagedTrip(trip)}><span><strong>{trip.depart} → {trip.arrivee}</strong><small>{trip.date} à {trip.time} · {trip.availableSeats}/{trip.totalSeats} places</small></span><ChevronRight size={16} /></button>)}
            </div>
          </div>
        )}

        <div className="stats-breakdown glass">
          <h3 className="section-title">Répartition par moyen de paiement</h3>
          <div className="breakdown-bars">
            {paymentMethods.length === 0 ? <p className="empty-detail">Aucune vente enregistrée.</p> : paymentMethods.map((method, index) => {
              const count = ticketHistory.filter(ticket => ticket.paymentMethod === method).length;
              return <button type="button" key={method} className="breakdown-item breakdown-item-button" onClick={() => setSelectedPaymentMethod(method)}><div className="breakdown-label"><span className={`dot ${index % 2 ? 'orange' : 'blue'}`} /> {method} ({count})</div><div className="breakdown-bar"><div className="bar-fill" style={{ width: `${ticketHistory.length ? (count / ticketHistory.length) * 100 : 0}%`, background: index % 2 ? '#f59e0b' : primaryColor }} /></div><div className="breakdown-value">{count}</div></button>;
            })}
          </div>
        </div>

        <div className="stats-breakdown glass">
          <h3 className="section-title">Résumé des trajets</h3>
          <div className="breakdown-bars">
            <div className="breakdown-item">
              <div className="breakdown-label"><span className="dot green" /> Trajets actifs</div>
              <div className="breakdown-value">{trips.filter(t => t.status !== 'completed').length}</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label"><span className="dot grey" /> Trajets terminés</div>
              <div className="breakdown-value">{trips.filter(t => t.status === 'completed').length}</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label"><span className="dot blue" /> Total trajets</div>
              <div className="breakdown-value">{trips.length}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
