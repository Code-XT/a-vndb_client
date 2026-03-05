import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { queryVNs } from '../services/vndbService';
import { VN } from '../types';
import { VNCard, VNCardSkeleton } from '../components/VNCard';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search as SearchIcon, X, SlidersHorizontal,
  Globe, Monitor, Star, Clock, Tag as TagIcon,
  ChevronDown, ArrowUpDown, Check,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English' },  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },  { code: 'ko', label: 'Korean' },
  { code: 'de', label: 'German' },   { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },  { code: 'it', label: 'Italian' },
];

const PLATFORMS = [
  { code: 'win', label: 'Windows' }, { code: 'lin', label: 'Linux' },
  { code: 'mac', label: 'macOS' },   { code: 'ios', label: 'iOS' },
  { code: 'and', label: 'Android' }, { code: 'ps4', label: 'PS4' },
  { code: 'ps5', label: 'PS5' },     { code: 'swi', label: 'Switch' },
  { code: 'web', label: 'Browser' },
];

const LENGTHS = [
  { value: '1', label: 'Very Short', sub: '< 2h' },
  { value: '2', label: 'Short',      sub: '2–10h' },
  { value: '3', label: 'Medium',     sub: '10–30h' },
  { value: '4', label: 'Long',       sub: '30–50h' },
  { value: '5', label: 'Very Long',  sub: '> 50h' },
];

const RATINGS = ['5', '6', '7', '7.5', '8', '8.5', '9'];

const SORT_OPTIONS = [
  { value: 'rating',    label: 'Rating' },
  { value: 'votecount', label: 'Popularity' },
  { value: 'released',  label: 'Release Date' },
  { value: 'title',     label: 'Title' },
];

// ─── Filter bottom sheet (mobile) / sidebar panel (desktop) ──────────────────

interface FilterState {
  langs: string[];
  plats: string[];
  length: string;
  minRating: string;
}

const FilterPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (f: FilterState) => void;
}> = ({ open, onClose, filters, onChange }) => {
  const [local, setLocal] = useState<FilterState>(filters);

  useEffect(() => { setLocal(filters); }, [filters]);

  const toggle = (key: 'langs' | 'plats', code: string) =>
    setLocal(f => ({
      ...f,
      [key]: f[key].includes(code) ? f[key].filter(x => x !== code) : [...f[key], code],
    }));

  const apply = () => { onChange(local); onClose(); };
  const clear  = () => setLocal({ langs: [], plats: [], length: '', minRating: '' });

  const activeCount = [local.langs.length > 0, local.plats.length > 0, !!local.length, !!local.minRating].filter(Boolean).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Sheet — slides up on mobile, sits inline on desktop */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <span className="font-bold text-slate-900 text-base">Filters</span>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              <FilterSections local={local} setLocal={setLocal} toggle={toggle} />
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-white">
              <button onClick={clear}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Clear{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <button onClick={apply}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>

          {/* Desktop inline panel */}
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm mt-2 p-5"
          >
            <div className="grid grid-cols-2 gap-6">
              <FilterSections local={local} setLocal={setLocal} toggle={toggle} />
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
              <button onClick={clear}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Clear{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <button onClick={apply}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Apply filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Filter content sections (shared between mobile sheet + desktop panel) ────

const FilterSections: React.FC<{
  local: FilterState;
  setLocal: React.Dispatch<React.SetStateAction<FilterState>>;
  toggle: (key: 'langs' | 'plats', code: string) => void;
}> = ({ local, setLocal, toggle }) => (
  <>
    {/* Language */}
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
        <Globe size={11} /> Language
      </p>
      <div className="flex flex-wrap gap-1.5">
        {LANGUAGES.map(l => {
          const active = local.langs.includes(l.code);
          return (
            <button key={l.code} onClick={() => toggle('langs', l.code)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {active && <Check size={10} strokeWidth={3} />}
              {l.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Platform */}
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
        <Monitor size={11} /> Platform
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLATFORMS.map(p => {
          const active = local.plats.includes(p.code);
          return (
            <button key={p.code} onClick={() => toggle('plats', p.code)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {active && <Check size={10} strokeWidth={3} />}
              {p.label}
            </button>
          );
        })}
      </div>
    </div>

    {/* Length */}
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
        <Clock size={11} /> Length
      </p>
      <div className="flex flex-wrap gap-1.5">
        {LENGTHS.map(l => {
          const active = local.length === l.value;
          return (
            <button key={l.value} onClick={() => setLocal(f => ({ ...f, length: active ? '' : l.value }))}
              className={`flex flex-col items-start px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span>{l.label}</span>
              <span className={`text-[10px] font-normal ${active ? 'text-indigo-200' : 'text-slate-400'}`}>{l.sub}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* Min Rating */}
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
        <Star size={11} /> Min Rating
      </p>
      <div className="flex flex-wrap gap-1.5">
        {RATINGS.map(r => {
          const active = local.minRating === r;
          return (
            <button key={r} onClick={() => setLocal(f => ({ ...f, minRating: active ? '' : r }))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-slate-700 border-slate-200 hover:border-yellow-400'
              }`}
            >
              {r}+
            </button>
          );
        })}
      </div>
    </div>
  </>
);

// ─── Main Search Page ─────────────────────────────────────────────────────────

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery]       = useState(searchParams.get('q') || '');
  const [sort, setSort]         = useState(searchParams.get('sort') || 'rating');
  const [reverse, setReverse]   = useState(searchParams.get('reverse') !== 'false');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Tag / dev from URL (set by VNDetails clicks)
  const [tagId,   setTagId]   = useState(searchParams.get('tagId')   || '');
  const [tagName, setTagName] = useState(searchParams.get('tagName') || '');
  const [devId,   setDevId]   = useState(searchParams.get('devId')   || '');
  const [devName, setDevName] = useState(searchParams.get('devName') || '');
  const [langParam, setLangParam] = useState(searchParams.get('language') || '');
  const [platParam, setPlatParam] = useState(searchParams.get('platform') || '');

  // Applied filter state
  const [filters, setFilters] = useState<FilterState>({
    langs:     langParam ? langParam.split(',') : [],
    plats:     platParam ? platParam.split(',') : [],
    length:    searchParams.get('length')    || '',
    minRating: searchParams.get('minRating') || '',
  });

  const [vns, setVns]         = useState<VN[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeFilterCount = [
    filters.langs.length > 0, filters.plats.length > 0,
    !!filters.length, !!filters.minRating,
    !!tagId, !!devId, !!langParam, !!platParam,
  ].filter(Boolean).length;

  const fetchResults = useCallback(async (pageNum: number, fresh: boolean) => {
    setLoading(true);
    if (fresh) setError(null);
    try {
      const f: any[] = [];
      if (filters.length)    f.push(['length', '=', parseInt(filters.length)]);
      if (filters.langs.length === 1) f.push(['lang', '=', filters.langs[0]]);
      else if (filters.langs.length > 1) f.push(['or', ...filters.langs.map(l => ['lang', '=', l])]);
      if (filters.plats.length === 1) f.push(['platform', '=', filters.plats[0]]);
      else if (filters.plats.length > 1) f.push(['or', ...filters.plats.map(p => ['platform', '=', p])]);
      if (filters.minRating) f.push(['rating', '>=', Math.round(parseFloat(filters.minRating) * 10)]);
      if (tagId)  f.push(['tag', '=', tagId]);
      if (devId)  f.push(['developer', '=', ['id', '=', devId]]);
      if (langParam && !filters.langs.includes(langParam)) f.push(['lang', '=', langParam]);
      if (platParam && !filters.plats.includes(platParam)) f.push(['platform', '=', platParam]);

      const data = await queryVNs({
        search: query.trim() || undefined,
        sort, reverse,
        filters: f.length > 0 ? f : undefined,
        page: pageNum, results: 20,
      });

      setVns(prev => fresh ? data.results : [...prev, ...data.results]);
      setHasMore(data.more);
    } catch (e: any) {
      setError(`Search failed: ${e.message}`);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [query, sort, reverse, filters, tagId, devId, langParam, platParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchResults(1, true);
      const p = new URLSearchParams();
      if (query) p.set('q', query);
      if (sort !== 'rating') p.set('sort', sort);
      if (!reverse) p.set('reverse', 'false');
      if (filters.length)    p.set('length', filters.length);
      if (filters.langs.length) p.set('language', filters.langs.join(','));
      if (filters.plats.length) p.set('platform', filters.plats.join(','));
      if (filters.minRating) p.set('minRating', filters.minRating);
      if (tagId)   { p.set('tagId', tagId);   if (tagName) p.set('tagName', tagName); }
      if (devId)   { p.set('devId', devId);   if (devName) p.set('devName', devName); }
      setSearchParams(p, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [query, sort, reverse, filters, tagId, devId, langParam, platParam]);

  const clearChip = (type: 'tag' | 'dev' | 'lang' | 'plat' | 'rating' | 'length') => {
    if (type === 'tag')    { setTagId(''); setTagName(''); }
    if (type === 'dev')    { setDevId(''); setDevName(''); }
    if (type === 'lang')   { setLangParam(''); }
    if (type === 'plat')   { setPlatParam(''); }
    if (type === 'rating') setFilters(f => ({ ...f, minRating: '' }));
    if (type === 'length') setFilters(f => ({ ...f, length: '' }));
  };

  const currentSortLabel = SORT_OPTIONS.find(s => s.value === sort)?.label ?? 'Sort';

  return (
    <div className="flex flex-col h-full">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 px-3 md:px-6 pt-3 pb-2 space-y-2">

        {/* Search input row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search visual novels…"
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSort(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <span className="sm:hidden"><ArrowUpDown size={15} /></span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => {
                      if (sort === opt.value) setReverse(r => !r);
                      else { setSort(opt.value); setReverse(true); }
                      setShowSort(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                      sort === opt.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                    {sort === opt.value && (
                      <span className="text-xs text-indigo-400">{reverse ? '↓' : '↑'}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeFilterCount > 0
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {(tagName || devName || langParam || platParam || filters.minRating || filters.length || filters.langs.length > 0 || filters.plats.length > 0) && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {tagName && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                <TagIcon size={9} />{tagName}
                <button onClick={() => clearChip('tag')} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {devName && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">
                {devName}
                <button onClick={() => clearChip('dev')} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {langParam && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                <Globe size={9} />{langParam.toUpperCase()}
                <button onClick={() => clearChip('lang')} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {platParam && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-semibold">
                <Monitor size={9} />{platParam.toUpperCase()}
                <button onClick={() => clearChip('plat')} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {filters.langs.map(l => (
              <span key={l} className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                <Globe size={9} />{LANGUAGES.find(x => x.code === l)?.label ?? l}
                <button onClick={() => setFilters(f => ({ ...f, langs: f.langs.filter(x => x !== l) }))} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            ))}
            {filters.plats.map(p => (
              <span key={p} className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-semibold">
                <Monitor size={9} />{PLATFORMS.find(x => x.code === p)?.label ?? p}
                <button onClick={() => setFilters(f => ({ ...f, plats: f.plats.filter(x => x !== p) }))} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            ))}
            {filters.minRating && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                <Star size={9} />≥{filters.minRating}
                <button onClick={() => clearChip('rating')} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {filters.length && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                <Clock size={9} />{LENGTHS.find(l => l.value === filters.length)?.label}
                <button onClick={() => clearChip('length')} className="ml-0.5 hover:opacity-70"><X size={9} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Filter panel (desktop inline, mobile sheet) ── */}
      <div className="px-3 md:px-6">
        <FilterPanel
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onChange={f => { setFilters(f); }}
        />
      </div>

      {/* ── Results ── */}
      <div className="flex-1 px-3 md:px-6 py-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200 mb-4">{error}</div>
        )}

        {/* Initial skeleton */}
        {initialLoad && loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <VNCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !initialLoad && vns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon size={36} className="text-slate-300 mb-3" />
            <p className="text-slate-700 font-semibold">No results found</p>
            <p className="text-slate-400 text-sm mt-1">Try different keywords or adjust filters.</p>
          </div>
        )}

        {/* Grid */}
        {vns.length > 0 && (
          <>
            {!loading && (
              <p className="text-xs text-slate-400 mb-3 tabular-nums">
                {vns.length} result{vns.length !== 1 ? 's' : ''}{hasMore ? '+' : ''}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {vns.map(vn => <VNCard key={vn.id} vn={vn} />)}
              {/* Append skeletons while loading more */}
              {loading && !initialLoad && Array.from({ length: 4 }).map((_, i) => <VNCardSkeleton key={`sk-${i}`} />)}
            </div>

            {!loading && hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => { const n = page + 1; setPage(n); fetchResults(n, false); }}
                  className="px-8 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
