import React from 'react';
import type { CompanyStats } from '../../../api/companyApi';

interface Props {
  stats: CompanyStats | null;
}

export const StatsTab: React.FC<Props> = ({ stats }) => (
  <div>
    <div className="page-heading">
      <span className="hero-eyebrow">Analyse</span>
      <h1>Statistiques</h1>
      <p>Suivez vos ventes et commissions Vitoo.</p>
    </div>
    {!stats || stats.totalTickets === 0 ? (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-500">Aucune donnée disponible. Vendez des billets pour voir vos statistiques.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Ventes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total ventes</span>
              <span className="font-black text-xl text-vitoo-blue">{stats.totalSales.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Billets en ligne</span>
              <span className="font-bold">{stats.onlineTickets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Billets guichet</span>
              <span className="font-bold">{stats.counterTickets}</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Commission Vitoo (8%)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total commission</span>
              <span className="font-black text-xl text-orange-500">{stats.totalCommission.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Net compagnie</span>
              <span className="font-black text-xl text-green-600">{stats.totalNet.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Trajets</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Trajets actifs</span>
              <span className="font-bold text-xl">{stats.activeTrips}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Trajets terminés</span>
              <span className="font-bold text-xl">{stats.completedTrips}</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Résumé</h3>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-sm text-slate-600">Total billets</div>
            <div className="text-3xl font-black text-vitoo-blue">{stats.totalTickets}</div>
          </div>
        </div>
      </div>
    )}
  </div>
);
