import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, User, Star, BookOpen, Play, CheckCircle, PauseCircle, XCircle, Heart, Ban } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { fetchUlist } from '../services/vndbService';
import { VNCardSkeleton } from '../components/VNCard';
import { UlistEntry } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = [
  { id: 1, label: 'Playing',   icon: Play,         color: '#3b82f6' },
  { id: 2, label: 'Finished',  icon: CheckCircle,  color: '#10b981' },
  { id: 3, label: 'Stalled',   icon: PauseCircle,  color: '#f59e0b' },
  { id: 4, label: 'Dropped',   icon: XCircle,      color: '#ef4444' },
  { id: 5, label: 'Wishlist',  icon: Heart,        color: '#8b5cf6' },
  { id: 6, label: 'Blacklist', icon: Ban,          color: '#64748b' },
];

// ─── Shared placeholder (no external image) ───────────────────────────────────

const PALETTES = [
  { from: '#667eea', to: '#764ba2' },
  { from: '#f093fb', to: '#f5576c' },
  { from: '#4facfe', to: '#00f2fe' },
  { from: '#43e97b', to: '#38f9d7' },
  { from: '#fa709a', to: '#fee140' },
  { from: '#a18cd1', to: '#fbc2eb' },
  { from: '#ffecd2', to: '#fcb69f' },
  { from: '#30cfd0', to: '#330867' },
];

const NoImagePlaceholder: React.FC<{ title: string }> = ({ title }) => {
  const idx = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length;
  const { from, to } = PALETTES[idx];
  const initials = title
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
  const light = idx === 6;
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center select-none relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)` }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6) 0%, transparent 60%)' }}
      />
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 11px)' }}
      />
      <span
        className="relative z-10 font-black tracking-tight"
        style={{
          fontSize: 'clamp(1.2rem, 3.5vw, 2rem)',
          color: light ? 'rgba(30,30,50,0.75)' : 'rgba(255,255,255,0.95)',
        }}
      >
        {initials}
      </span>
      <span
        className="relative z-10 text-[7px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-50"
        style={{ color: light ? '#333' : '#fff' }}
      >
        No Cover
      </span>
    </div>
  );
};

// ─── Individual library card ───────────────────────────────────────────────────
// Self-contained so absolute overlays anchor correctly to this card's image.

const LibraryCard: React.FC<{ entry: UlistEntry }> = ({ entry }) => {
  const { showNSFW } = useSettingsStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const vn = entry.vn;
  const label = entry.labels?.[0];
  const score = entry.vote != null ? Math.round(entry.vote / 10) : null;
  const isNSFW = !showNSFW && vn.image && (vn.image.sexual > 1 || vn.image.violence > 1);
  const hasImage = !!vn.image?.url && !imgError;
  const statusColor = STATUS_META.find(s => s.id === label?.id)?.color ?? '#6366f1';

  return (
    <Link to={`/vn/${entry.id}`} className="block">
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.14)' }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-sm"
      >
        {/* ── Cover image ── */}
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

          {/* gradient for overlay legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* NSFW */}
          {isNSFW && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">
                NSFW
              </span>
            </div>
          )}

          {/* VN rating — top right */}
          {vn.rating && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow pointer-events-none">
              <Star size={9} className="fill-yellow-400 text-yellow-400" />
              {(vn.rating / 10).toFixed(1)}
            </div>
          )}

          {/* Status badge + user score — bottom of image */}
          {(label || score != null) && (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-2 pb-2 pointer-events-none">
              {label ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none text-white"
                  style={{ backgroundColor: statusColor }}
                >
                  {label.label}
                </span>
              ) : <span />}
              {score != null && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-300 drop-shadow">
                  <Star size={9} className="fill-yellow-400 text-yellow-400" />
                  {score}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Title row ── */}
        <div className="px-2.5 py-2">
          <p className="text-[11px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors duration-150">
            {vn.title}
          </p>
          {vn.released && (
            <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{vn.released.slice(0, 4)}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

// ─── Library page ─────────────────────────────────────────────────────────────

export const Library: React.FC = () => {
  const { token, user } = useAuthStore();
  const [entries, setEntries] = useState<UlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    fetchUlist(token, user.id, page)
      .then(data => {
        setEntries(prev => page === 1 ? data.results : [...prev, ...data.results]);
        setHasMore(data.more);
      })
      .catch(() => setError('Failed to load library. Check your token in Profile.'))
      .finally(() => setLoading(false));
  }, [token, user, page]);

  // ── Not logged in ──
  if (!token || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <User size={28} className="text-indigo-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Connect Your Account</h2>
        <p className="text-slate-500 text-sm mb-5 max-w-xs">
          Add your VNDB Personal Access Token to sync your library.
        </p>
        <Link to="/profile"
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Go to Profile
        </Link>
      </motion.div>
    );
  }

  const cnt = (id: number) => entries.filter(e => e.labels?.some(l => l.id === id)).length;
  const filtered = entries.filter(e => filter === 'all' || e.labels?.some(l => l.id === filter));

  // ── First-load skeleton ──
  if (loading && entries.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse mb-1" />
        <div className="h-3.5 w-20 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <VNCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Library</h1>
        <p className="text-slate-400 text-sm">{entries.length} titles</p>
      </div>

      {/* Status filter pills */}
      {entries.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {/* "All" pill */}
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <BookOpen size={11} />
            All
            <span className={`tabular-nums text-[10px] ${filter === 'all' ? 'text-slate-400' : 'text-slate-300'}`}>
              {entries.length}
            </span>
          </button>

          {STATUS_META.map(s => {
            const c = cnt(s.id);
            if (c === 0) return null;
            const active = filter === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setFilter(active ? 'all' : s.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                style={active ? { backgroundColor: s.color, borderColor: s.color } : {}}
              >
                <Icon size={11} />
                {s.label}
                <span className={`tabular-nums text-[10px] ${active ? 'text-white/70' : 'text-slate-300'}`}>{c}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen size={28} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium text-sm">Nothing here</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {filter === 'all' ? 'Your library is empty' : 'No titles with this status'}
          </p>
        </div>
      )}

      {/* Card grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(e => <LibraryCard key={e.id} entry={e} />)}
        </div>
      )}

      {loading && entries.length > 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-slate-400" size={22} />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </motion.div>
  );
};