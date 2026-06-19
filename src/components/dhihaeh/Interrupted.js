import React, { useState } from 'react';
import ConfirmDialog from '../digu/ConfirmDialog';

const TEAM_COLORS = { 1: '#3a7bd5', 2: '#e05c3a' };

export default function Interrupted({ gameState, roomState, session, socket, onBack }) {
  const [error, setError] = useState('');
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const teamName1 = roomState?.teamNames?.[1] || gameState?.teamNames?.[1] || 'Team 1';
  const teamName2 = roomState?.teamNames?.[2] || gameState?.teamNames?.[2] || 'Team 2';
  const snapshot = gameState?.scoreSnapshot;

  function handleLeave() {
    socket.emit('leaveRoom', (res) => {
      if (!res?.success) setError(res?.error || 'Could not leave');
      else onBack?.();
    });
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, #1a2a4a 0%, var(--bg) 70%)',
      padding: '24px 16px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Game Ended
          </div>
          <div style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.5 }}>
            {gameState?.interruptionReason || 'The game was interrupted.'}
          </div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}

        {snapshot && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '16px 18px', marginBottom: '24px'
          }}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Score at the time
            </div>
            {[1, 2].map(t => (
              <div key={t} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: t === 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span style={{ color: TEAM_COLORS[t], fontWeight: 700, fontSize: '13px' }}>
                  {t === 1 ? teamName1 : teamName2}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                  {snapshot[t]?.tens || 0} × 10 · {snapshot[t]?.piles || 0} piles
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', padding: '4px 0 8px' }}>
            Start a new room to play again.
          </div>
          <button
            onClick={() => setConfirmingLeave(true)}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px',
              fontSize: '15px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
              background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer'
            }}
          >
            Leave Room
          </button>
        </div>
      </div>

      {confirmingLeave && (
        <ConfirmDialog
          title="Leave Room?"
          message="You'll be removed from this room and returned to the home screen."
          confirmLabel="Leave"
          cancelLabel="Stay"
          confirmTone="danger"
          onConfirm={handleLeave}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}
    </div>
  );
}
