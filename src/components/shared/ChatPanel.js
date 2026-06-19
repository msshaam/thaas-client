import React, { useState, useEffect, useRef } from 'react';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ socket, playerId, onSend }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!socket) return;

    function handleHistory(history) {
      setMessages(history || []);
    }
    function handleMessage(message) {
      setMessages(prev => [...prev, message]);
      if (!openRef.current && message.playerId !== playerId) {
        setUnread(prev => prev + 1);
      }
    }

    socket.on('chatHistory', handleHistory);
    socket.on('chatMessage', handleMessage);
    return () => {
      socket.off('chatHistory', handleHistory);
      socket.off('chatMessage', handleMessage);
    };
  }, [socket, playerId]);

  // Auto-scroll to bottom on new message when open
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  function toggleOpen() {
    setOpen(prev => {
      const next = !prev;
      if (next) setUnread(0);
      return next;
    });
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setError('');
    onSend(text, (res) => {
      if (!res?.success) setError(res?.error || 'Could not send message');
    });
  }

  if (!socket) return null;

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={toggleOpen}
        style={{
          position: 'fixed', bottom: '16px', left: '16px', zIndex: 900,
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--accent)', color: '#000', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)'
        }}
      >
        💬
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            minWidth: '20px', height: '20px', borderRadius: '10px',
            background: 'var(--red)', color: '#fff', fontSize: '11px', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 5px', border: '2px solid var(--bg)'
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '78px', left: '16px', zIndex: 900,
          width: 'min(320px, calc(100vw - 32px))', height: 'min(420px, calc(100vh - 140px))',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
          }}>
            <span style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
              Room Chat
            </span>
            <span onClick={() => setOpen(false)} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1 }}>✕</span>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '20px' }}>
                No messages yet — say hi!
              </div>
            )}
            {messages.map(m => {
              const isMe = m.playerId === playerId;
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px', marginLeft: '4px' }}>
                      {m.playerName}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '8px 11px', borderRadius: '12px', fontSize: '13px', lineHeight: 1.4,
                    wordBreak: 'break-word',
                    background: isMe ? 'var(--accent)' : 'var(--surface2)',
                    color: isMe ? '#000' : 'var(--text)',
                    borderBottomRightRadius: isMe ? '3px' : '12px',
                    borderBottomLeftRadius: isMe ? '12px' : '3px'
                  }}>
                    {m.text}
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px', marginInline: '4px' }}>
                    {formatTime(m.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>

          {error && <div style={{ fontSize: '11px', color: 'var(--red)', padding: '0 12px 6px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Type a message…"
              maxLength={300}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: '20px', fontSize: '13px',
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none'
              }}
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              style={{
                padding: '9px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                background: draft.trim() ? 'var(--accent)' : 'var(--surface2)',
                color: draft.trim() ? '#000' : 'var(--muted)',
                border: 'none', cursor: draft.trim() ? 'pointer' : 'default'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
