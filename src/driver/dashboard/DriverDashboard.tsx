import React, { useCallback, useEffect, useState } from 'react';
import { Car, LogOut, Menu, MessageCircle, Route as RouteIcon, Settings as SettingsIcon, ShoppingBag, User } from 'lucide-react';
import { getDriverMessagesApi, getDriverTripsApi, type TripData } from '../../api/driverApi';
import type { UserSession } from '../../auth/passenger/types/auth';
import { AppSettings } from '../../passenger/settings/AppSettings';
import { MissionsList } from '../missions/MissionsList';
import { MissionDetail } from '../missions/MissionDetail';
import { ScanScreen } from '../scan/ScanScreen';
import { DriverMessages } from '../messages/DriverMessages';
import { DriverAlert } from '../incident/DriverAlert';
import { DriverTracking } from '../tracking/DriverTracking';
import { DriverProfile } from '../profile/DriverProfile';

type Tab = 'missions' | 'messages' | 'profile' | 'settings';
type Screen = { kind: 'detail' | 'scan' | 'incident' | 'tracking'; tripId: string } | null;

export const DriverDashboard: React.FC<{
  currentUser: UserSession;
  onLogout: () => void;
  onCurrentUserChange: (updated: UserSession) => void;
}> = ({ currentUser, onLogout, onCurrentUserChange }) => {
  const [tab, setTab] = useState<Tab>('missions');
  const [screen, setScreen] = useState<Screen>(null);
  const [chatTrip, setChatTrip] = useState<string | undefined>(undefined);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const refreshTrips = useCallback(async () => {
    try {
      const res = await getDriverTripsApi();
      setTrips(res.trips);
    } catch {
      /* le badge 401 est géré par l'API */
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    void refreshTrips();
    return () => undefined;
  }, [refreshTrips]);

  useEffect(() => {
    const refreshUnread = async () => {
      try {
        const res = await getDriverMessagesApi();
        setUnread(res.messages.filter((m) => m.sender === 'company' && !m.read).length);
      } catch {
        /* ignore */
      }
    };
    void refreshUnread();
    const timer = window.setInterval(() => {
      void refreshUnread();
      void refreshTrips();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [refreshTrips]);

  const logout = () => {
    onLogout();
    window.location.href = '/';
  };

  const driverSpace = currentUser.driverSpace;
  const statusLabel = driverSpace?.status === 'on_trip' ? 'En trajet' : driverSpace?.status === 'off_duty' ? 'Indisponible' : 'Disponible';

  const navItems: Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'missions', label: 'Missions', icon: <RouteIcon size={18} /> },
    { id: 'messages', label: 'Messages', icon: <MessageCircle size={18} />, badge: unread },
    { id: 'profile', label: 'Profil', icon: <User size={18} /> },
    { id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={18} /> },
  ];

  const showTab = (next: Tab) => {
    setTab(next);
    setScreen(null);
    setMobileOpen(false);
  };

  let content: React.ReactNode;
  if (screen?.kind === 'detail') {
    content = (
      <MissionDetail
        tripId={screen.tripId}
        onBack={() => setScreen(null)}
        onScan={(tripId) => setScreen({ kind: 'scan', tripId })}
        onIncident={(tripId) => setScreen({ kind: 'incident', tripId })}
        onTracking={(tripId) => setScreen({ kind: 'tracking', tripId })}
        onChat={(tripId) => { setChatTrip(tripId); setScreen(null); setTab('messages'); }}
        onChanged={refreshTrips}
      />
    );
  } else if (screen?.kind === 'scan') {
    content = <ScanScreen tripId={screen.tripId} onBack={() => setScreen({ kind: 'detail', tripId: screen.tripId })} />;
  } else if (screen?.kind === 'incident') {
    content = <DriverAlert tripId={screen.tripId} onBack={() => setScreen({ kind: 'detail', tripId: screen.tripId })} />;
  } else if (screen?.kind === 'tracking') {
    content = (
      <DriverTracking
        tripId={screen.tripId}
        onBack={() => setScreen({ kind: 'detail', tripId: screen.tripId })}
        onFinished={() => { setScreen({ kind: 'detail', tripId: screen.tripId }); void refreshTrips(); }}
      />
    );
  } else if (tab === 'missions') {
    content = <MissionsList trips={trips} loading={loadingTrips} onSelect={(trip) => setScreen({ kind: 'detail', tripId: trip.id })} />;
  } else if (tab === 'messages') {
    content = <DriverMessages tripContext={chatTrip} />;
  } else if (tab === 'profile') {
    content = <DriverProfile currentUser={currentUser} onCurrentUserChange={onCurrentUserChange} onLogout={logout} />;
  } else {
    content = <AppSettings onLogout={logout} onNotifications={() => { setChatTrip(undefined); setTab('messages'); }} />;
  }

  return (
    <div className="driver-shell">
      <header className="driver-header">
        <div className="driver-header-inner">
          <div className="driver-brand">
            <span className="driver-avatar"><Car size={20} /></span>
            <div>
              <span className="driver-name">{currentUser.firstName} {currentUser.lastName}</span>
              <span className="driver-status-badge">{driverSpace?.companyName ? `${statusLabel} · ${driverSpace.companyName}` : statusLabel}</span>
            </div>
          </div>

          <nav className="driver-nav">
            {navItems.map((item) => (
              <button key={item.id} type="button" className={`nav-btn ${tab === item.id && !screen ? 'active' : ''}`} onClick={() => showTab(item.id)}>
                {item.icon} {item.label}
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </button>
            ))}
          </nav>

          <div className="driver-header-actions">
            <button type="button" className="logout-btn" onClick={() => { window.location.href = '/passenger'; }}><ShoppingBag size={16} /> Espace passager</button>
            <button type="button" className="logout-btn" onClick={logout}><LogOut size={16} /> Déconnexion</button>
            <button type="button" className="mobile-menu-btn" onClick={() => setMobileOpen((v) => !v)}>{mobileOpen ? <Menu size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <button key={item.id} type="button" className={`mobile-nav-btn ${tab === item.id && !screen ? 'active' : ''}`} onClick={() => showTab(item.id)}>
              {item.icon} {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
          <button type="button" className="mobile-nav-btn" onClick={() => { window.location.href = '/passenger'; }}><ShoppingBag size={18} /> Espace passager</button>
          <button type="button" className="mobile-nav-btn" onClick={logout}><LogOut size={18} /> Déconnexion</button>
        </div>
      </header>

      <main className="driver-content">
        {content}
      </main>
    </div>
  );
};