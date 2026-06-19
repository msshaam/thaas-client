import React, { useState } from 'react';

// Only ever rendered when the parent checks for ?debug=1 in the URL.
export function isDebugMode() {
  try {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

const wrap = {
  marginTop: '16px', padding: '14px', borderRadius: '10px',
  background: 'rgba(255,0,0,0.06)', border: '1px dashed var(--red)',
  width: '100%', maxWidth: '440px'
};
const title = { fontSize: '10px', letterSpacing: '2px', color: 'var(--red)', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' };
const row = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' };
const btn = {
  padding: '7px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
  background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer'
};
const err = { color: 'var(--red)', fontSize: '11px', marginTop: '6px' };

// ── Score-patch presets (use during an active game, status === 'playing') ──
const SCORE_PRESETS = [
  { label: 'BUG (4-0, loser has piles)', payload: { score: { 1: { tens: 4, piles: 6 }, 2: { tens: 0, piles: 6 } } } },
  { label: 'HAAS BUG (4-0, loser has 0 piles)', payload: { score: { 1: { tens: 4, piles: 6 }, 2: { tens: 0, piles: 0 } } } },
  { label: '3-1 tens ending', payload: { score: { 1: { tens: 3, piles: 5 }, 2: { tens: 1, piles: 7 } } } },
  { label: '2-2 sudden death (7 piles)', payload: { score: { 1: { tens: 2, piles: 7 }, 2: { tens: 2, piles: 5 } } } },
  { label: '2-2 near sudden death (6 piles)', payload: { score: { 1: { tens: 2, piles: 6 }, 2: { tens: 2, piles: 6 } } } },
  { label: 'Final round, 2-2 tie → pile tiebreak', payload: { score: { 1: { tens: 2, piles: 8 }, 2: { tens: 2, piles: 5 } }, roundsPlayed: 13 } },
];

export function ScorePatchPanel({ socket }) {
  const [error, setError] = useState('');
  const [lastApplied, setLastApplied] = useState('');

  function apply(preset) {
    socket.emit('debugPatch', preset.payload, (res) => {
      if (!res?.success) setError(res?.error || 'Patch failed');
      else { setError(''); setLastApplied(preset.label); }
    });
  }

  return (
    <div style={wrap}>
      <div style={title}>Debug — Force Score (testing only)</div>
      <div style={row}>
        {SCORE_PRESETS.map(p => (
          <button key={p.label} style={btn} onClick={() => apply(p)}>{p.label}</button>
        ))}
      </div>
      {lastApplied && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Applied: {lastApplied}</div>}
      {error && <div style={err}>{error}</div>}
    </div>
  );
}

// ── Custom deal (use before game starts, on the TeamSelect screen) ──
const DEFAULT_JSON = `{
  "hands": [
    [ /* seat 0 — P1 (dealer), 13 cards */ ],
    [ /* seat 1 — P2 (hukun selector), 13 cards */ ],
    [ /* seat 2 — P3, 13 cards */ ],
    [ /* seat 3 — P4, 13 cards */ ]
  ],
  "hukunCard": { "rank": "7", "suit": "♥" },
  "autoReveal": false
}
// Card format: {"rank":"A","suit":"♠"} — ranks: A,2-10,J,Q,K — suits: ♠ ♥ ♦ ♣
// Leave a field out to fall back to normal random behavior for that part.`;

export function CustomDealPanel({ socket, onError }) {
  const [text, setText] = useState(DEFAULT_JSON);
  const [error, setError] = useState('');

  function start() {
    let payload;
    try {
      // Strip // comments before parsing since JSON doesn't support them
      const clean = text.replace(/\/\/.*$/gm, '');
      payload = JSON.parse(clean);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      return;
    }
    socket.emit('debugDeal', payload, (res) => {
      if (!res?.success) { setError(res?.error || 'Could not start'); onError?.(res?.error); }
      else setError('');
    });
  }

  return (
    <div style={wrap}>
      <div style={title}>Debug — Custom Deal (testing only)</div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%', minHeight: '160px', fontFamily: 'monospace', fontSize: '11px',
          background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '8px', boxSizing: 'border-box', marginBottom: '8px'
        }}
      />
      <button style={{ ...btn, background: 'var(--red)', color: '#fff', border: 'none' }} onClick={start}>
        Start With This Deal
      </button>
      {error && <div style={err}>{error}</div>}
    </div>
  );
}
