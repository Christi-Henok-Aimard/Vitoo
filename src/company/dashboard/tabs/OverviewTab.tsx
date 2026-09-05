import React from 'react';
import { Bus, Ticket, Users, BarChart3, ChevronRight } from 'lucide-react';
import type { DriverData, TripData, VehicleData } from '../../../api/companyApi';
import type { CompanyStats } from '../../../api/companyApi';
import type { CompanyBranding, TicketHistoryItem } from '../dashboardShared';
import type { CompanyTab } from '../CompanyDashboard';

type ProfileSection = 'info' | 'branding' | 'drivers' | 'vehicles';

interface Props {
  trips: TripData[];
  stats: CompanyStats | null;
  drivers: DriverData[];
  vehicles: VehicleData[];
  ticketHistory: TicketHistoryItem[];
  onNavigate: (tab: CompanyTab) => void;
  onProfileSection: (section: ProfileSection) => void;
  primaryColor: string;
}

export const OverviewTab: React.FC<Props> = ({ trips, stats, drivers, vehicles, ticketHistory, onNavigate, onProfileSection }) => {
  const activeTrips = trips.filter(t => t.status !== 'completed');
  const recentTickets = ticketHistory.slice(0, 5);

  return (
    <div className="fade-in">
      <div className="page-heading">
        <span className="hero-eyebrow">Tableau de bord</span>
        <h1>Aperçu</h1>
        <p>Vue d'ensemble de votre activité. Cliquez sur une carte pour voir les détails.</p>
      </div>

      <div className="stats-grid">
        <button className="stat-card stat-blue clickable" onClick={() => onNavigate('trips')}>
          <Bus size={24} />
          <div className="stat-value">{stats?.activeTrips ?? activeTrips.length}</div>
          <div className="stat-label">Trajets actifs</div>
          <ChevronRight size={14} className="stat-chevron" />
        </button>
        <button className="stat-card stat-green clickable" onClick={() => onNavigate('tickets')}>
          <Ticket size={24} />
          <div className="stat-value">{ticketHistory.length}</div>
          <div className="stat-label">Billets vendus</div>
          <ChevronRight size={14} className="stat-chevron" />
        </button>
        <button className="stat-card stat-orange clickable" onClick={() => { onNavigate('profile'); onProfileSection('drivers'); }}>
          <Users size={24} />
          <div className="stat-value">{drivers.length}</div>
          <div className="stat-label">Chauffeurs</div>
          <ChevronRight size={14} className="stat-chevron" />
        </button>
        <button className="stat-card stat-purple clickable" onClick={() => { onNavigate('profile'); onProfileSection('vehicles'); }}>
          <BarChart3 size={24} />
          <div className="stat-value">{vehicles.length}</div>
          <div className="stat-label">Véhicules</div>
          <ChevronRight size={14} className="stat-chevron" />
        </button>
      </div>

      {/* Active trips preview */}
      {activeTrips.length > 0 && (
        <div className="mt-6">
          <div className="section-header">
            <h3 className="section-title">Trajets en cours</h3>
            <button className="text-link" onClick={() => onNavigate('trips')}>Voir tout →</button>
          </div>
          <div className="overview-trips">
            {activeTrips.slice(0, 3).map((trip) => (
              <div key={trip.id} className="overview-trip-card" onClick={() => onNavigate('trips')}>
                <div className="overview-trip-status">
                  <span className={`status-dot ${trip.status === 'in_transit' ? 'active' : 'pending'}`} />
                  <span className="text-sm font-medium">{trip.status === 'in_transit' ? 'En cours' : 'En attente'}</span>
                </div>
                <div className="overview-trip-route">{trip.depart} → {trip.arrivee}</div>
                <div className="overview-trip-meta">{trip.date} à {trip.time}</div>
                <div className="overview-trip-seats">{trip.availableSeats}/{trip.totalSeats} places</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tickets */}
      {recentTickets.length > 0 && (
        <div className="mt-6">
          <div className="section-header">
            <h3 className="section-title">Ventes récentes</h3>
            <button className="text-link" onClick={() => onNavigate('tickets')}>Voir tout →</button>
          </div>
          <div className="recent-tickets">
            {recentTickets.map((t) => (
              <div key={t.id} className="recent-ticket-item" onClick={() => onNavigate('tickets')}>
                <div><strong>{t.passengerName}</strong> <span className="text-slate-500">{t.tripLabel}</span></div>
                <div className="text-sm text-slate-500">{new Date(t.soldAt).toLocaleString('fr-FR')}</div>
                <div className="font-bold text-green-600">{t.amount} FCFA</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export type { CompanyBranding };
