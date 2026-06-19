import React, { useState, useEffect } from 'react';
import { CustomDealPanel, isDebugMode } from './DebugPanel';
import ConfirmDialog from '../digu/ConfirmDialog';


const TEAM_COLORS = { 1: 'var(--team1)', 2: 'var(--team2)' };
const DEFAULT_TEAM_NAMES = { 1: 'Team Blue', 2: 'Team Red' };

const s = {
  wrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, var(--bg) 70%)',
    padding: '24px'
  },
  roomCode: {
    fontSize: '12px', letterSpacing: '4px', color: 'var(--muted)',
    textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center'
  },
  codeVal: { fontSize: '28px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '6px', textAlign: 'center', marginBottom: '32px' },
  arena: {
    display: 'flex', alignItems: 'stretch',
    width: '100%', maxWidth: '700px', minHeight: '340px',
    border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden'
  },
  side: (team, clickable) => ({
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-start',
    padding: '24px 16px',
    cursor: clickable ? 'pointer' : 'default',
    background: clickable
      ? (team === 1 ? 'rgba(58,123,213,0.07)' : 'rgba(224,92,58,0.07)')
      : 'var(--surface)',
    transition: 'background .2s',
    borderRight: team === 1 ? '1px solid var(--border)' : 'none'
  }),
  teamNameWrap: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' },
  teamNameStatic: (team) => ({
    fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase',
    color: TEAM_COLORS[team], fontWeight: 700
  }),
  teamNameInput: (team) => ({
    fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase',
    color: TEAM_COLORS[team], fontWeight: 700, background: 'transparent',
    border: 'none', borderBottom: `1px solid ${TEAM_COLORS[team]}`,
    outline: 'none', width: '110px', padding: '2px 4px'
  }),
  editIcon: { fontSize: '11px', color: 'var(--muted)', cursor: 'pointer', userSelect: 'none' },
  playerSlot: (filled, isMe) => ({
    width: '100%', minHeight: '52px', borderRadius: '10px',
    border: `1px solid ${isMe ? 'var(--accent)' : filled ? 'var(--border)' : 'rgba(255,255,255,0.06)'}`,
    background: filled ? 'var(--surface2)' : 'rgba(255,255,255,0.02)',
    display: 'flex', alignItems: 'center', padding: '10px 14px',
    marginBottom: '8px',
    boxShadow: isMe ? '0 0 0 1px var(--accent)' : 'none'
  }),
  playerName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  ownerBadge: {
    fontSize: '9px', letterSpacing: '2px', color: 'var(--accent)',
    textTransform: 'uppercase', marginLeft: '8px', opacity: 0.8
  },
  emptySlot: { fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' },
  midCol: {
    width: '80px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)', gap: '8px', padding: '12px 0', flexShrink: 0
  },
  vs: { fontSize: '20px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '2px' },
  playerCount: { fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' },
  joinHint: (team) => ({
    fontSize: '11px', color: TEAM_COLORS[team], marginTop: '8px', letterSpacing: '1px'
  }),
  actions: {
    marginTop: '28px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '10px', width: '100%', maxWidth: '700px'
  },
  startBtn: (canStart) => ({
    padding: '14px 40px', borderRadius: '10px', fontSize: '15px', fontWeight: 800,
    letterSpacing: '2px', textTransform: 'uppercase',
    background: canStart ? 'var(--accent)' : 'var(--surface2)',
    color: canStart ? '#000' : 'var(--muted)',
    border: canStart ? 'none' : '1px solid var(--border)',
    cursor: canStart ? 'pointer' : 'not-allowed', transition: 'all .2s'
  }),
  hint: { fontSize: '12px', color: 'var(--muted)', letterSpacing: '1px' },
  err: { color: 'var(--red)', fontSize: '13px' }
};

export default function TeamSelect({ roomState, session, onBack, socket }) {
  const [error, setError] = useState('');
  // Local team name state, seeded from server (roomState.teamNames) when it arrives
  const [teamNames, setTeamNames] = useState({ 1: 'Team Blue', 2: 'Team Red' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const { canStart, team1, team2, ownerId, players } = roomState;
  const me = players.find(p => p.id === session.playerId);
  const myTeam = me?.team;
  const isOwner = session.playerId === ownerId;

  function handleLeave() {
    socket.emit('leaveRoom', (res) => {
      if (!res?.success) setError(res?.error || 'Could not leave');
      else onBack?.();
    });
  }

  // Sync team names from server when they change
  useEffect(() => {
    if (roomState.teamNames) {
      setTeamNames(roomState.teamNames);
    }
  }, [roomState.teamNames]);

  // Is this player the first to join a given team? (captain = name editor)
  function isCaptain(team) {
    const members = team === 1 ? team1 : team2;
    return members.length > 0 && members[0]?.id === session.playerId;
  }

  function switchToTeam(team) {
    if (myTeam === team) return;
    socket.emit('pickTeam', { team });
    setError('');
  }

  function startGame() {
    if (!canStart) return;
    socket.emit('startGame', (res) => {
      if (!res?.success) setError(res?.error || 'Could not start game');
    });
  }

  function submitTeamName(team, name) {
    setEditingTeam(null);
    const trimmed = name.trim() || DEFAULT_TEAM_NAMES[team];
    setTeamNames(prev => ({ ...prev, [team]: trimmed }));
    socket.emit('setTeamName', { team, name: trimmed });
  }

  const renderTeamSide = (teamPlayers, team) => {
    // Show all players on this team + one empty slot if under 4 total across both teams
    const slotCount = Math.max(2, teamPlayers.length);
    const slots = Array.from({ length: slotCount }, (_, i) => teamPlayers[i] || null);
    const isMyTeam = myTeam === team;
    const clickable = !isMyTeam;
    const canEdit = isCaptain(team) && isMyTeam;

    return (
      <div style={s.side(team, clickable)} onClick={() => clickable && switchToTeam(team)}>

        {/* Team name */}
        <div style={s.teamNameWrap} onClick={e => e.stopPropagation()}>
          {editingTeam === team ? (
            <input
              autoFocus
              style={s.teamNameInput(team)}
              defaultValue={teamNames[team]}
              maxLength={18}
              onBlur={e => submitTeamName(team, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitTeamName(team, e.target.value);
                if (e.key === 'Escape') setEditingTeam(null);
              }}
            />
          ) : (
            <>
              <span style={s.teamNameStatic(team)}>{teamNames[team]}</span>
              {canEdit && (
                <span style={s.editIcon} onClick={() => setEditingTeam(team)} title="Rename team">✎</span>
              )}
            </>
          )}
        </div>

        {/* Player slots */}
        {slots.map((p, i) => (
          <div key={i} style={{
            ...s.playerSlot(!!p, p?.id === session.playerId),
            border: teamPlayers.length > 2 && p ? '1px solid var(--red)' : undefined
          }}>
            {p ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={s.playerName}>{p.name}</div>
                {p.isOwner && <div style={s.ownerBadge}>host</div>}
              </div>
            ) : (
              <div style={s.emptySlot}>Open slot</div>
            )}
          </div>
        ))}

        {/* Join/switch hint */}
        {clickable && (
          <div style={s.joinHint(team)}>
            {team === 1 ? '← Tap to join' : 'Tap to join →'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={s.wrap}>
      <div style={s.roomCode}>Room code</div>
      <div style={s.codeVal}>{roomState.code}</div>

      <div style={s.arena}>
        {renderTeamSide(team1, 1)}

        <div style={s.midCol}>
          <div style={s.vs}>VS</div>
          <div style={s.playerCount}>{players.length}/4</div>
        </div>

        {renderTeamSide(team2, 2)}
      </div>

      <div style={s.actions}>
        {isOwner && (
          <>
            <button style={s.startBtn(canStart)} onClick={startGame} disabled={!canStart}>
              Start Game
            </button>
            {!canStart && (
              <div style={s.hint}>Need 2 players on each side to start</div>
            )}
          </>
        )}

        {!isOwner && (
          <div style={s.hint}>
            {canStart ? 'Waiting for host to start…' : 'Pick a team to get started'}
          </div>
        )}

        {error && <div style={s.err}>{error}</div>}

        {onBack && (
          <button onClick={() => setConfirmingLeave(true)} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            ← Leave Room
          </button>
        )}
      </div>

      {confirmingLeave && (
        <ConfirmDialog
          title="Leave Room?"
          message={isOwner
            ? "You're the host — another player will take over hosting if you leave."
            : "You'll be removed from this room."}
          confirmLabel="Leave"
          cancelLabel="Stay"
          confirmTone="danger"
          onConfirm={handleLeave}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}

      {isOwner && isDebugMode() && (
        <CustomDealPanel socket={socket} onError={setError} />
      )}
    </div>
  );
}
