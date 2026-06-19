import React, { useState, useRef, useEffect, useCallback } from 'react';

import Card from './Card';
import { ScorePatchPanel, isDebugMode } from './DebugPanel';
import ConfirmDialog from '../digu/ConfirmDialog';
import DisconnectVoteBanner from './DisconnectVoteBanner';

const TEAM_COLORS = { 1: '#3a7bd5', 2: '#e05c3a' };

// Pile card — face-down poker back or face-up 10 with suit
function PileCard({ pile }) {
  const ten = pile.hasTen ? pile.cards?.find(c => c.rank === '10') : null;
  const RED_SUITS = ['♥', '♦'];

  if (ten) {
    const isRed = RED_SUITS.includes(ten.suit);
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Stack shadow cards behind */}
        <div style={{ position: 'absolute', top: '3px', left: '-3px', width: '44px', height: '64px', borderRadius: '4px', background: '#e0d8c8', border: '1px solid rgba(0,0,0,0.15)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '6px', left: '-6px', width: '44px', height: '64px', borderRadius: '4px', background: '#d4ccba', border: '1px solid rgba(0,0,0,0.12)', zIndex: 0 }} />
        {/* Face-up 10 card */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '44px', height: '64px', borderRadius: '4px',
          background: '#f8f0e0', border: '1px solid rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          justifyContent: 'space-between', padding: '4px 5px',
          color: isRed ? '#cc1100' : '#111',
          fontFamily: "'Georgia', serif",
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
            <div style={{ fontSize: '10px', fontWeight: 700 }}>10</div>
            <div style={{ fontSize: '9px' }}>{ten.suit}</div>
          </div>
          <div style={{ fontSize: '16px', alignSelf: 'center', lineHeight: 1 }}>{ten.suit}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, transform: 'rotate(180deg)', alignSelf: 'flex-end' }}>
            <div style={{ fontSize: '10px', fontWeight: 700 }}>10</div>
            <div style={{ fontSize: '9px' }}>{ten.suit}</div>
          </div>
        </div>
      </div>
    );
  }

  // Face-down pile using the card-back image
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: '-3px', width: '44px', height: '64px', borderRadius: '4px', background: '#7a0013', border: '1px solid rgba(0,0,0,0.2)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '6px', left: '-6px', width: '44px', height: '64px', borderRadius: '4px', background: '#600010', border: '1px solid rgba(0,0,0,0.2)', zIndex: 0 }} />
      <div style={{
        position: 'relative', zIndex: 1, width: '44px', height: '64px', borderRadius: '4px',
        backgroundImage: 'url(/images/card-back.webp)', backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid rgba(0,0,0,0.3)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
      }} />
    </div>
  );
}

