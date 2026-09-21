import React, { useState, useEffect, useCallback } from 'react';
import { getDriversApi, addDriverApi, updateDriverApi, deleteDriverApi, type DriverData } from '../../api/companyApi';
import { getVehiclesApi, addVehicleApi, updateVehicleApi, deleteVehicleApi, type VehicleData } from '../../api/companyApi';
import { getTripsApi, addTripApi, updateTripApi, type TripData } from '../../api/companyApi';
import { getStatsApi, sellTicketApi, getTicketsApi, type CompanyStats } from '../../api/companyApi';
import type { TicketData } from '../../api/companyApi';
import { updateCompanyProfileApi, getCompanyProfileApi } from '../../api/companyAuthApi';
import { COMPANY_SESSION_KEY } from '../../api/sessionKeys';
import { Building2, Bus, Ticket, BarChart3, Settings, User, Menu, X as XClose, TrendingUp, Radio } from 'lucide-react';
import type { UserSession } from '../../auth/passenger/types/auth';
import { CompanyProfile } from '../profile/CompanyProfile';
import { CompanySettings } from '../settings/CompanySettings';
import { OverviewTab } from './tabs/OverviewTab';
import { TripsTabFull } from './tabs/TripsTabFull';
import { TicketsTabFull } from './tabs/TicketsTabFull';
import { StatsTabFull } from './tabs/StatsTabFull';
import { TrackingTab } from './tabs/TrackingTab';
import type { CompanyBranding, TicketHistoryItem } from './dashboardShared';
import { normalizePaymentMethods } from './paymentMethods';

const BRANDING_KEY = 'vitoo_company_branding';

export type { TicketHistoryItem };

const mapTickets = (tickets: TicketData[], trips: TripData[]): TicketHistoryItem[] => {
  const tripMap = new Map(trips.map(t => [t.id, t]));
  return tickets.map((ticket) => {
    const trip = tripMap.get(ticket.tripId);
    return {
      id: ticket.id,
      code: ticket.code,
      tripId: ticket.tripId,
      tripLabel: trip ? `${trip.depart} → ${trip.arrivee}` : 'Trajet',
      depart: trip?.depart || '',
      arrivee: trip?.arrivee || '',
      date: trip?.date || '',
      time: trip?.time || '',
      passengerName: ticket.passengerName,
      passengerPhone: ticket.passengerPhone,
      seatNumber: ticket.seatNumber,
      amount: ticket.amount,
      paymentMethod: ticket.paymentMethod,
      soldBy: ticket.soldBy === 'counter' ? 'Guichet' : 'En ligne',
      soldAt: ticket.createdAt,
      commissionAmount: ticket.commissionAmount,
      status: ticket.status === 'used' ? 'boarded' : 'paid',
    };
  });
};

export type CompanyTab = 'overview' | 'trips' | 'tickets' | 'tracking' | 'stats' | 'profile' | 'settings';
export type ProfileSection = 'info' | 'branding' | 'drivers' | 'vehicles';
export type TripFormPayload = { depart: string; arrivee: string; station: string; time: string; date: string; price: number; totalSeats: number; vehicleId: string; driverId: string; paymentMethods: string[]; stops: string[] };
export type SellTicketPayload = { tripId: string; passengerName: string; passengerPhone: string; paymentMethod: string };

