import React, { useState } from 'react';

import Card from './Card';
import ConfirmDialog from '../digu/ConfirmDialog';
import DisconnectVoteBanner from './DisconnectVoteBanner';

const s = {
  wrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, var(--bg) 70%)',
    padding: '24px'
  },
  title: { fontSize: '26px', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px' },
  sub: {
    fontSize: '13px', color: 'var(--muted)', marginBottom: '40px',
    textAlign: 'center', maxWidth: '300px', lineHeight: 1.7
  },
  cards: { display: 'flex', gap: '14px', marginBottom: '36px', justifyContent: 'center' },
  slot: (selected) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    cursor: 'pointer',
  }),
  slotLabel: (selected) => ({
    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
    color: selected ? 'var(--accent)' : 'transparent', fontWeight: 700,
    transition: 'color .15s'
  }),
  confirmBtn: (active) => ({
    padding: '14px 36px', borderRadius: '10px', fontSize: '15px', fontWeight: 800,
    letterSpacing: '2px', textTransform: 'uppercase',
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color: active ? '#000' : 'var(--muted)',
    border: active ? 'none' : '1px solid var(--border)',
    cursor: active ? 'pointer' : 'not-allowed', transition: 'all .2s'
  }),
  waiting: {
    padding: '32px 24px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', textAlign: 'center', maxWidth: '340px'
  },
  label: { fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }
};

export default function HukunSelect({ gameState, session, roomState, socket, onBack }) {
  const [selected, setSelected] = useState(null); // index 0-4
  const [confirming, setConfirming] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [error, setError] = useState('');

  const isP2 = gameState.seatIndex === 1;
  const p2Name = gameState.players[1]?.name;
  const isOwner = session.playerId === roomState?.ownerId;

  function confirmHukun() {
    if (selected === null || confirming) return;
    // Get the actual card id from the server-provided hukun5 (server tracks order)
    // We pass the index; server uses hukun5[index].id
    setConfirming(true);
    const cardId = gameState.hukun5[selected].id;
    socket.emit('selectHukun', { cardId }, (res) => {
      setConfirming(false);
      if (!res?.success) console.error(res?.error);
    });
  }

  function handleLeave() {
    socket.emit('leaveRoom', (res) => {
      if (!res?.success) setError(res?.error || 'Could not leave');
      else onBack?.();
    });
  }

  function handleEndGame() {
    socket.emit('endCurrentGame', (res) => {
      if (!res?.success) setError(res?.error || 'Could not end game');
    });
  }

  const controlsBar = (
    <div style={{ position: 'fixed', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 200 }}>
      {isOwner && (
        <button onClick={() => setConfirmingEnd(true)} style={{
          padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
          background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', cursor: 'pointer'
        }}>
          End Game
        </button>
      )}
      <button onClick={() => setConfirmingLeave(true)} style={{
        padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
        background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer'
      }}>
        Leave
      </button>
    </div>
  );

  const dialogs = (
    <>
      {confirmingLeave && (
        <ConfirmDialog
          title="Leave Game?"
          message="The current round will be interrupted for everyone since Dhihaeh needs exactly 4 players."
          confirmLabel="Leave"
          cancelLabel="Stay"
          confirmTone="danger"
          onConfirm={handleLeave}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}
      {confirmingEnd && (
        <ConfirmDialog
          title="End Game?"
          message="This will end the current game for everyone in the room."
          confirmLabel="End Game"
          cancelLabel="Cancel"
          confirmTone="danger"
          onConfirm={() => { setConfirmingEnd(false); handleEndGame(); }}
          onCancel={() => setConfirmingEnd(false)}
        />
      )}
    </>
  );

  if (isP2) {
    return (
      <div style={s.wrap}>
        {controlsBar}
        <DisconnectVoteBanner disconnectVote={gameState.disconnectVote} socket={socket} loading={voteLoading} setLoading={setVoteLoading} setError={setError} />
        <div style={s.title}>Select Hukun</div>
        <div style={s.sub}>
          Pick 1 of your 5 face-down cards to be the Hukun.<br/>
          You won't see the card — choose carefully.
        </div>

        <div style={s.cards}>
          {gameState.hukun5?.map((card, i) => (
            <div key={i} style={s.slot(selected === i)} onClick={() => setSelected(i)}>
              <div style={s.slotLabel(selected === i)}>✓</div>
              <Card
                card={card}
                faceDown
                selected={selected === i}
              />
            </div>
          ))}
        </div>

        <button
          style={s.confirmBtn(selected !== null && !confirming)}
          onClick={confirmHukun}
          disabled={selected === null || confirming}
        >
          {confirming ? 'Confirming…' : 'Set as Hukun'}
        </button>
        {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '14px' }}>{error}</div>}
        {dialogs}
      </div>
    );
  }

  // All other players: waiting screen
  return (
    <div style={s.wrap}>
      {controlsBar}
      <DisconnectVoteBanner disconnectVote={gameState.disconnectVote} socket={socket} loading={voteLoading} setLoading={setVoteLoading} setError={setError} />
      <div style={s.waiting}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          Waiting for {p2Name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '28px' }}>
          {p2Name} is selecting the Hukun card
        </div>
        <div style={s.label}>5 cards — 1 will be Hukun</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
          {gameState.hukun5?.map((_, i) => (
            <Card key={i} card={{ rank: '?', suit: '?' }} faceDown small />
          ))}
        </div>
        {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '14px' }}>{error}</div>}
      </div>
      {dialogs}
    </div>
  );
}
