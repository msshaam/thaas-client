import React from 'react';

export default function DisconnectVoteBanner({ disconnectVote, socket, loading, setLoading, setError }) {
  if (!disconnectVote?.eligible) return null;

  function vote(v) {
    setLoading?.(true);
    socket.emit('voteEndGame', { vote: v }, (res) => {
      setLoading?.(false);
      if (!res?.success) setError?.(res?.error || 'Could not submit vote');
    });
  }

  const names = disconnectVote.disconnectedPlayers.map(p => p.name).join(', ');

  return (
    <div style={{
      position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 500, width: '92%', maxWidth: '420px',
      background: 'var(--surface)', border: '1px solid var(--red)', borderRadius: '12px',
      padding: '14px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text)', textAlign: 'center', lineHeight: 1.5, marginBottom: '10px' }}>
        <strong>{names}</strong> has been disconnected for more than 5 minutes.
        {disconnectVote.mode === 'vote' ? ' End the game?' : ' End the game now?'}
        {disconnectVote.mode === 'vote' && (
          <span style={{ color: 'var(--muted)' }}> ({disconnectVote.votedCount || 0}/{disconnectVote.totalVoters || 0} voted)</span>
        )}
      </div>
      {disconnectVote.mode === 'vote' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => vote('yes')}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
              letterSpacing: '1px', background: 'var(--red)', color: '#fff', border: 'none',
              cursor: loading ? 'default' : 'pointer',
              boxShadow: disconnectVote.myVote === 'yes' ? '0 0 0 2px rgba(255,255,255,0.35) inset' : undefined
            }}
          >
            YES ({disconnectVote.yesVotes || 0})
          </button>
          <button
            onClick={() => vote('no')}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
              letterSpacing: '1px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)',
              cursor: loading ? 'default' : 'pointer',
              boxShadow: disconnectVote.myVote === 'no' ? '0 0 0 2px rgba(255,255,255,0.2) inset' : undefined
            }}
          >
            NO ({disconnectVote.noVotes || 0})
          </button>
        </div>
      ) : (
        <button
          onClick={() => vote('yes')}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
            letterSpacing: '1px', background: 'var(--red)', color: '#fff', border: 'none',
            cursor: loading ? 'default' : 'pointer'
          }}
        >
          End Game
        </button>
      )}
    </div>
  );
}
