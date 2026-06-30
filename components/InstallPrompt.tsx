'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed') === '1') return;

    // Only show on mobile/touch devices
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
    if (!isMobile) return;

    // Don't show if already in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1E2227',
        borderTop: '1px solid rgba(201,168,76,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        fontFamily: 'var(--font-plex-sans)',
      }}
      role="banner"
      aria-label="Install NirmanShastra app"
    >
      {/* NS icon */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          background: '#1E2227',
          border: '1px solid #C9A84C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-plex-serif)',
          fontWeight: 700,
          fontSize: 13,
          color: '#C9A84C',
          letterSpacing: '0.02em',
        }}
      >
        NS
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#F4F4F0', lineHeight: 1.3 }}>
          Install NirmanShastra App
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(244,244,240,0.55)', lineHeight: 1.3, fontFamily: 'var(--font-plex-mono)' }}>
          Works offline · Faster on repeat visits
        </p>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        style={{
          flexShrink: 0,
          background: '#8C3A22',
          color: '#F4F4F0',
          border: 'none',
          padding: '7px 14px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'var(--font-plex-sans)',
          cursor: 'pointer',
          letterSpacing: '0.03em',
          borderRadius: 4,
        }}
      >
        Install
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          color: 'rgba(244,244,240,0.4)',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          padding: '4px',
        }}
      >
        ×
      </button>
    </div>
  );
}
