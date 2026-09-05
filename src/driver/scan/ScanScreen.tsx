import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Keyboard, ScanLine, Ticket, User } from 'lucide-react';
import { lookupTicketApi, validateTicketApi, type TicketData } from '../../api/driverApi';

type ScanMode = 'camera' | 'manual';

export const ScanScreen: React.FC<{ tripId: string; onBack: () => void }> = ({ tripId, onBack }) => {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [cameraState, setCameraState] = useState<'starting' | 'ready' | 'unavailable'>('starting');
  const [result, setResult] = useState<{ ticket: TicketData; trip: { id: string; depart: string; arrivee: string; time: string }; error?: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState<TicketData[]>([]);
  const [alreadyBoarded, setAlreadyBoarded] = useState<TicketData | null>(null);

  const handleCode = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    setAlreadyBoarded(null);
    try {
      const res = await lookupTicketApi({ backupCode: code });
      if (res.ticket.status === 'used') {
        setAlreadyBoarded(res.ticket);
      } else {
        setResult({ ...res, error: undefined });
      }
    } catch (err) {
      setResult({ ticket: null as unknown as TicketData, trip: { id: tripId, depart: '', arrivee: '', time: '' }, error: err instanceof Error ? err.message : 'Billet introuvable.' });
    }
  }, [tripId]);

  const scannedRef = useRef<TicketData[]>([]);
  const handleCodeRef = useRef(handleCode);
  handleCodeRef.current = handleCode;

  const confirmBoarding = async () => {
    if (!result?.ticket) return;
    setValidating(true);
    try {
      await validateTicketApi({ backupCode: result.ticket.code || result.ticket.qrData });
      const t = result.ticket;
      setScanned((s) => (s.some((x) => x.id === t.id) ? s : [...s, t]));
      scannedRef.current = scannedRef.current.some((x) => x.id === t.id) ? scannedRef.current : [...scannedRef.current, t];
      setResult(null);
      setManualCode('');
    } catch (err) {
      setResult({ ticket: result.ticket, trip: result.trip, error: err instanceof Error ? err.message : 'Validation impossible.' });
    } finally {
      setValidating(false);
    }
  };

  const startCamera = useCallback(async () => {
    setCameraState('starting');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const el = document.getElementById('vitoo-qr-reader');
      if (!el) return;
      const scanner = new Html5Qrcode('vitoo-qr-reader');
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraState('unavailable');
        return;
      }
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (!scannedRef.current.some((s) => s.qrData === decodedText)) {
            void handleCodeRef.current(decodedText);
          }
        },
        () => undefined
      );
      (scannerRef as { current: unknown }).current = scanner;
      setCameraState('ready');
    } catch {
      setCameraState('unavailable');
    }
  }, []);

  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (mode === 'camera') {
      void startCamera();
    }
    return () => {
      void (scannerRef.current?.stop().catch(() => undefined));
      scannerRef.current = null;
    };
  }, [mode, startCamera]);

  return (
    <div className="fade-in">
      <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour à la mission</button>
      <div className="page-heading">
        <span className="hero-eyebrow">Embarquement</span>
        <h1>Scanner les billets</h1>
        <p>Scannez le QR code du billet ou saisissez son code unique pour valider l'embarquement. Les passagers validés sont marqués « embarqué ».</p>
      </div>

      <div className="mode-tabs">
        <button type="button" className={mode === 'camera' ? 'mode-tab active' : 'mode-tab'} onClick={() => setMode('camera')}><ScanLine size={16} /> Caméra</button>
        <button type="button" className={mode === 'manual' ? 'mode-tab active' : 'mode-tab'} onClick={() => setMode('manual')}><Keyboard size={16} /> Code manuel</button>
      </div>

      {mode === 'camera' ? (
        <div className="scan-panel">
          {cameraState === 'starting' && <div className="loading-state"><div className="loading-spinner" /><p>Activation de la caméra…</p></div>}
          {cameraState === 'unavailable' && (
            <div className="qr-error" style={{ marginTop: '0.5rem' }}>
              Caméra indisponible. Utilisez la saisie manuelle du code pour embarquer les passagers.
            </div>
          )}
          {cameraState === 'ready' && <div className="qr-scanner"><div className="qr-scanner-frame" id="vitoo-qr-reader" /></div>}
        </div>
      ) : (
        <div className="qr-scanner">
          <label className="field-label" htmlFor="manual-code">Code unique du billet (ex. TKT-…)</label>
          <div className="manual-code-row">
            <input
              id="manual-code"
              className="field-input"
              placeholder="TKT-XXXXXXXX"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCode(manualCode); } }}
            />
            <button type="button" className="action-btn primary" onClick={() => void handleCode(manualCode)}>Trouver le billet</button>
          </div>
        </div>
      )}

      {alreadyBoarded && (
        <div className="qr-result">
          <div className="qr-error"><CheckCircle2 size={16} /> <strong>Déjà embarqué</strong> — Siège {alreadyBoarded.seatNumber} · {alreadyBoarded.passengerName} a déjà été validé.</div>
        </div>
      )}

      {result && (
        <div className="qr-result">
          {result.error ? (
            <div className="qr-error">{result.error}</div>
          ) : result.ticket ? (
            <>
              <div className="qr-success"><CheckCircle2 size={16} /> Billet valide</div>
              <div className="qr-details">
                <p><strong><Ticket size={14} /> {result.trip.depart} → {result.trip.arrivee}</strong> · {result.trip.time}</p>
                <p><User size={14} /> {result.ticket.passengerName}</p>
                <p>{result.ticket.passengerPhone || 'Sans téléphone'}</p>
                <p>Siège <strong>{result.ticket.seatNumber}</strong> · {result.ticket.amount.toLocaleString('fr-FR')} FCFA · {result.ticket.paymentMethod || '—'} ({result.ticket.soldBy === 'online' ? 'en ligne' : 'guichet'})</p>
              </div>
              <div className="qr-actions">
                <button type="button" className="action-btn primary" onClick={() => void confirmBoarding()} disabled={validating}>
                  {validating ? 'Validation…' : 'Valider l\u2019embarquement'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <h3 className="section-title">Passagers embarqués ({scanned.length})</h3>
      {scanned.length === 0 ? (
        <p className="boarding-hint">Aucun passager encore scanné sur cette session. Les validations apparaîtront ici à l'instant.</p>
      ) : (
        <div className="checkin-list">
          {scanned.map((t) => (
            <div key={t.id} className="checkin-item checkin-ok">
              <span className="checkin-seat">{t.seatNumber}</span>
              <span className="checkin-name"><strong>{t.passengerName}</strong><small>{t.passengerPhone || 'Sans téléphone'}</small></span>
              <span className="pill pill-green">Embarqué</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};