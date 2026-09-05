import { useEffect, useState, useCallback } from 'react';
import { Users, Bus, Ticket, Calendar, Shield, TrendingUp, ArrowLeft, Trash2, Ban, Phone, Mail, MapPin, CalendarDays, LogOut } from 'lucide-react';
import { ADMIN_SESSION_KEY, fireSessionExpired } from '../api/sessionKeys';

interface AdminStats {
  users: number;
  companies: number;
  drivers: number;
  trips: number;
  bookings: number;
  tickets: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  role: string;
  provider: string;
  createdAt: string;
}

export interface AdminDashboardProps {
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

  const getAuthHeaders = () => {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    const token = stored ? (JSON.parse(stored) as { token?: string }).token : undefined;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const adminFetch = useCallback(async (url: string, options?: RequestInit) => {
    const response = await fetch(url, { ...options, headers: { ...getAuthHeaders(), ...(options?.headers || {}) } });
    if (response.status === 401) {
      fireSessionExpired('admin');
    }
    return response;
  }, []);

  const openUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setActionMessage('');
    try {
      const response = await adminFetch(`${apiBase}/admin/users/${userId}`);
      const data = await response.json() as { user?: Record<string, unknown>; message?: string };
      if (!response.ok) throw new Error(data.message || 'Utilisateur introuvable.');
      setSelectedUser(data.user || null);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Erreur lors du chargement du détail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Supprimer définitivement ce compte ? Cette action est irréversible.')) return;
    try {
      const response = await adminFetch(`${apiBase}/admin/users/${userId}`, { method: 'DELETE' });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || 'Suppression impossible.');
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
      setActionMessage('Utilisateur supprimé.');
      void loadUsers();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!window.confirm('Bannir ce compte ? Son rôle sera réinitialisé et son accès désactivé.')) return;
    try {
      const response = await adminFetch(`${apiBase}/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: 'passenger' }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || 'Action impossible.');
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: 'passenger' } : u)));
      setSelectedUser(prev => (prev && prev.id === userId ? { ...prev, role: 'passenger' } : prev));
      setActionMessage('Compte banni (rôle rétrogradé en passager). Révoquez le token en changeant JWT_SECRET si besoin.');
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Erreur lors du bannissement.');
    }
  };

  const loadUsers = async (signal?: { mounted: boolean }) => {
    try {
      const usersRes = await adminFetch(`${apiBase}/admin/users`);
      const usersData = await usersRes.json() as { users?: User[] };
      if (!usersRes.ok) throw new Error('Accès refusé');
      if (!signal || signal.mounted) setUsers(usersData.users || []);
    } catch (err) {
      if (!signal || signal.mounted) setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!stored) {
          onLogout?.();
          window.location.href = '/';
          return;
        }

        const [statsRes, usersRes] = await Promise.all([
          adminFetch(`${apiBase}/admin/stats`),
          adminFetch(`${apiBase}/admin/users`),
        ]);

        if (!statsRes.ok || !usersRes.ok) {
          throw new Error('Accès refusé');
        }

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        setStats(statsData);
        setUsers((usersData as { users?: User[] }).users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminFetch, apiBase]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <Shield size={48} />
        <h2>Accès refusé</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-logo">V</div>
            <div>
              <h1>Vitoo Admin</h1>
              <p>Tableau de bord administrateur</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={() => { onLogout?.(); window.location.href = '/'; }}><LogOut size={16} /> Se déconnecter</button>
        </div>
      </header>

      <main className="admin-content">
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <Users size={24} />
              <div>
                <p className="admin-stat-value">{stats.users}</p>
                <p className="admin-stat-label">Utilisateurs</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <Bus size={24} />
              <div>
                <p className="admin-stat-value">{stats.companies}</p>
                <p className="admin-stat-label">Compagnies</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <Users size={24} />
              <div>
                <p className="admin-stat-value">{stats.drivers}</p>
                <p className="admin-stat-label">Chauffeurs</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <Calendar size={24} />
              <div>
                <p className="admin-stat-value">{stats.trips}</p>
                <p className="admin-stat-label">Trajets</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <Ticket size={24} />
              <div>
                <p className="admin-stat-value">{stats.bookings}</p>
                <p className="admin-stat-label">Réservations</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <TrendingUp size={24} />
              <div>
                <p className="admin-stat-value">{stats.tickets}</p>
                <p className="admin-stat-label">Billets</p>
              </div>
            </div>
          </div>
        )}

        <div className="admin-section">
          <h2>Utilisateurs récents</h2>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Ville</th>
                  <th>Rôle</th>
                  <th>Méthode</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-empty">Aucun utilisateur</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="admin-user-row" onClick={() => void openUserDetail(user.id)} title="Voir le détail du compte">
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.phone}</td>
                      <td>{user.email || '-'}</td>
                      <td>{user.city || '-'}</td>
                      <td>
                        <span className={`admin-role-badge admin-role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.provider}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {detailLoading && <div className="admin-modal-backdrop"><div className="admin-modal">Chargement du détail...</div></div>}

      {selectedUser && !detailLoading && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedUser(null)}><ArrowLeft size={18} /> Retour</button>
            <div className="admin-detail-header">
              <div className="admin-detail-avatar">{(selectedUser.firstName as string || 'U').charAt(0)}{(selectedUser.lastName as string || '').charAt(0)}</div>
              <div>
                <h2>{selectedUser.firstName as string} {selectedUser.lastName as string}</h2>
                <span className={`admin-role-badge admin-role-${selectedUser.role}`}>{selectedUser.role as string}</span>
              </div>
            </div>

            <div className="admin-detail-grid">
              <div className="admin-detail-item"><Phone size={16} /><span>{selectedUser.phone as string || '-'}</span></div>
              <div className="admin-detail-item"><Mail size={16} /><span>{(selectedUser.email as string) || '-'}</span></div>
              <div className="admin-detail-item"><MapPin size={16} /><span>{(selectedUser.city as string) || '-'}</span></div>
              <div className="admin-detail-item"><CalendarDays size={16} /><span>Inscrit le {new Date(selectedUser.createdAt as string).toLocaleDateString('fr-FR')}</span></div>
              {selectedUser.companyName ? <div className="admin-detail-item"><Bus size={16} /><span>{selectedUser.companyName as string}</span></div> : null}
              {selectedUser.rccm ? <div className="admin-detail-item"><Shield size={16} /><span>RCCM : {selectedUser.rccm as string}</span></div> : null}
              {selectedUser.taxId ? <div className="admin-detail-item"><Shield size={16} /><span>Id. fiscal : {selectedUser.taxId as string}</span></div> : null}
              <div className="admin-detail-item"><Users size={16} /><span>Connexion : {selectedUser.provider as string}</span></div>
            </div>

            {actionMessage && <p className="admin-action-message">{actionMessage}</p>}

            <div className="admin-detail-actions">
              <button className="admin-btn admin-btn-danger" onClick={() => void handleBanUser(selectedUser.id as string)}>
                <Ban size={16} /> Bannir
              </button>
              <button className="admin-btn admin-btn-danger-solid" onClick={() => void handleDeleteUser(selectedUser.id as string)}>
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
            <p className="admin-detail-hint">Activité en temps réel (réservations, trajets) : à connecter au backend prochainement.</p>
          </div>
        </div>
      )}
    </div>
  );
};
