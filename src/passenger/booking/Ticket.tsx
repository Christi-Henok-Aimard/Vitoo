import React, { useEffect, useState } from 'react';
import type { Booking } from '../../types/booking';
import { QrCode, CheckCircle2, Printer, Copy, Building2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { formatPrice } from '../../shared/components/lib/format';

interface TicketProps {
  booking: Booking;
  onClose?: () => void;
}

export const TicketPreview: React.FC<{ booking: Booking; onOpen: () => void }> = ({ booking, onOpen }) => {
  const reference = booking.ticket?.code || `TKT-${booking.id.slice(-6).toUpperCase()}`;
  return (
    <button type="button" className="ticket-preview" onClick={onOpen}>
      <span className={`ticket-preview-status ${booking.status === 'completed' ? 'used' : ''}`}><CheckCircle2 /> {booking.status === 'completed' ? 'Billet utilisé' : 'Billet confirmé'}</span>
      <strong>{booking.trip.depart} <span>→</span> {booking.trip.arrivee}</strong>
      <small>{booking.trip.company} · {booking.trip.time} · {formatPrice(booking.trip.price)}</small>
      <small className="ticket-preview-code">{reference} · Voir le billet et le QR code</small>
    </button>
  );
};

export const Ticket: React.FC<TicketProps> = ({ booking, onClose }) => {
  const reference = booking.ticket?.code || `TKT-${booking.id.slice(-6).toUpperCase()}`;
  const [isCopied, setIsCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(reference, { margin: 1, width: 240 })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [reference]);

  const downloadTicket = async () => {
    const pdf = new jsPDF();
    const qrDataUrl = await QRCode.toDataURL(reference, { margin: 1, width: 220 });

    pdf.setTextColor(16, 35, 63);
    pdf.setFontSize(22);
    pdf.text('VITOO', 20, 24);
    pdf.setFontSize(12);
    pdf.setTextColor(25, 147, 111);
    pdf.text('Reservation confirmee', 20, 34);
    pdf.setDrawColor(220, 227, 238);
    pdf.line(20, 42, 190, 42);
    pdf.setTextColor(16, 35, 63);
    pdf.setFontSize(11);
    pdf.text(`Code de reservation : ${reference}`, 20, 55);
    pdf.text(`Passager : ${booking.passengerName || 'Passager Vitoo'}`, 20, 66);
    pdf.text(`Compagnie : ${booking.trip.company}`, 20, 77);
    pdf.text(`Trajet : ${booking.trip.depart} -> ${booking.trip.arrivee}`, 20, 88);
    pdf.text(`Depart : ${booking.trip.time}`, 20, 99);
    pdf.text(`Prix : ${formatPrice(booking.trip.price)}`, 20, 110);
    pdf.text(`Chauffeur : ${booking.trip.driverName || 'Non renseigne'}`, 20, 121);
    pdf.text(`Contact compagnie : ${booking.trip.companyPhone || 'Non renseigne'}`, 20, 132);
    pdf.text(`Siege : ${booking.ticket?.seatNumber || booking.seatNumber || 'Attribue a bord'}`, 20, 141);
    pdf.text(`Paiement : ${booking.ticket?.paymentMethod || 'a regler a bord'}`, 20, 150);
    pdf.addImage(qrDataUrl, 'PNG', 75, 145, 60, 60);
    pdf.setFontSize(9);
    pdf.text(`QR unique : ${reference}`, 82, 210);
    pdf.save(`ticket-${reference}.pdf`);
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(reference);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2200);
  };
  return (
    <div className="ticket-wrap">
      <div className="ticket-card mx-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="ticket-main">
      <div className="ticket-header flex items-center justify-between border-b pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-bold text-sm">Billet Confirmé</span>
        </div>
        <span className="text-xs font-mono text-slate-400">{reference}</span>
      </div>

      <div className="mt-4 space-y-3">
        <p className="ticket-passenger">Passager : <strong>{booking.passengerName || 'Passager Vitoo'}</strong></p>
        <div className="ticket-company">
          <div className="ticket-company-brand">
            {booking.trip.companyLogo ? <img src={booking.trip.companyLogo} alt={booking.trip.company} /> : <Building2 size={22} />}
          </div>
          <p className="text-xs text-slate-400 uppercase">Compagnie</p>
          <p className="font-bold text-lg text-slate-800 dark:text-white">
            {booking.trip.company}
          </p>
          {booking.trip.companyPhone && <a className="ticket-company-phone" href={`tel:${booking.trip.companyPhone.replace(/\s/g, '')}`}><span>Contact compagnie</span><strong>{booking.trip.companyPhone}</strong></a>}
        </div>

        <div className="ticket-route flex justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase">Départ</p>
            <p className="font-semibold">{booking.trip.depart}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase">Arrivée</p>
            <p className="font-semibold">{booking.trip.arrivee}</p>
          </div>
        </div>

        <div className="ticket-meta flex justify-between border-t border-b py-3 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-400 uppercase">Heure</p>
            <p className="font-semibold">{booking.trip.time}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Siège</p>
            <p className="font-semibold">{booking.ticket?.seatNumber || booking.seatNumber || 'Attribué à bord'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Prix</p>
            <p className="font-semibold">{formatPrice(booking.trip.price)}</p>
          </div>
        </div>
      </div>
      </div>
      <div className="ticket-stub">
        <span className="ticket-stub-label">SCAN À L'EMBARQUEMENT</span>
        <div className="ticket-qr flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
        {qrDataUrl ? <img src={qrDataUrl} alt={`QR code ${reference}`} className="h-28 w-28" /> : <QrCode className="h-28 w-28 text-slate-800 dark:text-white" />}
        <p className="mt-2 text-xs text-slate-400">QR unique · {reference}</p>
      </div>
      </div>
      </div>

      <div className="ticket-actions"><button type="button" onClick={() => window.print()}><Printer /> Imprimer le ticket</button><button type="button" onClick={downloadTicket}><Printer /> Télécharger en PDF</button><button type="button" onClick={copyCode}><Copy /> {isCopied ? 'Code copié' : 'Copier le code'}</button></div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-100 py-2.5 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Fermer
        </button>
      )}
    </div>
  );
};