export interface CompanyDashboardProps {
  onLogout?: () => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<CompanyTab>('overview');
  const [profileSection, setProfileSection] = useState<ProfileSection>('info');
  const [focusedTripId, setFocusedTripId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try { const raw = localStorage.getItem(COMPANY_SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [branding, setBranding] = useState<CompanyBranding>(() => {
    try {
      const raw = localStorage.getItem(BRANDING_KEY);
      const session = localStorage.getItem(COMPANY_SESSION_KEY);
      const savedBranding = raw ? JSON.parse(raw) : {};
      const user = session ? JSON.parse(session) as UserSession : null;
      return { ...savedBranding, companyName: savedBranding.companyName || user?.companyName || user?.lastName, logo: savedBranding.logo || user?.companyLogo, primaryColor: savedBranding.primaryColor || user?.primaryColor, secondaryColor: savedBranding.secondaryColor || user?.secondaryColor, paymentMethods: normalizePaymentMethods(savedBranding.paymentMethods || user?.paymentMethods) };
    } catch { return {}; }
  });
  const [ticketHistory, setTicketHistory] = useState<TicketHistoryItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: { id: CompanyTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Aperçu', icon: <BarChart3 size={18} /> },
    { id: 'trips', label: 'Trajets', icon: <Bus size={18} /> },
    { id: 'tickets', label: 'Guichet', icon: <Ticket size={18} /> },
    { id: 'tracking', label: 'Suivi', icon: <Radio size={18} /> },
    { id: 'stats', label: 'Statistiques', icon: <TrendingUp size={18} /> },
    { id: 'profile', label: 'Profil', icon: <User size={18} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={18} /> },
  ];

  const loadData = useCallback(async () => {
    try {
      const [driversRes, vehiclesRes, tripsRes, statsRes, ticketsRes] = await Promise.all([
        getDriversApi(),
        getVehiclesApi(),
        getTripsApi(),
        getStatsApi(),
        getTicketsApi(),
      ]);
      setDrivers(driversRes.drivers);
      setVehicles(vehiclesRes.vehicles);
      setTrips(tripsRes.trips);
      setStats(statsRes.stats);
      setTicketHistory(mapTickets(ticketsRes.tickets, tripsRes.trips));
    } catch (err) {
      console.error('Erreur chargement données:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const user = await getCompanyProfileApi();
      setCurrentUser(user);
      setBranding((prev) => ({
        ...prev,
        companyName: user.companyName || user.lastName,
        logo: user.companyLogo || prev.logo,
        primaryColor: user.primaryColor || prev.primaryColor,
        secondaryColor: user.secondaryColor || prev.secondaryColor,
        paymentMethods: normalizePaymentMethods(user.paymentMethods),
      }));
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [driversRes, vehiclesRes, tripsRes, statsRes, ticketsRes] = await Promise.all([
          getDriversApi(),
          getVehiclesApi(),
          getTripsApi(),
          getStatsApi(),
          getTicketsApi(),
        ]);
        if (mounted) {
          setDrivers(driversRes.drivers);
          setVehicles(vehiclesRes.vehicles);
          setTrips(tripsRes.trips);
          setStats(statsRes.stats);
          setTicketHistory(mapTickets(ticketsRes.tickets, tripsRes.trips));
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    void fetchAll();
    // Charge le profil compagnie au montage (setState initial voulu).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshProfile();
    return () => { mounted = false; };
  }, [refreshProfile]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => { void loadData(); }, 15000);
    return () => window.clearInterval(refreshTimer);
  }, [loadData]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    window.location.href = '/';
  };

  const handleBrandingUpdate = async (b: CompanyBranding) => {
    setBranding(b);
    localStorage.setItem(BRANDING_KEY, JSON.stringify(b));
    try {
      await updateCompanyProfileApi({
        companyName: b.companyName,
        companyLogo: b.logo,
        primaryColor: b.primaryColor,
        secondaryColor: b.secondaryColor,
        paymentMethods: b.paymentMethods,
      });
      const session = localStorage.getItem(COMPANY_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        localStorage.setItem(COMPANY_SESSION_KEY, JSON.stringify({ ...parsed, ...b }));
      }
    } catch (err) {
      console.error('Erreur sauvegarde branding:', err);
    }
  };

  const handleAddDriver = async (driver: Omit<DriverData, 'id' | 'companyId' | 'status'>) => {
    try {
      const res = await addDriverApi(driver);
      setDrivers(prev => [...prev, res.driver]);
      alert('Chauffeur ajouté. Son espace chauffeur est maintenant actif sur son compte passager.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Impossible d\'ajouter le chauffeur.');
    }
  };

  const handleUpdateDriver = async (id: string, data: Partial<DriverData>) => {
    try {
      const res = await updateDriverApi(id, data);
      setDrivers(prev => prev.map(d => d.id === id ? res.driver : d));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVehicle = async (vehicle: Omit<VehicleData, 'id' | 'companyId' | 'status'>) => {
    try {
      const res = await addVehicleApi(vehicle);
      setVehicles(prev => [...prev, res.vehicle]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateVehicle = async (id: string, data: Partial<VehicleData>) => {
    try {
      const res = await updateVehicleApi(id, data);
      setVehicles(prev => prev.map(v => v.id === id ? res.vehicle : v));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    try {
      await deleteDriverApi(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteVehicleApi(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTrip = async (trip: TripFormPayload) => {
    try {
      await addTripApi(trip);
      const tripsRes = await getTripsApi();
      setTrips(tripsRes.trips);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSellTicket = async (data: SellTicketPayload) => {
    try {
      await sellTicketApi({ ...data, soldBy: 'counter' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = branding.companyName || currentUser?.companyName || currentUser?.lastName || 'Ma Compagnie';
  const primaryColor = branding.primaryColor || '#1d5df5';

  return (
    <div
      className="company-shell"
      translate="no"
      style={{
        '--company-primary': primaryColor,
        '--company-secondary': branding.secondaryColor || '#f8fafc',
        '--company-name': JSON.stringify(displayName),
      } as React.CSSProperties}
    >
      <header className="company-header">
        <div className="company-header-inner">
          <button className="company-brand" onClick={() => setActiveTab('overview')}>
            {branding.logo ? (
              <img src={branding.logo} alt={displayName} className="company-logo" />
            ) : (
              <div className="company-logo-fallback">
                <Building2 size={20} />
              </div>
            )}
            <span className="company-name">{displayName}</span>
          </button>

          <nav className="company-nav">
            {tabs.map((tab) => (
              <button key={tab.id} className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="company-header-actions">
            <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <XClose size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="mobile-nav">
            {tabs.map((tab) => (
              <button key={tab.id} className={`mobile-nav-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="company-content">
        {activeTab === 'overview' && <OverviewTab trips={trips} stats={stats} drivers={drivers} vehicles={vehicles} ticketHistory={ticketHistory} onNavigate={setActiveTab} onProfileSection={setProfileSection} primaryColor={primaryColor} />}
        {activeTab === 'trips' && <TripsTabFull trips={trips} drivers={drivers} vehicles={vehicles} initialTripId={focusedTripId} onAddTrip={handleAddTrip} branding={branding} />}
        {activeTab === 'tickets' && <TicketsTabFull trips={trips} ticketHistory={ticketHistory} onSellTicket={handleSellTicket} branding={branding} />}
        {activeTab === 'tracking' && <TrackingTab trips={trips} />}
        {activeTab === 'stats' && <StatsTabFull stats={stats} ticketHistory={ticketHistory} trips={trips} drivers={drivers} vehicles={vehicles} primaryColor={primaryColor} branding={branding} />}
        {activeTab === 'profile' && <CompanyProfile initialSection={profileSection} currentUser={currentUser} onUserUpdate={setCurrentUser} drivers={drivers} vehicles={vehicles} trips={trips} onActiveMissionSelect={(trip) => { setFocusedTripId(trip.id); setActiveTab('trips'); }} onAddDriver={handleAddDriver} onAddVehicle={handleAddVehicle} onUpdateDriver={handleUpdateDriver} onUpdateVehicle={handleUpdateVehicle} onUpdateTrip={async (id, data) => { await updateTripApi(id, data); setTrips((previous) => previous.map((trip) => trip.id === id ? { ...trip, ...data } : trip)); }} onDeleteDriver={handleDeleteDriver} onDeleteVehicle={handleDeleteVehicle} branding={branding} onBrandingUpdate={handleBrandingUpdate} />}
        {activeTab === 'settings' && <CompanySettings currentUser={currentUser} onUserUpdate={setCurrentUser} onLogout={handleLogout} onBrandingUpdate={handleBrandingUpdate} />}
      </main>
    </div>
  );
};
