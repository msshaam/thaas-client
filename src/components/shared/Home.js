import React from 'react';

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
    </div>
  );
}
