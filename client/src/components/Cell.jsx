import React, { useState } from 'react';

const stoneColors = {
  black: 'bg-slate-950',
  white: 'bg-slate-100 border border-slate-400',
};

export function Cell({
  value,
  isWinning,
  onClick,
  isMyTurn,
  myRole,
}) {
  const [hovered, setHovered] = useState(false);

  const showPreview = !value && isMyTurn && hovered;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'relative flex items-center justify-center aspect-square',
        'bg-amber-200/70 border border-amber-500/60',
        'transition-colors duration-150',
        isWinning ? 'ring-2 ring-cyan-400 z-10' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {value && (
        <div
          className={[
            'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full shadow-md',
            'transition-transform duration-150',
            stoneColors[value],
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
      {showPreview && (
        <div
          className={[
            'absolute w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full pointer-events-none',
            myRole === 'black'
              ? 'border-2 border-slate-900/80'
              : 'border-2 border-slate-100/80',
            'opacity-40',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
    </button>
  );
}

