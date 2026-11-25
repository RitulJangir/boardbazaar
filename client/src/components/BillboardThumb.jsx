import React from 'react';
import { getAssetUrl } from '../api';

const PALETTES = {
  'Digital LED': ['#0f172a', '#2563eb', '#38bdf8'],
  Unipole: ['#022c22', '#059669', '#34d399'],
  Hoarding: ['#1e1b4b', '#4f46e5', '#818cf8'],
  Gantry: ['#27272a', '#ea580c', '#fb923c'],
  'Bus Shelter': ['#172554', '#0284c7', '#7dd3fc'],
  'Mall Facade': ['#3b0764', '#9333ea', '#e879f9']
};

export default function BillboardThumb({ board, className = 'h-48 w-full' }) {
  if (board.image_url) {
    return (
      <img
        src={getAssetUrl(board.image_url)}
        alt={board.title}
        className={`${className} object-cover`}
      />
    );
  }

  const [bg1, bg2, accent] = PALETTES[board.category] || PALETTES.Hoarding;
  const gradId = `g-${board.id || 'preview'}`;

  return (
    <svg viewBox="0 0 400 220" className={`${className} block`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${gradId})`} />
      {/* City skyline silhouette */}
      <path d="M0 180 L40 180 L40 140 L75 140 L75 180 L110 180 L110 125 L145 125 L145 180 L255 180 L255 135 L295 135 L295 180 L340 180 L340 148 L380 148 L380 180 L400 180 L400 220 L0 220 Z" fill="rgba(0,0,0,0.28)" />
      {/* Pole */}
      <rect x="193" y="138" width="14" height="82" fill="#94a3b8" />
      <rect x="197" y="138" width="4" height="82" fill="#e2e8f0" opacity="0.5" />
      {/* Board frame */}
      <rect x="70" y="34" width="260" height="108" rx="8" fill="#0f172a" stroke={accent} strokeWidth="3" />
      <rect x="78" y="42" width="244" height="92" rx="4" fill="#ffffff" opacity="0.96" />
      <text x="200" y="76" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a" fontFamily="sans-serif">
        {board.category.toUpperCase()}
      </text>
      <text x="200" y="100" textAnchor="middle" fontSize="12" fill="#475569" fontFamily="sans-serif">
        {board.width_ft} × {board.height_ft} ft • {board.city}
      </text>
      <rect x="132" y="110" width="136" height="16" rx="8" fill={bg2} />
      <text x="200" y="122" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#ffffff" fontFamily="sans-serif">
        {board.lighting} Display
      </text>
    </svg>
  );
}