// Animated flying card
function FlyingCard({ card, from, to, hasTen, onDone }) {
  const [pos, setPos] = useState({ x: from.x, y: from.y, scale: 1, opacity: 1 });

  useEffect(() => {
    const t = setTimeout(() => {
      setPos({ x: to.x, y: to.y, scale: 0.3, opacity: 0.7 });
      setTimeout(onDone, 600);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      left: pos.x, top: pos.y,
      transform: `translate(-50%,-50%) scale(${pos.scale})`,
      opacity: pos.opacity,
      transition: 'all 0.55s cubic-bezier(.4,0,.2,1)',
      zIndex: 500, pointerEvents: 'none'
    }}>
      <Card card={hasTen ? card : { rank: '?', suit: '?' }} faceDown={!hasTen} large />
    </div>
  );
}

export default function GameBoard({ gameState, session, roomState, socket, onBack }) {
  const {
    myHand: initialHand, players = [], seatIndex = 0, hukun, hukunRevealed, hukunSuit,
    leadSuit, roundCards = [], currentTurnSeat, score, roundsPlayed, gameResult,
    status, nextDealerId, teamNames: gsTeamNames, disconnectVote
  } = gameState;

  const [hand, setHand] = useState(initialHand || []);
  const [selectedCard, setSelectedCard] = useState(null);
  const [error, setError] = useState('');
  const [flyingCards, setFlyingCards] = useState([]);
  const [hukunRevealAnim, setHukunRevealAnim] = useState(null);
  const [draggingToPlay, setDraggingToPlay] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [, forceUpdate] = useState(0);
  const centreRef = useRef(null);
  const teamZoneRef1 = useRef(null);
  const teamZoneRef2 = useRef(null);
  const teamZoneRefs = { 1: teamZoneRef1, 2: teamZoneRef2 };
  const handRef = useRef(null);

  useEffect(() => { setHand(gameState.myHand || []); }, [gameState.myHand]);

  // Rerender hand on resize so overlap recalculates
  useEffect(() => {
    const onResize = () => forceUpdate(n => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Socket events ────────────────────────────────────────────
  useEffect(() => {
    socket.on('roundComplete', (result) => {
      // Animate cards flying to team zone
      if (!centreRef.current) return;
      const centreRect = centreRef.current.getBoundingClientRect();
      const teamZone = teamZoneRefs[result.winnerTeam]?.current;
      const toRect = teamZone ? teamZone.getBoundingClientRect() : { left: 100, top: 100, width: 100, height: 40 };
      const to = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };

      const newFlying = result.cards.map((rc, i) => ({
        id: `fly-${Date.now()}-${i}`,
        card: rc.card,
        hasTen: rc.card.rank === '10',
        from: { x: centreRect.left + centreRect.width / 2 + (i - 1.5) * 90, y: centreRect.top + centreRect.height / 2 },
        to,
        team: result.winnerTeam,
      }));
      setFlyingCards(prev => [...prev, ...newFlying]);
      setTimeout(() => setFlyingCards(prev => prev.filter(f => !newFlying.find(n => n.id === f.id))), 1200);
    });

    socket.on('hukunRevealed', (data) => {
      setHukunRevealAnim(data);
      // No auto-dismiss — player must tap "Got it"
    });

    return () => { socket.off('roundComplete'); socket.off('hukunRevealed'); };
  }, []);

  // ── Unified pointer drag system (like Digu) ──────────────────
  const dragSessionRef = useRef(null); // { cardIdx, cardId, startX, startY, active }
  const [activeDragId, setActiveDragId] = useState(null);
  const [dragPointer, setDragPointer] = useState(null); // { x, y } for floating card
  const [dragOverIdx, setDragOverIdx] = useState(null); // for reorder preview
  const [draggingIdx, setDraggingIdx] = useState(null); // legacy compat

  function reorder(from, to) {
    setHand(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function getHandSlotIdx(clientX) {
    if (!handRef.current) return null;
    const cards = handRef.current.querySelectorAll('[data-card-index]');
    let best = null, minDist = Infinity;
    cards.forEach(el => {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(clientX - (rect.left + rect.width / 2));
      if (dist < minDist) { minDist = dist; best = parseInt(el.dataset.cardIndex); }
    });
    return best;
  }

  function handlePointerDown(e, cardIdx, card) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    dragSessionRef.current = {
      cardIdx, cardId: card.id, card,
      startX: e.clientX, startY: e.clientY, active: false
    };
  }

  // ── Game actions (defined before useEffect so they're available in closure) ──
  const isMyTurn = currentTurnSeat === seatIndex;
  const myTeam = players[seatIndex]?.team;
  const teamName1 = roomState?.teamNames?.[1] || gsTeamNames?.[1] || 'Team 1';
  const teamName2 = roomState?.teamNames?.[2] || gsTeamNames?.[2] || 'Team 2';
  const p2Id = players[1]?.id;
  const isP2 = session.playerId === p2Id;
  const alreadyPlayedThisRound = roundCards?.some(rc => rc.playerId === session.playerId);
  const isNextDealer = session.playerId === nextDealerId;
  const isOwner = session.playerId === roomState?.ownerId;
  const turnPlayerName = players[currentTurnSeat]?.name;
  const mustRevealFirst = isMyTurn && !hukunRevealed && !alreadyPlayedThisRound
    && leadSuit && !hand.some(c => c.suit === leadSuit);
  const canRequestReveal = mustRevealFirst;

  useEffect(() => {
    const handleMove = (e) => {
      const session = dragSessionRef.current;
      if (!session) return;
      const dist = Math.hypot(e.clientX - session.startX, e.clientY - session.startY);
      if (!session.active && dist < 8) return;
      e.preventDefault();
      if (!session.active) {
        session.active = true;
        setActiveDragId(session.cardId);
        setDraggingIdx(session.cardIdx);
      }
      setDragPointer({ x: e.clientX, y: e.clientY });

      // Check if over centre play area
      if (centreRef.current) {
        const rect = centreRef.current.getBoundingClientRect();
        const overCentre = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
        setDraggingToPlay(overCentre);
      }

      // Reorder preview when staying in hand area
      if (handRef.current) {
        const handRect = handRef.current.getBoundingClientRect();
        if (e.clientY >= handRect.top - 30) {
          const slot = getHandSlotIdx(e.clientX);
          if (slot !== null && slot !== session.cardIdx) {
            setDragOverIdx(slot);
          }
        }
      }
    };

    const handleUp = (e) => {
      const session = dragSessionRef.current;
      if (!session) return;
      dragSessionRef.current = null;

      if (!session.active) {
        // Tap — select/deselect card (inline to avoid stale closure)
        setActiveDragId(null);
        setDragPointer(null);
        setDraggingIdx(null);
        setDragOverIdx(null);
        setDraggingToPlay(false);
        setSelectedCard(prev => prev?.id === session.card?.id ? null : session.card);
        setError('');
        return;
      }

      e.preventDefault();
      setActiveDragId(null);
      setDragPointer(null);
      setDraggingIdx(null);
      setDraggingToPlay(false);
      setDragOverIdx(null);

      // Dropped on centre = play card
      if (centreRef.current) {
        const rect = centreRef.current.getBoundingClientRect();
        const overCentre = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (overCentre && isMyTurn && !alreadyPlayedThisRound) {
          const card = session.card;
          if (mustRevealFirst) {
            setError("You can't follow suit — reveal the Hukun first");
          } else {
            // Play this card directly
            socket.emit('playCard', { cardId: session.cardId }, (res) => {
              if (res?.success) { setSelectedCard(null); setError(''); }
              else setError(res?.error || 'Cannot play that card');
            });
          }
          return;
        }
      }

      // Dropped in hand = reorder
      const slot = getHandSlotIdx(e.clientX);
      if (slot !== null && slot !== session.cardIdx) {
        reorder(session.cardIdx, slot);
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp, { passive: false });
    window.addEventListener('pointercancel', handleUp, { passive: false });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isMyTurn, alreadyPlayedThisRound, mustRevealFirst, hand]);

  // ── Game action functions ─────────────────────────────────────

  function handleCardTap(card) {
    if (!isMyTurn || alreadyPlayedThisRound) return;
    if (mustRevealFirst) {
      setError("You can't follow suit — reveal the Hukun first");
      return;
    }
    setSelectedCard(prev => prev?.id === card.id ? null : card);
    setError('');
  }

  function playCard() {
    if (!selectedCard) return;
    if (mustRevealFirst) {
      setError("You can't follow suit — reveal the Hukun first");
      return;
    }
    socket.emit('playCard', { cardId: selectedCard.id }, (res) => {
      if (res?.success) { setSelectedCard(null); setError(''); }
      else setError(res?.error || 'Cannot play that card');
    });
  }

  function requestReveal() {
    socket.emit('requestHukunReveal', (res) => {
      if (!res?.success) setError(res?.error || 'Cannot reveal hukun');
    });
  }

  function startNextGame() {
    socket.emit('restartGame', (res) => {
      if (!res?.success) setError(res?.error || 'Cannot start next game');
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

  // Safety guard — if essential data isn't ready yet, show nothing rather than crash
  if (!players.length) {
    return (
      <div style={{ height: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0
      }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-1px' }}>10</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' }}>
          ROOM <span style={{ color: 'var(--text)', fontWeight: 600 }}>{roomState?.code}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isOwner && status === 'playing' && (
            <button onClick={() => setConfirmingEnd(true)} style={{
              padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
              background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', cursor: 'pointer'
            }}>
              End Game
            </button>
          )}
          <button onClick={() => setConfirmingLeave(true)} style={{
            padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
            background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer'
          }}>
            Leave
          </button>
        </div>
      </div>

      <DisconnectVoteBanner disconnectVote={disconnectVote} socket={socket} loading={voteLoading} setLoading={setVoteLoading} setError={setError} />

      {/* Team score bars with pile chips */}
      <div style={{ display: 'flex', gap: '6px', padding: '7px 10px', background: 'var(--surface)', flexShrink: 0 }}>
        {[1, 2].map(t => {
          const isMyTeam = myTeam === t;
          const s = score?.[t] || { tens: 0, piles: 0, pilelist: [] };
          const name = t === 1 ? teamName1 : teamName2;
          return (
            <div key={t} ref={teamZoneRefs[t]} style={{
              flex: 1, padding: '6px 10px', borderRadius: '8px',
              background: isMyTeam ? `${TEAM_COLORS[t]}18` : 'transparent',
              border: `1px solid ${isMyTeam ? TEAM_COLORS[t] : 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: 'clamp(10px,2.5vw,13px)', fontWeight: 700, color: isMyTeam ? TEAM_COLORS[t] : 'var(--muted)' }}>
                  {name}{isMyTeam && <span style={{ fontSize: '9px', marginLeft: '4px', opacity: 0.6 }}>YOU</span>}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: s.tens > 0 ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {s.tens} × 10
                </div>
              </div>
              {/* Pile cards */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', minHeight: '70px', marginTop: '4px' }}>
                {(s.pilelist || []).map((pile, i) => (
                  <PileCard key={i} pile={pile} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Centre table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', gap: '8px', overflowY: 'auto', minHeight: 0 }}>

        {/* Round area: hukun + 4 player slots */}
        <div
          ref={centreRef}
          onDragOver={undefined}
          onDragLeave={undefined}
          onDrop={undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: draggingToPlay ? 'rgba(245,200,66,0.06)' : 'var(--surface)',
            borderRadius: '10px',
            border: `1px solid ${draggingToPlay ? 'var(--accent)' : 'var(--border)'}`,
            padding: '10px 12px', flexShrink: 0, flexWrap: 'wrap',
            transition: 'border-color .15s, background .15s'
          }}
        >
          {/* Hukun */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            {hukunRevealed ? (
              <div style={{
                width: '78px', height: '110px', borderRadius: '9px',
                background: 'var(--surface2)', border: '1px solid var(--accent)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                <div style={{ fontSize: '8px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>HUKUN</div>
                <div style={{ fontSize: '36px', lineHeight: 1 }}>{hukunSuit}</div>
              </div>
            ) : (
              hukun && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>HUKUN</div>
                  <Card card={hukun} faceDown large />
                </div>
              )
            )}
          </div>

          <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch', margin: '0 2px', flexShrink: 0 }} />

          {/* 4 player slots */}
          <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {players.map((p, i) => {
              const played = roundCards?.find(rc => rc.seatIndex === i);
              const isCurrentSlot = i === currentTurnSeat && status === 'playing';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '9px', color: isCurrentSlot ? 'var(--accent)' : 'var(--muted)', fontWeight: isCurrentSlot ? 700 : 400, letterSpacing: '1px' }}>
                    {i === seatIndex ? 'You' : p.name?.split(' ')[0]}{isCurrentSlot && !played ? ' ●' : ''}
                  </div>
                  {played ? (
                    <Card card={played.card} large />
                  ) : (
                    <div style={{
                      width: '78px', height: '110px', borderRadius: '9px',
                      border: `1px dashed ${isCurrentSlot ? 'var(--accent)' : 'var(--border)'}`,
                      background: isCurrentSlot ? 'rgba(245,200,66,0.04)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color .2s'
                    }}>
                      {isCurrentSlot && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', opacity: 0.6, animation: 'pulse 1.2s infinite' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead/trump indicator + turn status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {leadSuit && <>
              <span style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>Lead</span>
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{leadSuit}</span>
            </>}
          </div>
          <div style={{ fontSize: '12px', color: isMyTurn ? 'var(--accent)' : 'var(--muted)', fontWeight: isMyTurn ? 700 : 400, letterSpacing: '1px' }}>
            {status === 'playing' ? (isMyTurn ? 'YOUR TURN' : `${turnPlayerName}'s turn…`) : ''}
          </div>
        </div>

        {error && <div style={{ fontSize: '12px', color: 'var(--red)', letterSpacing: '1px', flexShrink: 0 }}>{error}</div>}

        {/* Action buttons */}
        {isMyTurn && !alreadyPlayedThisRound && status === 'playing' && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedCard && (
              <button onClick={playCard} style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer', letterSpacing: '1px'
              }}>
                Play {selectedCard.rank}{selectedCard.suit}
              </button>
            )}
            {canRequestReveal && (
              <button onClick={requestReveal} style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                background: 'transparent', color: 'var(--red)',
                border: '1px solid var(--red)', cursor: 'pointer', letterSpacing: '1px'
              }}>
                Reveal Hukun
              </button>
            )}
            {!selectedCard && (
              <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
                Tap a card or drag it to the centre to play
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player hand */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Hand <span style={{ color: 'var(--text)' }}>({hand.length})</span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '1px' }}>DRAG TO REORDER · DRAG TO CENTRE TO PLAY</div>
        </div>

        <div
          ref={handRef}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '105px', position: 'relative', touchAction: 'none', width: '100%' }}
        >
          {(() => {
            const total = hand.length;
            if (total === 0) return null;

            const maxRotate = 14;
            const cardW = 52;
            const availableW = (handRef.current?.offsetWidth || window.innerWidth) - 24;
            const minOverlap = total > 1 ? Math.max(0, (cardW * total - availableW) / (total - 1)) : 0;
            const overlap = Math.min(cardW * 0.65, minOverlap + cardW * 0.25);

            return hand.map((card, i) => {
              const mid = (total - 1) / 2;
              const offset = i - mid;
              const rotate = total > 1 ? (offset / mid) * maxRotate : 0;
              const yLift = Math.abs(total > 1 ? offset / mid : 0) * 8;
              const isDragging = activeDragId === card.id;
              const isSelected = selectedCard?.id === card.id;
              // Show reorder preview
              const displayIdx = dragOverIdx !== null && activeDragId
                ? (() => {
                    const fromIdx = hand.findIndex(c => c.id === activeDragId);
                    if (fromIdx === -1) return i;
                    const preview = [...hand];
                    const [moved] = preview.splice(fromIdx, 1);
                    preview.splice(dragOverIdx, 0, moved);
                    return preview.findIndex(c => c.id === card.id);
                  })()
                : i;

              return (
                <div
                  key={card.id}
                  data-card-index={i}
                  style={{
                    position: 'relative',
                    marginLeft: i === 0 ? 0 : -overlap,
                    zIndex: isSelected ? 99 : isDragging ? 100 : i,
                    transform: isDragging
                      ? 'none'
                      : isSelected
                      ? `rotate(${rotate}deg) translateY(${yLift - 16}px) scale(1.05)`
                      : `rotate(${rotate}deg) translateY(${yLift}px)`,
                    transformOrigin: 'bottom center',
                    transition: isDragging ? 'none' : 'transform .18s cubic-bezier(.25,.8,.25,1)',
                    opacity: isDragging ? 0.3 : 1,
                    filter: isSelected ? 'drop-shadow(0 6px 12px rgba(201,168,76,0.4))' : 'none',
                    touchAction: 'none',
                    flexShrink: 0,
                    cursor: 'grab',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, i, card)}
                >
                  <Card card={card} small selected={isSelected} />
                </div>
              );
            });
          })()}

          {/* Floating card that follows pointer */}
          {activeDragId && dragPointer && (() => {
            const card = hand.find(c => c.id === activeDragId);
            return card ? (
              <div style={{
                position: 'fixed',
                left: dragPointer.x,
                top: dragPointer.y,
                transform: 'translate(-50%, -60%)',
                zIndex: 3000,
                pointerEvents: 'none',
                touchAction: 'none',
                filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.5))',
              }}>
                <Card card={card} small />
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Flying cards animation */}
      {flyingCards.map(fc => (
        <FlyingCard key={fc.id} card={fc.card} from={fc.from} to={fc.to} hasTen={fc.hasTen} onDone={() => {}} />
      ))}

      {/* Hukun reveal overlay — stays until player dismisses */}
      {hukunRevealAnim && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 400, gap: '16px', padding: '24px'
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase' }}>
            Hukun Revealed by {hukunRevealAnim.revealedByName}
          </div>
          <div style={{ animation: 'flipIn 0.5s ease-out' }}>
            <Card card={hukunRevealAnim.hukun} large />
          </div>
          <div style={{ fontSize: '16px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>
            {hukunRevealAnim.hukun.suit} is now the Hukun suit
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', maxWidth: '260px', lineHeight: 1.6 }}>
            {hukunRevealAnim.isP2
              ? 'You must play the Hukun card this round'
              : `Hukun card has been added to ${players[1]?.name || "the selector"}'s hand`}
          </div>
          <button
            onClick={() => setHukunRevealAnim(null)}
            style={{
              marginTop: '8px',
              padding: '13px 40px',
              borderRadius: '999px',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '1px',
              background: 'var(--accent)',
              color: '#0a0f1e',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      )}

      {/* Round over scoresheet */}
      {status === 'ended' && gameResult && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Round result header */}
            <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--muted)', marginBottom: '4px', textAlign: 'center' }}>
              ROUND {gameState.roundHistory?.length || 1} OVER
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: TEAM_COLORS[gameResult.winner], marginBottom: '4px', textAlign: 'center' }}>
              {gameResult.winner === 1 ? teamName1 : teamName2} wins!
            </div>
            {gameResult.bug && (
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--red)', fontWeight: 800, background: 'rgba(224,92,58,0.15)', padding: '3px 10px', borderRadius: '20px' }}>
                  {gameResult.bug === 'haas' ? 'HAAS BUG' : 'BUG'}
                </span>
              </div>
            )}

            {/* This round detail */}
            <div style={{ marginBottom: '20px' }}>
              {[1, 2].map(t => {
                const s = score?.[t] || { tens: 0, piles: 0, pilelist: [] };
                const name = t === 1 ? teamName1 : teamName2;
                return (
                  <div key={t} style={{
                    marginBottom: '10px', padding: '10px 12px', borderRadius: '10px',
                    background: t === gameResult.winner ? `${TEAM_COLORS[t]}14` : 'var(--surface2)',
                    border: `1px solid ${t === gameResult.winner ? TEAM_COLORS[t] : 'var(--border)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: TEAM_COLORS[t], fontSize: '13px' }}>{name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                        {s.tens} × 10 · {s.piles} piles
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(s.pilelist || []).map((pile, pi) => (
                        <PileCard key={pi} pile={pile} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All rounds history */}
            {gameState.roundHistory?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Score History</div>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', background: 'var(--surface2)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>ROUND</div>
                    <div style={{ width: '100px', textAlign: 'center', fontSize: '11px', color: TEAM_COLORS[1], fontWeight: 700, letterSpacing: '1px' }}>{teamName1}</div>
                    <div style={{ width: '100px', textAlign: 'center', fontSize: '11px', color: TEAM_COLORS[2], fontWeight: 700, letterSpacing: '1px' }}>{teamName2}</div>
                  </div>
                  {gameState.roundHistory.map((r, i) => (
                    <div key={i} style={{ display: 'flex', padding: '8px 12px', borderBottom: i < gameState.roundHistory.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <div style={{ flex: 1, fontSize: '12px', color: 'var(--muted)' }}>#{r.roundNum}</div>
                      <div style={{ width: '100px', textAlign: 'center', fontSize: '13px', fontWeight: r.winner === 1 ? 800 : 400, color: r.winner === 1 ? TEAM_COLORS[1] : 'var(--red)' }}>
                        {r.winner === 1 ? '1' : (r.bug === 'haas' ? 'HAAS BUG' : r.bug === 'bug' ? 'BUG' : '0')}
                      </div>
                      <div style={{ width: '100px', textAlign: 'center', fontSize: '13px', fontWeight: r.winner === 2 ? 800 : 400, color: r.winner === 2 ? TEAM_COLORS[2] : 'var(--red)' }}>
                        {r.winner === 2 ? '1' : (r.bug === 'haas' ? 'HAAS BUG' : r.bug === 'bug' ? 'BUG' : '0')}
                      </div>
                    </div>
                  ))}
                  {/* Total row */}
                  <div style={{ display: 'flex', padding: '10px 12px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, fontSize: '11px', color: 'var(--muted)', fontWeight: 700, letterSpacing: '1px' }}>TOTAL</div>
                    <div style={{ width: '100px', textAlign: 'center', fontSize: '16px', fontWeight: 800, color: TEAM_COLORS[1] }}>{gameState.totalScore?.[1] || 0}</div>
                    <div style={{ width: '100px', textAlign: 'center', fontSize: '16px', fontWeight: 800, color: TEAM_COLORS[2] }}>{gameState.totalScore?.[2] || 0}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Next round button */}
            {isNextDealer ? (
              <button onClick={startNextGame} style={{
                width: '100%', padding: '14px', borderRadius: '10px',
                fontSize: '15px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase',
                background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer'
              }}>
                Deal Next Round
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', padding: '8px 0' }}>
                Waiting for <strong style={{ color: 'var(--text)' }}>{players.find(p => p.id === nextDealerId)?.name}</strong> to deal next round…
              </div>
            )}
          </div>
        </div>
      )}

      {isOwner && isDebugMode() && status === 'playing' && (
        <div style={{ position: 'fixed', bottom: '8px', right: '8px', zIndex: 600, maxWidth: '320px' }}>
          <ScorePatchPanel socket={socket} />
        </div>
      )}

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

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes flipIn { from{transform:rotateY(90deg) scale(0.8);opacity:0} to{transform:rotateY(0deg) scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
