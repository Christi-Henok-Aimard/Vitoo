import React, { useEffect, useRef, useState } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let scriptLoaded = false;
let scriptLoading = false;
const waiters: Array<() => void> = [];

const loadGoogleScript = (): Promise<void> => {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => waiters.push(resolve));
  }

  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      waiters.forEach((w) => w());
      waiters.length = 0;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Google script'));
    };
    document.head.appendChild(script);
  });
};

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(Boolean(CLIENT_ID));
  const callbackRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  const initialized = useRef(false);

  useEffect(() => {
    callbackRef.current = onSuccess;
    errorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    const initGoogle = async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || initialized.current) return;
        initialized.current = true;

        window.google!.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (cancelled) return;
            if (response.credential) {
              callbackRef.current(response.credential);
            } else {
              errorRef.current?.(new Error('Aucun token reçu de Google.'));
            }
          },
        });

        window.google!.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'fr',
          width: 320,
        });

        if (!cancelled) setIsLoading(false);
      } catch {
        if (!cancelled) {
          setIsLoading(false);
          errorRef.current?.(new Error('Impossible de charger Google Identity Services.'));
        }
      }
    };

    void initGoogle();
    return () => { cancelled = true; };
  }, []);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-2.5 px-4 rounded-xl bg-white/10 border border-white/15 font-medium text-xs flex items-center justify-center gap-3 transition mb-4 text-slate-400 cursor-not-allowed"
        title="Configurez VITE_GOOGLE_CLIENT_ID pour activer la connexion Google"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Connexion Google (à configurer)
      </button>
    );
  }

  return (
    <div className="w-full mb-4">
      {isLoading && (
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-xl bg-white/10 border border-white/15 font-medium text-xs flex items-center justify-center gap-3 transition mb-4 text-slate-400 cursor-wait"
        >
          Chargement de Google...
        </button>
      )}
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};
