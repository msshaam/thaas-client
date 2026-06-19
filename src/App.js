import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './index.css';

import Home from './components/shared/Home';

// Digu
import DigULobby from './components/digu/DigULobby';
import WaitingRoom from './components/digu/WaitingRoom';
import DiGuGameBoard from './components/digu/GameBoard';
import RoundEnd from './components/digu/RoundEnd';

// Dhihaeh
import DhihaehLobby from './components/dhihaeh/Lobby';
import TeamSelect from './components/dhihaeh/TeamSelect';
import HukunSelect from './components/dhihaeh/HukunSelect';
import DhihaehGameBoard from './components/dhihaeh/GameBoard';
import Interrupted from './components/dhihaeh/Interrupted';

const DIGU_SERVER   = process.env.REACT_APP_DIGU_SERVER_URL   || 'http://localhost:3001';
const DHIHAEH_SERVER = process.env.REACT_APP_DHIHAEH_SERVER_URL || 'http://localhost:3002';

function makeSocket(url) {
  return io(url, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}

export default function App() {
  // Decide immediately on first render whether we're rejoining a saved
  // session, so a page refresh goes straight to "Rejoining…" instead of
  // flashing the Home screen first.
  const [game, setGame] = useState(() => {
    try {
      if (localStorage.getItem('thaas_dhihaeh_session')) return 'dhihaeh';
      if (localStorage.getItem('thaas_digu_session')) return 'digu';
    } catch {}
    return null;
  });

  // ── Digu state ────────────────────────────────────────────────
  const diGuSocketRef = useRef(null);
  const [diGuConnected, setDigUConnected] = useState(false);
  const [diGuRejoining, setDigURejoining] = useState(() => {
    try { return !!localStorage.getItem('thaas_digu_session'); } catch { return false; }
  });
  const [diGuSession, setDigUSession] = useState(null);
  const [diGuState, setDigUState] = useState(null);

  // ── Dhihaeh state ─────────────────────────────────────────────
  // Mirrors Digu exactly: while rejoining, we show a loading screen and
  // wait for fresh server state — no stale "where I left off" flash.
  const dhihaehSocketRef = useRef(null);
  const [dhihaehRejoining, setDhihaehRejoining] = useState(() => {
    try { return !!localStorage.getItem('thaas_dhihaeh_session'); } catch { return false; }
  });
  const [dhihaehSession, setDhihaehSession] = useState(null);
  const [dhihaehRoomState, setDhihaehRoomState] = useState(null);
  const [dhihaehGameState, setDhihaehGameState] = useState(null);

  // ── Init Digu socket ─────────────────────────────────────────
  useEffect(() => {
    const socket = makeSocket(DIGU_SERVER);
    diGuSocketRef.current = socket;

    socket.on('connect', () => {
      setDigUConnected(true);
      const saved = localStorage.getItem('thaas_digu_session');
      if (saved) {
        setDigURejoining(true);
        try {
          const sess = JSON.parse(saved);
          socket.emit('rejoinRoom', { roomCode: sess.roomCode, playerId: sess.playerId }, (res) => {
            if (res.success) {
              setDigUSession({ ...sess, playerName: res.playerName || sess.playerName });
              setGame('digu');
            } else {
              localStorage.removeItem('thaas_digu_session');
            }
            setDigURejoining(false);
          });
        } catch {
          localStorage.removeItem('thaas_digu_session');
          setDigURejoining(false);
        }
      }
    });
    socket.on('disconnect', () => setDigUConnected(false));
    socket.on('gameState', (state) => setDigUState(state));
    socket.on('roomClosed', () => {
      localStorage.removeItem('thaas_digu_session');
      setDigUSession(null); setDigUState(null);
    });

    return () => socket.disconnect();
  }, []);

  // ── Init Dhihaeh socket ──────────────────────────────────────
  useEffect(() => {
    const socket = makeSocket(DHIHAEH_SERVER);
    dhihaehSocketRef.current = socket;

    socket.on('roomUpdate', (state) => setDhihaehRoomState(state));
    socket.on('gameState', (state) => setDhihaehGameState(state));
    socket.on('gameStarted', () => {});
    socket.on('hukunSelected', () => {});
    socket.on('hukunRevealed', () => {});
    socket.on('roundComplete', () => {});

    // The moment we know the connection dropped, hide the stale board
    // immediately — don't wait for the reconnect handshake to finish.
    socket.on('disconnect', () => {
      const saved = localStorage.getItem('thaas_dhihaeh_session');
      if (saved) setDhihaehRejoining(true);
    });

    // Rejoin on every connect (covers refresh + reconnect after drop).
    // We deliberately show a loading screen during this — no stale board.
    socket.on('connect', () => {
      const saved = localStorage.getItem('thaas_dhihaeh_session');
      if (!saved) return;
      try {
        const sess = JSON.parse(saved);
        setDhihaehRejoining(true);
        socket.emit('rejoinRoom', { playerId: sess.playerId, roomCode: sess.roomCode }, (res) => {
          if (res.success) {
            setDhihaehSession(sess);
            setGame('dhihaeh');
          } else {
            localStorage.removeItem('thaas_dhihaeh_session');
            setDhihaehSession(null);
            setDhihaehGameState(null);
            setDhihaehRoomState(null);
          }
          setDhihaehRejoining(false);
        });
      } catch {
        localStorage.removeItem('thaas_dhihaeh_session');
        setDhihaehRejoining(false);
      }
    });

    // Browsers/mobile often suspend the websocket while a tab is backgrounded
    // without firing 'disconnect' until you return. So when the tab becomes
    // visible again, check right away and force a reconnect ourselves instead
    // of waiting for socket.io's own (possibly delayed) detection.
    function handleVisibility() {
      if (document.visibilityState !== 'visible') return;
      const saved = localStorage.getItem('thaas_dhihaeh_session');
      if (!saved) return;
      if (!socket.connected) {
        setDhihaehRejoining(true);
        socket.connect();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    // Connect if we have a saved session
    const saved = localStorage.getItem('thaas_dhihaeh_session');
    if (saved) { setDhihaehRejoining(true); socket.connect(); }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomUpdate');
      socket.off('gameState');
      socket.off('gameStarted');
      socket.off('hukunSelected');
      socket.off('hukunRevealed');
      socket.off('roundComplete');
      socket.disconnect();
    };
  }, []);

  // ── Game selection ───────────────────────────────────────────
  function selectGame(g) {
    setGame(g);
    if (g === 'digu') {
      diGuSocketRef.current?.connect();
    }
    if (g === 'dhihaeh') {
      // Connect immediately so listeners are active before lobby mounts
      if (!dhihaehSocketRef.current?.connected) {
        dhihaehSocketRef.current?.connect();
      }
    }
  }

  function goHome() {
    setGame(null);
  }

  // ── Digu handlers ────────────────────────────────────────────
  function handleDigUJoined({ roomCode, playerId, playerName }) {
    const sess = { roomCode, playerId, playerName };
    setDigUSession(sess);
    localStorage.setItem('thaas_digu_session', JSON.stringify(sess));
  }

  function handleDigULeave() {
    localStorage.removeItem('thaas_digu_session');
    setDigUSession(null); setDigUState(null);
    setGame(null);
  }

  // ── Dhihaeh handlers ─────────────────────────────────────────
  function handleDhihaehJoined({ playerId, roomCode, playerName }) {
    const sess = { playerId, roomCode, playerName };
    setDhihaehSession(sess);
    localStorage.setItem('thaas_dhihaeh_session', JSON.stringify(sess));
  }

  function handleDhihaehBack() {
    setDhihaehSession(null);
    setDhihaehRoomState(null);
    setDhihaehGameState(null);
    localStorage.removeItem('thaas_dhihaeh_session');
    setGame(null);
  }

  // ── Home screen ──────────────────────────────────────────────
  if (!game) {
    return <Home onSelectGame={selectGame} />;
  }

  // ── DIGU flow ────────────────────────────────────────────────
  if (game === 'digu') {
    const socket = diGuSocketRef.current;

    // Only show loading if we're actively rejoining a saved session
    if (diGuRejoining) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#8a9bb5', gap: 16 }}>
          <div style={{ fontSize: 40 }}>🃏</div>
          <p style={{ fontSize: 14, textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>Loading game…</p>
        </div>
      );
    }

    if (!diGuSession) {
      return <DigULobby socket={socket} onJoined={handleDigUJoined} onBack={goHome} />;
    }

    if (!diGuState) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#8a9bb5', textTransform: 'uppercase' }}>
          Loading game…
        </div>
      );
    }

    const { roomCode, playerId, playerName } = diGuSession;

    if (diGuState.status === 'waiting') {
      return <WaitingRoom gameState={diGuState} socket={socket} roomCode={roomCode} playerId={playerId} playerName={playerName} onLeave={handleDigULeave} />;
    }
    if (diGuState.status === 'roundEnd' || diGuState.status === 'interrupted') {
      return <RoundEnd gameState={diGuState} socket={socket} roomCode={roomCode} playerId={playerId} onBackHome={handleDigULeave} />;
    }
    return <DiGuGameBoard gameState={diGuState} socket={socket} roomCode={roomCode} playerId={playerId} onLeaveConfirmed={handleDigULeave} />;
  }

  // ── DHIHAEH flow ─────────────────────────────────────────────
  if (game === 'dhihaeh') {
    const socket = dhihaehSocketRef.current;

    // Only show this if we're actively rejoining a saved session —
    // hides any stale board so the player never sees "where they left off"
    // before it silently updates. Matches Digu's behavior exactly.
    if (dhihaehRejoining) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#8a9bb5', gap: 16 }}>
          <div style={{ fontSize: 40 }}>🃏</div>
          <p style={{ fontSize: 14, textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>Rejoining…</p>
        </div>
      );
    }

    if (!dhihaehSession) {
      return <DhihaehLobby socket={socket} onJoined={handleDhihaehJoined} onBack={goHome} />;
    }

    if (dhihaehGameState) {
      if (dhihaehGameState.status === 'hukun') {
        return <HukunSelect gameState={dhihaehGameState} session={dhihaehSession} roomState={dhihaehRoomState} socket={socket} onBack={handleDhihaehBack} />;
      }
      if (dhihaehGameState.status === 'playing' || dhihaehGameState.status === 'ended') {
        return <DhihaehGameBoard gameState={dhihaehGameState} session={dhihaehSession} roomState={dhihaehRoomState} socket={socket} onBack={handleDhihaehBack} />;
      }
      if (dhihaehGameState.status === 'interrupted') {
        return <Interrupted gameState={dhihaehGameState} session={dhihaehSession} roomState={dhihaehRoomState} socket={socket} onBack={handleDhihaehBack} />;
      }
    }

    if (dhihaehRoomState) {
      return <TeamSelect roomState={dhihaehRoomState} session={dhihaehSession} onBack={handleDhihaehBack} socket={socket} />;
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#8a9bb5', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🃏</div>
        <p style={{ fontSize: 14, textTransform: 'uppercase', animation: 'pulse 1.5s infinite' }}>Connecting…</p>
      </div>
    );
  }

  return null;
}
