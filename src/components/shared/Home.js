import React, { useEffect, useRef, useState } from 'react';
import ModalShell from '../digu/ModalShell';
import { CloseIcon, ShareIcon } from '../digu/Icons';
import InstallBanner from './InstallBanner';

const getCapturedInstallPrompt = () => window.__thaasInstallPrompt || null;
const pillButton = { borderRadius: 999 };

const games = [
  {
    id: 'digu',
    name: 'Digu',
    subtitle: 'Gin Rummy — Maldives Edition',
    desc: '2–5 players · Draw, meld, and call Digu to win',
    color: '#c9a84c',
    bg: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)',
    border: 'rgba(201,168,76,0.3)',
    icon: '/images/digu-icon.webp',
  },
  {
    id: 'dhihaeh',
    name: 'Dhihaeh',
    subtitle: '10 — Maldives Card Game',
    desc: '4 players · 2v2 teams · Collect the most 10s',
    color: '#3a7bd5',
    bg: 'linear-gradient(135deg, rgba(58,123,213,0.12) 0%, rgba(58,123,213,0.04) 100%)',
    border: 'rgba(58,123,213,0.3)',
    icon: '/images/dhihaeh-icon.webp',
  },
];

export default function Home({ onSelectGame }) {
  const [installDismissed, setInstallDismissed] = useState(false);
  const [iosInstallOpen, setIosInstallOpen] = useState(false);
  const [androidInstallOpen, setAndroidInstallOpen] = useState(false);
  const [hasInstallPrompt, setHasInstallPrompt] = useState(() => Boolean(getCapturedInstallPrompt()));
  const deferredInstallPromptRef = useRef(null);

  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isAndroid = /android/i.test(window.navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
  const canShowIosInstall = isIos && isSafari && !isStandalone;

  useEffect(() => {
    const syncCapturedInstallPrompt = () => {
      const capturedPrompt = getCapturedInstallPrompt();
      if (!capturedPrompt) return;
      deferredInstallPromptRef.current = capturedPrompt;
      setHasInstallPrompt(true);
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.__thaasInstallPrompt = event;
      window.__thaasInstallPromptSeen = true;
      deferredInstallPromptRef.current = event;
      setHasInstallPrompt(true);
    };

    syncCapturedInstallPrompt();
    window.addEventListener('thaas-beforeinstallprompt', syncCapturedInstallPrompt);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('thaas-beforeinstallprompt', syncCapturedInstallPrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const openInstall = async () => {
    if (canShowIosInstall) {
      setIosInstallOpen(true);
      return;
    }
    const promptEvent = deferredInstallPromptRef.current || getCapturedInstallPrompt();
    if (!promptEvent) {
      if (isAndroid) setAndroidInstallOpen(true);
      return;
    }
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } finally {
      deferredInstallPromptRef.current = null;
      window.__thaasInstallPrompt = null;
      window.__thaasInstallPromptSeen = false;
      setHasInstallPrompt(false);
      setInstallDismissed(true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 50% 0%, #1a2a4a 0%, #0a0f1e 70%)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          fontSize: 'clamp(52px, 14vw, 80px)',
          fontWeight: 900,
          letterSpacing: '-3px',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          THAAS
        </div>
        <div style={{
          fontSize: '11px',
          letterSpacing: '4px',
          color: '#3a4a65',
          textTransform: 'uppercase',
          marginTop: '8px',
        }}>
          Choose a game to play
        </div>
      </div>

      {/* Game cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            style={{
              background: game.bg,
              border: `1px solid ${game.border}`,
              borderRadius: '16px',
              padding: '22px 24px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                <img src={game.icon} alt={`${game.name} icon`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: game.color, marginBottom: '3px' }}>{game.name}</div>
                <div style={{ fontSize: '12px', color: '#8a9bb5' }}>{game.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: game.color, fontSize: '18px', flexShrink: 0 }}>›</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: '40px', fontSize: '11px', color: '#1e2d45', letterSpacing: '2px', textTransform: 'uppercase' }}>
        More games coming soon
      </div>

      {iosInstallOpen && (
        <ModalShell onClose={() => setIosInstallOpen(false)} maxWidth={520}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/logo192.png" alt="" width="52" height="52" style={{ borderRadius: 14 }} />
                <h2 style={{ color: '#c9a84c', fontSize: 22, fontWeight: 800 }}>Install THAAS</h2>
              </div>
              <button
                onClick={() => setIosInstallOpen(false)}
                aria-label="Close install instructions"
                style={{ background: 'transparent', border: 'none', borderRadius: 999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: '#0a0f1e', fontSize: 15, lineHeight: 1.45 }}>
              {[
                ['1', <>Tap the <strong>Share</strong> button in Safari</>],
                ['2', <>Scroll down and tap <strong>Add to Home Screen</strong></>],
                ['3', <>Tap <strong>Add</strong> to confirm</>],
              ].map(([step, text]) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(76,175,136,0.12)', color: '#4caf88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                    {step}
                  </div>
                  <div style={{ color: '#e8e0d4' }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#8a9bb5', fontSize: 12 }}>
                <ShareIcon color="#8a9bb5" />
                <span>Safari share icon</span>
              </div>
            </div>
            <button
              onClick={() => setIosInstallOpen(false)}
              style={{ marginTop: 18, width: '100%', padding: '14px 16px', background: '#fff', border: '1px solid rgba(30,45,69,0.2)', color: '#0a0f1e', fontWeight: 700, fontSize: 16, cursor: 'pointer', ...pillButton }}
            >
              Got It
            </button>
          </div>
        </ModalShell>
      )}

      {androidInstallOpen && (
        <ModalShell onClose={() => setAndroidInstallOpen(false)} maxWidth={520}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/logo192.png" alt="" width="52" height="52" style={{ borderRadius: 14 }} />
                <h2 style={{ color: '#c9a84c', fontSize: 22, fontWeight: 800 }}>Install THAAS</h2>
              </div>
              <button
                onClick={() => setAndroidInstallOpen(false)}
                aria-label="Close install instructions"
                style={{ background: 'transparent', border: 'none', borderRadius: 999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, color: '#e8e0d4', fontSize: 15, lineHeight: 1.45 }}>
              {[
                ['1', <>Tap the browser <strong>menu</strong></>],
                ['2', <>Choose <strong>Install App</strong> or <strong>Add to Home Screen</strong></>],
                ['3', <>Confirm to install <strong>THAAS</strong></>],
              ].map(([step, text]) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(76,175,136,0.12)', color: '#4caf88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                    {step}
                  </div>
                  <div>{text}</div>
                </div>
              ))}
            </div>
            <p style={{ color: '#8a9bb5', fontSize: 11, textAlign: 'center', marginTop: 18 }}>
              Local network links sometimes do not show the automatic install prompt.
            </p>
            <button
              onClick={() => setAndroidInstallOpen(false)}
              style={{ marginTop: 16, width: '100%', padding: '14px 16px', background: '#fff', border: '1px solid rgba(30,45,69,0.2)', color: '#0a0f1e', fontWeight: 700, fontSize: 16, cursor: 'pointer', ...pillButton }}
            >
              Got It
            </button>
          </div>
        </ModalShell>
      )}

      {!installDismissed && !isStandalone && (hasInstallPrompt || canShowIosInstall || isAndroid) && (
        <InstallBanner
          iosMode={canShowIosInstall}
          onInstall={openInstall}
          onDismiss={() => setInstallDismissed(true)}
        />
      )}
    </div>
  );
}
