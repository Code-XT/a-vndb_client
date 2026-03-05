import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VN } from '../types';
import { Star, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettingsStore } from '../store/settingsStore';

// ─── Skeleton ────────────────────────────────────────────────────────────────

export const VNCardSkeleton: React.FC = () => (
  <div className="flex flex-col rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm">
    {/* shimmer image area */}
    <div className="aspect-[3/4] relative overflow-hidden bg-slate-200">
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
          animation: 'shimmer 1.4s infinite',
        }}
      />
    </div>
    <div className="p-2.5 space-y-1.5">
      <div className="h-3 bg-slate-200 rounded w-5/6" />
      <div className="h-3 bg-slate-100 rounded w-3/6" />
      <div className="h-2.5 bg-slate-100 rounded w-2/6 mt-2" />
    </div>
    <style>{`
      @keyframes shimmer { to { transform: translateX(200%); } }
    `}</style>
  </div>
);

// ─── No-cover placeholder ─────────────────────────────────────────────────────

const PALETTES = [
  { from: '#667eea', to: '#764ba2' }, // purple-blue
  { from: '#f093fb', to: '#f5576c' }, // pink-red
  { from: '#4facfe', to: '#00f2fe' }, // sky
  { from: '#43e97b', to: '#38f9d7' }, // mint
  { from: '#fa709a', to: '#fee140' }, // sunset
  { from: '#a18cd1', to: '#fbc2eb' }, // lavender
  { from: '#ffecd2', to: '#fcb69f' }, // peach — lighter, so text dark
  { from: '#30cfd0', to: '#330867' }, // teal-dark
];

const NoImagePlaceholder: React.FC<{ title: string }> = ({ title }) => {
  const idx = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length;
  const { from, to } = PALETTES[idx];

  // First letter of each word, max 2
  const initials = title
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  const light = idx === 6; // peach palette is light, needs dark text

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center select-none relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* Soft radial highlight */}
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6) 0%, transparent 60%)' }}
      />
      {/* Diagonal stripe pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 11px)',
        }}
      />

      {/* Initials */}
      <span
        className="relative z-10 font-black tracking-tight leading-none"
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          color: light ? 'rgba(30,30,50,0.75)' : 'rgba(255,255,255,0.95)',
          textShadow: light ? 'none' : '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        {initials}
      </span>

      {/* Tiny label */}
      <span
        className="relative z-10 text-[8px] font-bold uppercase tracking-[0.2em] mt-2 opacity-60"
        style={{ color: light ? '#333' : '#fff' }}
      >
        No Cover
      </span>
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h\u202f${m}m`;
}

interface VNCardProps { vn: VN }

export const VNCard: React.FC<VNCardProps> = ({ vn }) => {
  const { showNSFW } = useSettingsStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const vnId = vn.id || (vn as any)['vn.id'];
  if (!vnId) return null;

  const isNSFW = !showNSFW && vn.image && (vn.image.sexual > 1 || vn.image.violence > 1);
  const hasImage = !!vn.image?.url && !imgError;

  return (
    <Link to={`/vn/${vnId}`} className="block h-full">
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.13)' }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="group flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-sm"
      >
        {/* ── Cover ── */}
        <div className="relative aspect-[3/4] bg-slate-200 overflow-hidden flex-shrink-0">

          {/* shimmer while loading */}
          {hasImage && !imgLoaded && (
            <div className="absolute inset-0 bg-slate-200 overflow-hidden">
              <div
                className="absolute inset-0 -translate-x-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                  animation: 'shimmer 1.4s infinite',
                }}
              />
              <style>{`@keyframes shimmer { to { transform: translateX(200%); } }`}</style>
            </div>
          )}

          {/* image */}
          {hasImage ? (
            <img
              src={vn.image!.url}
              alt={vn.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${
                isNSFW ? 'blur-xl scale-110' : ''
              } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <NoImagePlaceholder title={vn.title} />
          )}

          {/* dark gradient at bottom for rating badge legibility */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* NSFW */}
          {isNSFW && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">
                NSFW
              </span>
            </div>
          )}

          {/* Rating */}
          {vn.rating && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[11px] font-bold text-white drop-shadow">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              {(vn.rating / 10).toFixed(1)}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="px-2.5 py-2 flex flex-col flex-1 min-h-0">
          <p className="text-[12px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors duration-150">
            {vn.title}
          </p>
          {vn.alttitle && (
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-tight">{vn.alttitle}</p>
          )}
          <div className="mt-auto pt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            {vn.released && <span>{vn.released.slice(0, 4)}</span>}
            {vn.released && vn.length_minutes != null && <span className="text-slate-300">·</span>}
            {vn.length_minutes != null && (
              <span className="flex items-center gap-0.5">
                <Clock size={8} strokeWidth={2.5} />
                {formatDuration(vn.length_minutes)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
