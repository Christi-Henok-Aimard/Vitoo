import React, { useEffect, useState } from 'react';
import { ActiveTripBanner } from './ActiveTripBanner';
import { TripSearchHead } from '../search/TripSearchHead';
import { TripCard } from '../search/TripCard';
import { TripDetail } from '../trip/TripDetail';
import { BookingFlow } from '../booking/BookingFlow';
import { Rating } from '../trip/Rating';
import { Ticket, TicketPreview } from '../booking/Ticket';
import { MapTrackingView } from '../tracking/MapTrackingView';
import { UserProfile } from '../profile/UserProfile';
import { AppSettings } from '../settings/AppSettings';
import { useTrips } from '../../hooks/useTrips';
import { useBooking } from '../../hooks/useBooking';
import { fetchMyBookingsApi, completeBookingApi, rateTripApi } from '../../api/bookingApi';
import { fetchCompaniesApi } from '../../api/tripApi';
import { getMyMessagesApi, type CompanyMessage } from '../../api/authApi';
import type { Trip } from '../../types/trip';
import type { PaymentMethod } from '../../types/booking';
import type { Booking } from '../../types/booking';
import { Bell, ChevronDown, Compass, ClipboardList } from 'lucide-react';
import type { UserSession } from '../../auth/passenger/types/auth';
import { useTranslation } from '../../settings/settingsHooks.js';

