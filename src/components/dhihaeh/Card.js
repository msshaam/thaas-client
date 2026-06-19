import React from 'react';

const RED_SUITS = ['♥', '♦'];

export default function Card({
  card, onClick, selected, faceDown, small, large,
  dragging, draggable,
  onDragStart, onDragOver, onDrop,
  onTouchStart, onTouchMove, onTouchEnd,
  style: extraStyle = {}
}) {
  const isRed = RED_SUITS.includes(card?.suit);
  const w = large ? 78 : small ? 52 : 68;
  const h = large ? 110 : small ? 74 : 96;
  const br = large ? '9px' : small ? '6px' : '8px';
  const rankSize = large ? 15 : small ? 12 : 15;
  const suitSize = large ? 14 : small ? 11 : 14;
  const centreSuit = large ? 30 : small ? 20 : 26;

  const base = {
    width: `${w}px`, height: `${h}px`,
    borderRadius: br,
    display: 'inline-flex', flexDirection: 'column',
    alignItems: 'flex-start', justifyContent: 'space-between',
    cursor: onClick ? 'pointer' : (draggable ? 'grab' : 'default'),
    userSelect: 'none', position: 'relative', flexShrink: 0,
    boxShadow: dragging
      ? '0 16px 40px rgba(0,0,0,0.7)'
      : selected ? '0 0 14px rgba(201,168,76,0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
    transform: selected ? 'translateY(-10px)' : dragging ? 'scale(1.08) translateY(-6px)' : 'none',
    transition: dragging ? 'box-shadow .1s' : 'transform .15s, box-shadow .15s',
    ...extraStyle
  };

  if (faceDown || card?.rank === '?') {
    return (
      <div
        style={{
          ...base,
          backgroundImage: 'url(/images/card-back.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          outline: selected ? '2px solid var(--accent)' : 'none', outlineOffset: '2px'
        }}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      />
    );
  }

  const p = large ? '5px 6px' : small ? '3px 4px' : '5px 6px';

  return (
    <div
      style={{
        ...base,
        background: 'var(--card-bg)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--card-border)',
        padding: p,
        color: isRed ? '#c0392b' : '#1a1a2e',
        fontFamily: "'Manrope', sans-serif",
      }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1.1 }}>
        <div style={{ fontSize:`${rankSize}px`, fontWeight:700 }}>{card.rank}</div>
        <div style={{ fontSize:`${suitSize}px` }}>{card.suit}</div>
      </div>
      <div style={{ fontSize:`${centreSuit}px`, alignSelf:'center', lineHeight:1 }}>{card.suit}</div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1.1, transform:'rotate(180deg)', alignSelf:'flex-end' }}>
        <div style={{ fontSize:`${rankSize}px`, fontWeight:700 }}>{card.rank}</div>
        <div style={{ fontSize:`${suitSize}px` }}>{card.suit}</div>
      </div>
    </div>
  );
}
