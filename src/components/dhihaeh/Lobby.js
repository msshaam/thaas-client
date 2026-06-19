import React, { useState } from 'react';

export default function DhihaehLobby({ socket, onJoined, onBack }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const s = {
    input: {
      background: '#0d1520', border: '1.5px solid #1e2d45', borderRadius: 999,
      color: '#e8e0d4', padding: '12px 16px', fontSize: 16, width: '100%',
      textAlign: 'center',
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #3a7bd5, #5a9bf5)',
      color: '#fff', fontWeight: 700, fontSize: 15,
      padding: '13px 0', borderRadius: 999, width: '100%',
      letterSpacing: '0.03em', cursor: 'pointer',
    },
    btnSecondary: {
      background: 'transparent', border: '1.5px solid #1e2d45',
      color: '#8a9bb5', fontWeight: 500, fontSize: 14,
      padding: '10px 0', borderRadius: 999, width: '100%', cursor: 'pointer',
    },
  };

  function emit(event, payload, cb) {
    setLoading(true);
    if (socket.connected) {
      socket.emit(event, payload, (res) => { setLoading(false); cb(res); });
    } else {
      socket.once('connect', () => {
        socket.emit(event, payload, (res) => { setLoading(false); cb(res); });
      });
      socket.connect();
    }
  }

  function handleCreate() {
    if (!name.trim()) return setError('Enter your name.');
    emit('createRoom', { playerName: name.trim() }, (res) => {
      if (res.success) {
        localStorage.setItem('dhihaeh_session', JSON.stringify({ playerId: res.playerId, roomCode: res.roomCode, playerName: name.trim() }));
        onJoined({ playerId: res.playerId, roomCode: res.roomCode, playerName: name.trim() });
      } else setError(res.error || 'Failed to create room');
    });
  }

  function handleJoin() {
    if (!name.trim()) return setError('Enter your name.');
    if (!code.trim()) return setError('Enter a room code.');
    emit('joinRoom', { playerName: name.trim(), roomCode: code.trim().toUpperCase() }, (res) => {
      if (res.success) {
        localStorage.setItem('dhihaeh_session', JSON.stringify({ playerId: res.playerId, roomCode: res.roomCode, playerName: name.trim() }));
        onJoined({ playerId: res.playerId, roomCode: res.roomCode, playerName: name.trim() });
      } else setError(res.error || 'Failed to join room');
    });
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, var(--bg) 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            fontSize: 'clamp(42px, 12vw, 60px)', fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg, #3a7bd5, #5a9bf5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px',
          }}>
            DHIHAEH
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === null && (
            <>
              <button style={s.btnPrimary} onClick={() => { setMode('create'); setError(''); }}>Create Room</button>
              <div style={{ textAlign: 'center', color: '#3a4a65', fontSize: '12px' }}>OR</div>
              <button style={{ ...s.btnPrimary, background: 'transparent', border: '1.5px solid #3a7bd5', color: '#3a7bd5' }} onClick={() => { setMode('join'); setError(''); }}>Join Room</button>
            </>
          )}

          {mode === 'create' && (
            <>
              <input autoFocus style={s.input} placeholder="Your name" value={name} onChange={e => { setName(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleCreate()} maxLength={20} />
              {error && <div style={{ color: '#e05252', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
              <button style={s.btnPrimary} onClick={handleCreate} disabled={loading}>{loading ? 'Creating…' : 'Create Room'}</button>
              <button style={s.btnSecondary} onClick={() => { setMode(null); setError(''); setName(''); }}>Back</button>
            </>
          )}

          {mode === 'join' && (
            <>
              <input autoFocus style={s.input} placeholder="Your name" value={name} onChange={e => { setName(e.target.value); setError(''); }} maxLength={20} />
              <input style={{ ...s.input, letterSpacing: '0.15em', textTransform: 'uppercase' }} placeholder="ROOM CODE" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleJoin()} maxLength={6} />
              {error && <div style={{ color: '#e05252', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
              <button style={s.btnPrimary} onClick={handleJoin} disabled={loading}>{loading ? 'Joining…' : 'Join Room'}</button>
              <button style={s.btnSecondary} onClick={() => { setMode(null); setError(''); setName(''); setCode(''); }}>Back</button>
            </>
          )}
        </div>

        <button onClick={onBack} style={{ ...s.btnSecondary, marginTop: '12px' }}>← Back to Games</button>
      </div>
    </div>
  );
}