// Définition de l'interface des Props
interface PassengerDashboardProps {
  currentUser?: UserSession;
  onLogout?: () => void;
  onCurrentUserChange?: (updated: UserSession) => void;
}

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({ currentUser, onLogout, onCurrentUserChange }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'reservations' | 'tickets' | 'tracking' | 'profile' | 'settings' | 'notifications'>('search');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('Toutes les compagnies');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showArrivalRating, setShowArrivalRating] = useState(false);
  const [tripRatingSaved, setTripRatingSaved] = useState(false);
  const [hasRatedCurrentTrip, setHasRatedCurrentTrip] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyMessages, setCompanyMessages] = useState<CompanyMessage[]>([]);
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('recommended');

  const t = useTranslation();
  const { trips, loading, searchTrips } = useTrips();
  const { booking, confirmBooking, loading: isBookingLoading, resetBooking } = useBooking();

  // Charge les réservations réelles du passager depuis le serveur
  useEffect(() => {
    if (!currentUser?.id) return;
    void fetchMyBookingsApi().then((serverBookings) => {
      const completed = serverBookings.filter((b) => b.status === 'completed');
      setCompletedBookings(completed);
    }).catch(() => undefined);
    void fetchCompaniesApi().then(setCompanies).catch(() => setCompanies([]));
  }, [currentUser?.id]);

  const reloadMessages = () => {
    if (!currentUser?.id) return;
    void getMyMessagesApi().then((res) => setCompanyMessages(res.messages)).catch(() => undefined);
  };

  useEffect(() => { reloadMessages(); }, [currentUser?.id]);

  useEffect(() => {
    if (activeTab === 'notifications') reloadMessages();
  }, [activeTab]);

  const unreadCompanyMessages = companyMessages.filter((m) => m.sender === 'company' && !m.read).length;

  const handleBookingConfirm = async (method: PaymentMethod, passengerName: string, passengerPhone: string) => {
    if (!selectedTrip) return;
    try {
      await confirmBooking({
        tripId: selectedTrip.id,
        paymentMethod: method,
        amount: selectedTrip.price,
        passengerName,
        passengerPhone,
      });
      setIsBookingOpen(false);
      setSelectedTrip(null);
      setActiveTab('tickets');
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  const selectCompany = (company: string) => {
    setSelectedCompany(company);
    navigate('search');
    void searchTrips({ company: company === 'Toutes les compagnies' ? 'Toutes' : company });
  };

  const refreshBookings = async () => {
    if (!currentUser?.id) return;
    const serverBookings = await fetchMyBookingsApi().catch(() => []);
    setCompletedBookings(serverBookings.filter((b) => b.status === 'completed'));
  };

  const submitRating = async (stars: number, comment: string) => {
    if (!booking) return;
    try {
      await rateTripApi(booking.trip.id, stars, comment);
    } catch {
      // L'avis sera rattrapable la prochaine fois
    }
  };

  const finishArrival = async () => {
    if (booking) {
      const current = booking;
      setShowArrivalRating(false);
      try {
        await completeBookingApi(current.id);
      } catch {
        // l'utilisateur re-confirmera son arrivée depuis le suivi
      }
      resetBooking();
      navigate('search');
      void refreshBookings();
      return;
    }
    setShowArrivalRating(false);
    setTripRatingSaved(false);
    setHasRatedCurrentTrip(true);
    resetBooking();
    navigate('search');
    void refreshBookings();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <button className="brand-lockup brand-home-button" onClick={() => navigate('search')} aria-label="Retour à la recherche">
            <div className="brand-mark">V</div>
            <span className="brand-word">VITOO</span>
          </button>
          <div className="flex items-center gap-4">
            <nav className="top-nav" aria-label="Navigation principale">
              <button className={activeTab === 'search' ? 'active' : ''} onClick={() => navigate('search')}>{t('search')}</button>
              <div className="company-menu"><button aria-haspopup="true"><span>{t(`companies`)}</span><small>{selectedCompany}</small><ChevronDown /></button><div className="company-dropdown"><button className={selectedCompany === `Toutes les compagnies` ? `selected` : ``} onClick={() => selectCompany(`Toutes les compagnies`)}>Toutes les compagnies</button>{companies.map((company) => <button key={company} className={selectedCompany === company ? `selected` : ``} onClick={() => selectCompany(company)}>{company}</button>)}</div></div>
              <button className={activeTab === 'tickets' ? 'active' : ''} onClick={() => navigate('tickets')}>{t(`tickets`)}</button>
              <button className={activeTab === 'reservations' ? 'active' : ''} onClick={() => navigate('reservations')}>{t(`bookings`)}</button>
              <button className={activeTab === 'tracking' ? 'active' : ''} onClick={() => navigate('tracking')}>{t(`tracking`)}</button>
            </nav>
            <div className="account-menu"><button className="account-link" onClick={() => setIsAccountOpen((value) => !value)}>{profilePhoto ? <img className="account-avatar" src={profilePhoto} alt="Profil" /> : <span className="account-avatar">{currentUser?.firstName?.charAt(0) || 'V'}</span>}<strong>{currentUser?.firstName || 'voyageur'}</strong><ChevronDown /></button>{isAccountOpen && <div className="account-dropdown"><button onClick={() => navigate('profile')}>{t(`profile`)}</button><button onClick={() => navigate('settings')}>{t(`settings`)}</button><button onClick={() => navigate('notifications')}>{t(`notifications`)}</button></div>}</div>
            <button className="notification-link" aria-label="Notifications" onClick={() => navigate('notifications')} style={{ position: 'relative' }}>{unreadCompanyMessages > 0 && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, paddingInline: 4, boxSizing: 'border-box', borderRadius: 999, background: '#f06464', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCompanyMessages}</span>}<Bell /></button>
            <button type="button" onClick={onLogout} className="text-xs font-bold text-slate-500 hover:text-vitoo-blue">{t(`logout`)}</button>
          </div>
        </div>
      </header>

      <main className="app-content">
        {booking && activeTab === 'search' && (
          <ActiveTripBanner
            trip={booking.trip}
            onTrack={() => navigate('tracking')}
          />
        )}

        {activeTab === 'tracking' && booking ? (
          <div className="space-y-4">
            <div className="page-heading"><span className="hero-eyebrow">En direct</span><h1>Suivi de course</h1><p>Suivez votre car et partagez son itinéraire.</p></div>
            <MapTrackingView trip={booking.trip} onArrive={!hasRatedCurrentTrip ? () => setShowArrivalRating(true) : undefined} />
          </div>
        ) : activeTab === 'tracking' ? (
          <section className="page-heading"><span className="hero-eyebrow">Suivi de course</span><h1>Aucun trajet en cours</h1><p>Après une réservation, votre course apparaîtra ici avec son itinéraire et sa position en direct.</p><button className="primary-action" onClick={() => navigate('search')}>Rechercher un trajet</button></section>
        ) : (
          <>
            {activeTab === 'search' && (
              <div className="home-page">
                <section className="hero-panel">
                  <div className="hero-badge">Votre prochain départ</div>
                  <h1>{t(`heroTitle`)}</h1>
                  <p>{t(`heroText`)}</p>
                  <div className="search-panel">
                    <TripSearchHead company={selectedCompany} onSearch={(params) => searchTrips({ ...params, company: selectedCompany === 'Toutes les compagnies' ? 'Toutes' : selectedCompany })} />
                  </div>
                </section>

                {trips.length > 0 && (
                  <div className="section-heading">
                    <div>
                      <h2>{t(`availableTrips`)}</h2>
                      <p>Comparez les horaires et choisissez votre compagnie.</p>
                    </div>
                    <div className="result-filters"><span>Filtrer les résultats</span><select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}><option value="all">Tous les prix</option><option value="low">Moins de 5 000 FCFA</option><option value="high">5 000 FCFA et plus</option></select><select value={sortFilter} onChange={(event) => setSortFilter(event.target.value)}><option value="recommended">Recommandé</option><option value="early">Départ le plus tôt</option><option value="seats">Plus de places</option></select></div>
                  </div>
                )}

                <div className="trip-list">
                  {loading ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                  ) : trips.length === 0 ? (
                    <div className="empty-state">
                      <Compass size={48} />
                      <p>Aucun trajet disponible pour le moment</p>
                      <p>Les compagnies partenaires n'ont pas encore publié de trajet. Revenez bientôt !</p>
                    </div>
                  ) : (
                    [...trips].filter((trip) => priceFilter === 'all' || (priceFilter === 'low' ? trip.price < 5000 : trip.price >= 5000)).sort((first, second) => sortFilter === 'seats' ? second.availableSeats - first.availableSeats : sortFilter === 'early' ? first.time.localeCompare(second.time) : 0).map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onSelect={(t) => setSelectedTrip(t)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div>
                <div className="section-heading"><div><h2>Mes billets</h2><p>Vos billets actifs et vos billets utilisés.</p></div></div>
                {showTicketDetails && selectedTicket ? <><button className="back-link" onClick={() => { setShowTicketDetails(false); setSelectedTicket(null); }}>← Retour à mes billets</button><Ticket booking={selectedTicket} /></> : <div className="ticket-sections">
                  <div><h3>Billet actif</h3>{booking ? <TicketPreview booking={booking} onOpen={() => { setSelectedTicket(booking); setShowTicketDetails(true); }} /> : <p className="empty-state">Aucun billet actif.</p>}</div>
                  <div><h3>Billets utilisés</h3>{completedBookings.length ? completedBookings.map((item) => <TicketPreview key={item.id} booking={item} onOpen={() => { setSelectedTicket(item); setShowTicketDetails(true); }} />) : <p className="empty-state">Vos billets apparaîtront ici après vos trajets.</p>}</div>
                </div>}
              </div>
            )}

            {activeTab === 'reservations' && (
              <section className="page-heading"><span className="hero-eyebrow">Votre activité</span><h1>Mes réservations</h1><p>Votre historique de trajets, en cours et terminés.</p><div className="reservation-list">{booking && <button type="button" aria-label={`Voir les détails de ${booking.trip.depart} vers ${booking.trip.arrivee}`} onClick={() => setSelectedTrip(booking.trip)}><ClipboardList /><span><b>{booking.trip.depart} → {booking.trip.arrivee}</b><small className="status-current">En cours · {booking.trip.company}</small><small>Réservation Vitoo · billet disponible</small></span></button>}{completedBookings.map((item) => <button type="button" key={item.id} aria-label={`Voir les détails de ${item.trip.depart} vers ${item.trip.arrivee}`} onClick={() => setSelectedTrip(item.trip)}><ClipboardList /><span><b>{item.trip.depart} → {item.trip.arrivee}</b><small className="status-complete">Trajet terminé · {item.trip.company}</small><small>Réservation utilisée · voir les détails</small></span></button>)}{!booking && completedBookings.length === 0 && <p className="empty-state">Aucune réservation dans votre historique.</p>}</div></section>
            )}

            {activeTab === 'notifications' && (
              <section className="page-heading"><span className="hero-eyebrow">Votre activité</span><h1>Notifications</h1><p>Les informations importantes concernant vos voyages.</p><div className="notification-list">{companyMessages.length > 0 ? companyMessages.map((msg) => <article key={msg.id}><Bell /><div><b>{msg.companyName}{msg.sender === 'company' && !msg.read ? ' · Nouveau' : ''}</b><p>{msg.body}</p><small style={{ display: 'block', marginTop: '0.3rem', color: 'var(--vitoo-text-soft, #8290a5)', fontSize: '0.78rem' }}>{new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small></div></article>) : null}{booking ? <article><Compass /><div><b>Suivi en cours</b><p>Votre car {booking.trip.depart} → {booking.trip.arrivee} ({booking.trip.company}) est suivi en direct dans l'onglet Suivi.</p></div></article> : null}{completedBookings.length > 0 ? <article><Bell /><div><b>{completedBookings.length} trajet{completedBookings.length > 1 ? 's' : ''} terminé{completedBookings.length > 1 ? 's' : ''}</b><p>Retrouvez vos billets et avis dans Mes billets.</p></div></article> : null}<article><Bell /><div><b>Billet électronique</b><p>Votre code et son QR code figurent sur le billet pour l'embarquement.</p></div></article></div></section>
            )}

            {activeTab === 'profile' && <UserProfile key={currentUser?.id} currentUser={currentUser} photo={profilePhoto} onPhotoChange={setProfilePhoto} onUserUpdate={(user) => onCurrentUserChange?.({ ...currentUser, ...user } as UserSession)} />}
            {activeTab === 'settings' && <AppSettings onLogout={onLogout} onNotifications={() => navigate('notifications')} />}
          </>
        )}
      </main>

      {/* Modal Fiche Trajet */}
      {selectedTrip && !isBookingOpen && (
        <TripDetail
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onBook={() => setIsBookingOpen(true)}
        />
      )}

      {/* Parcours de réservation */}
      {selectedTrip && isBookingOpen && (
        <BookingFlow
          trip={selectedTrip}
          passengerName={`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()}
          onBack={() => setIsBookingOpen(false)}
          onConfirm={handleBookingConfirm}
          isLoading={isBookingLoading}
        />
      )}

      {showArrivalRating && booking && !tripRatingSaved && !hasRatedCurrentTrip && <div className="arrival-overlay"><div className="arrival-modal"><span className="arrival-check">✓</span><h2>Vous êtes arrivé à destination !</h2><p>Votre avis aide les prochains voyageurs à choisir.</p><div className="rating-stack"><Rating title="Noter ce voyage" onSubmit={async (rating, comment) => { await submitRating(rating, comment); setTripRatingSaved(true); }} /></div><button className="later-button" onClick={() => void finishArrival()}>Plus tard</button></div></div>}
      {tripRatingSaved && showArrivalRating && <div className="arrival-overlay"><div className="arrival-modal"><span className="arrival-check">✓</span><h2>Merci pour votre évaluation</h2><p>Votre avis a été enregistré. Vous ne reverrez plus cette demande pour ce trajet.</p><button className="primary-action" onClick={() => void finishArrival()}>Retour à l'accueil</button></div></div>}

      <footer className="app-footer">
        <div className="flex items-center justify-between gap-4"><strong>VITOO</strong><span>Voyagez sereinement à travers la Côte d'Ivoire.</span><span>© 2026 Vitoo</span></div>
      </footer>
    </div>
  );
};










