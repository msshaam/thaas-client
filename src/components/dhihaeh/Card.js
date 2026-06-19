import React from 'react';

const RED_SUITS = ['♥', '♦'];

function CardBack({ width, height, borderRadius }) {
  const w = width, h = height;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ borderRadius, display: 'block' }}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#c0001e" strokeWidth="2.5"/>
        </pattern>
        <pattern id="hatch2" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#a0001a" strokeWidth="2.5"/>
        </pattern>
        <clipPath id={`cc-${w}-${h}`}>
          <rect width={w} height={h} rx={parseFloat(borderRadius)||8}/>
        </clipPath>
      </defs>
      <g clipPath={`url(#cc-${w}-${h})`}>
        <rect width={w} height={h} fill="#b0001c"/>
        <rect width={w} height={h} fill="url(#hatch)" opacity="0.6"/>
        <rect width={w} height={h} fill="url(#hatch2)" opacity="0.4"/>
        <rect x="3" y="3" width={w-6} height={h-6} rx="5" fill="none" stroke="#e8192e" strokeWidth="1.5"/>
        <rect x="6" y="6" width={w-12} height={h-12} rx="3" fill="none" stroke="#e8192e" strokeWidth="0.8" opacity="0.6"/>
        <polygon points={`${w/2},${h/2-10} ${w/2+8},${h/2} ${w/2},${h/2+10} ${w/2-8},${h/2}`} fill="none" stroke="#ff3a4e" strokeWidth="1.5"/>
        <polygon points={`${w/2},${h/2-5} ${w/2+4},${h/2} ${w/2},${h/2+5} ${w/2-4},${h/2}`} fill="#e8192e"/>
        {[[10,10],[w-10,10],[10,h-10],[w-10,h-10]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#e8192e"/>
        ))}
      </g>
    </svg>
  );
}

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
        style={{ ...base, outline: selected ? '2px solid var(--accent)' : 'none', outlineOffset: '2px' }}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        <CardBack width={w} height={h} borderRadius={br}/>
      </div>
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
