import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { queryReleases } from '../services/vndbService';
import { Release } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, SlidersHorizontal, ExternalLink, ChevronDown, ChevronUp,
  Calendar, Globe, Monitor, ArrowUpDown, Check, Package, Mic2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_META: Record<string, { flag: string; label: string }> = {
  en: { flag: '🇬🇧', label: 'English' },   ja: { flag: '🇯🇵', label: 'Japanese' },
  zh: { flag: '🇨🇳', label: 'Chinese' },   ko: { flag: '🇰🇷', label: 'Korean' },
  de: { flag: '🇩🇪', label: 'German' },    fr: { flag: '🇫🇷', label: 'French' },
  es: { flag: '🇪🇸', label: 'Spanish' },   pt: { flag: '🇵🇹', label: 'Portuguese' },
  ru: { flag: '🇷🇺', label: 'Russian' },   it: { flag: '🇮🇹', label: 'Italian' },
  nl: { flag: '🇳🇱', label: 'Dutch' },     pl: { flag: '🇵🇱', label: 'Polish' },
  uk: { flag: '🇺🇦', label: 'Ukrainian' }, tr: { flag: '🇹🇷', label: 'Turkish' },
  vi: { flag: '🇻🇳', label: 'Vietnamese' }, id: { flag: '🇮🇩', label: 'Indonesian' },
  th: { flag: '🇹🇭', label: 'Thai' },
};

const PLAT_STYLE: Record<string, { label: string; cls: string }> = {
  win: { label: 'Win',     cls: 'bg-sky-100 text-sky-700' },
  lin: { label: 'Linux',   cls: 'bg-orange-100 text-orange-700' },
  mac: { label: 'Mac',     cls: 'bg-zinc-200 text-zinc-700' },
  ios: { label: 'iOS',     cls: 'bg-slate-100 text-slate-600' },
  and: { label: 'Android', cls: 'bg-green-100 text-green-700' },
  ps4: { label: 'PS4',     cls: 'bg-blue-100 text-blue-800' },
  ps5: { label: 'PS5',     cls: 'bg-blue-100 text-blue-800' },
  psv: { label: 'Vita',    cls: 'bg-indigo-100 text-indigo-700' },
  ps3: { label: 'PS3',     cls: 'bg-blue-100 text-blue-700' },
  psp: { label: 'PSP',     cls: 'bg-indigo-100 text-indigo-600' },
  swi: { label: 'Switch',  cls: 'bg-red-100 text-red-700' },
  xbo: { label: 'Xbox',    cls: 'bg-green-100 text-green-800' },
  web: { label: 'Browser', cls: 'bg-teal-100 text-teal-700' },
  dos: { label: 'DOS',     cls: 'bg-slate-100 text-slate-500' },
  p98: { label: 'PC-98',   cls: 'bg-slate-100 text-slate-500' },
  oth: { label: 'Other',   cls: 'bg-slate-100 text-slate-400' },
};

const STORE_META: Record<string, { label: string; cls: string }> = {
  steam:     { label: 'Steam',      cls: 'bg-[#1b2838] text-white' },
  gog:       { label: 'GOG',        cls: 'bg-[#86329e] text-white' },
  itchio:    { label: 'itch.io',    cls: 'bg-[#fa5c5c] text-white' },
  dlsite:    { label: 'DLsite',     cls: 'bg-[#e6003e] text-white' },
  dmm:       { label: 'DMM',        cls: 'bg-[#c0392b] text-white' },
  jast:      { label: 'JAST',       cls: 'bg-violet-600 text-white' },
  mg:        { label: 'MangaGamer', cls: 'bg-pink-600 text-white' },
  nutaku:    { label: 'Nutaku',     cls: 'bg-orange-500 text-white' },
  denpasoft: { label: 'Denpasoft',  cls: 'bg-purple-600 text-white' },
  fakku:     { label: 'FAKKU',      cls: 'bg-[#4a148c] text-white' },
  playasia:  { label: 'Play-Asia',  cls: 'bg-sky-600 text-white' },
  amazon:    { label: 'Amazon',     cls: 'bg-[#ff9900] text-black' },
};

const VOICED_LABEL: Record<number, string> = {
  1: 'Unvoiced', 2: 'Ero only', 3: 'Partial', 4: 'Full',
};

const SORT_OPTIONS = [
  { value: 'released', label: 'Release Date' },
  { value: 'title',    label: 'Title' },
  { value: 'id',       label: 'ID' },
];

const LANGUAGES = [
  'en', 'ja', 'zh', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'it', 'nl', 'pl', 'vi', 'id',
];

const PLATFORMS = ['win', 'lin', 'mac', 'ios', 'and', 'ps5', 'ps4', 'psv', 'swi', 'xbo', 'web'];

function ageBadge(age: number | null): { label: string; cls: string } | null {
  if (age === null) return null;
  if (age === 0) return { label: 'All ages', cls: 'bg-green-100 text-green-700 border-green-200' };
  if (age < 18)  return { label: `${age}+`,  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return { label: '18+', cls: 'bg-red-100 text-red-600 border-red-200' };
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
  langs: string[];
  plats: string[];
  rtype: string;   // complete | partial | trial | ''
  minage: string;  // '' | '0' | '18'
  freeware: boolean;
  patch: boolean;
  official: boolean;
  mtl: boolean;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  langs: [], plats: [], rtype: '', minage: '',
  freeware: false, patch: false, official: false, mtl: false,
  dateFrom: '', dateTo: '',
};

// ─── Filter panel ─────────────────────────────────────────────────────────────

const FilterPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}> = ({ open, onClose, filters, onApply }) => {
  const [local, setLocal] = useState<Filters>(filters);
  useEffect(() => setLocal(filters), [filters, open]);

  const toggleArr = (key: 'langs' | 'plats', val: string) =>
    setLocal(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));

  const activeCount = [
    local.langs.length > 0, local.plats.length > 0,
    !!local.rtype, !!local.minage, local.freeware, local.patch,
    local.official, local.mtl, !!local.dateFrom, !!local.dateTo,
  ].filter(Boolean).length;

  const content = (
    <div className="space-y-5">
      {/* Languages */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Globe size={10}/>Language</p>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map(l => {
            const m = LANG_META[l];
            const on = local.langs.includes(l);
            return (
              <button key={l} onClick={() => toggleArr('langs', l)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {on && <Check size={10} strokeWidth={3}/>}
                {m?.flag} {m?.label ?? l.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Monitor size={10}/>Platform</p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map(p => {
            const s = PLAT_STYLE[p];
            const on = local.plats.includes(p);
            return (
              <button key={p} onClick={() => toggleArr('plats', p)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  on ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {on && <Check size={10} strokeWidth={3}/>}
                {s?.label ?? p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Release type */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</p>
        <div className="flex gap-1.5">
          {['', 'complete', 'partial', 'trial'].map(v => (
            <button key={v} onClick={() => setLocal(f => ({ ...f, rtype: v }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all ${
                local.rtype === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {v === '' ? 'Any' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Age rating */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Age Rating</p>
        <div className="flex gap-1.5">
          {[{ v: '', l: 'Any' }, { v: '0', l: 'All ages' }, { v: '18', l: '18+' }].map(o => (
            <button key={o.v} onClick={() => setLocal(f => ({ ...f, minage: o.v }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                local.minage === o.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar size={10}/>Release Date Range</p>
        <div className="flex items-center gap-2">
          <input type="date" value={local.dateFrom}
            onChange={e => setLocal(f => ({ ...f, dateFrom: e.target.value }))}
            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={local.dateTo}
            onChange={e => setLocal(f => ({ ...f, dateTo: e.target.value }))}
            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Toggles */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Properties</p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'official' as const,  label: 'Official only' },
            { key: 'freeware' as const,  label: 'Freeware' },
            { key: 'patch'    as const,  label: 'Patches' },
            { key: 'mtl'      as const,  label: 'Show MTL' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setLocal(f => ({ ...f, [key]: !f[key] }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                local[key] ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {local[key] && <Check size={10} strokeWidth={3}/>}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Mobile bottom sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl max-h-[88vh] flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200"/>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <span className="font-bold text-slate-900">Filters</span>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100"><X size={16}/></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">{content}</div>
            <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-white flex-shrink-0">
              <button onClick={() => { setLocal(DEFAULT_FILTERS); }}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Clear{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <button onClick={() => { onApply(local); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>

          {/* Desktop inline */}
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm mt-2 p-5"
          >
            <div className="grid grid-cols-2 gap-6">{content}</div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => setLocal(DEFAULT_FILTERS)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Clear{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <button onClick={() => { onApply(local); onClose(); }}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
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

// ─── Release row card ─────────────────────────────────────────────────────────

const ReleaseCard: React.FC<{ release: Release }> = ({ release: r }) => {
  const [expanded, setExpanded] = useState(false);

  const isMTL     = r.languages.some(l => l.mtl);
  const devs      = r.producers.filter(p => p.developer);
  const pubs      = r.producers.filter(p => p.publisher);
  const age       = ageBadge(r.minage);
  const rtype     = r.vns[0]?.rtype ?? 'complete';
  const linkedVN  = r.vns[0];
  const storeLinks = r.extlinks.filter(l => STORE_META[l.name]);
  const otherLinks = r.extlinks.filter(l => !STORE_META[l.name]);

  const rtypeCls = rtype === 'complete'
    ? 'bg-indigo-100 text-indigo-700'
    : rtype === 'partial'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-md ${expanded ? 'shadow-md' : 'shadow-sm'}`}>
      {/* Main row */}
      <div
        className="cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Top section: VN cover + title info */}
        <div className="flex gap-3 p-4">
          {/* VN thumbnail */}
          {linkedVN?.image?.url ? (
            <Link
              to={`/vn/${linkedVN.id}`}
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden border border-slate-200 block"
            >
              <img
                src={linkedVN.image.url}
                alt={linkedVN.title}
                className={`w-full h-full object-cover object-center ${
                  linkedVN.image.sexual > 1 ? 'blur-sm' : ''
                }`}
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <div className="flex-shrink-0 w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 border border-slate-200 flex items-center justify-center">
              <Package size={16} className="text-indigo-400"/>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Release title */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-tight truncate">{r.title}</p>
                {r.alttitle && r.alttitle !== r.title && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{r.alttitle}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${rtypeCls}`}>{rtype}</span>
                {expanded
                  ? <ChevronUp size={13} className="text-slate-400"/>
                  : <ChevronDown size={13} className="text-slate-400"/>
                }
              </div>
            </div>

            {/* VN link */}
            {linkedVN && (
              <Link
                to={`/vn/${linkedVN.id}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline mt-0.5 block truncate font-medium"
              >
                {linkedVN.title}
              </Link>
            )}

            {/* Meta row 1: date + lang flags */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
              {r.released && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                  <Calendar size={9}/>{r.released}
                </span>
              )}
              <div className="flex items-center gap-0.5">
                {r.languages.map(l => (
                  <span key={l.lang}
                    title={`${LANG_META[l.lang]?.label ?? l.lang}${l.mtl ? ' (MTL)' : ''}`}
                    className={`text-sm leading-none ${l.mtl ? 'opacity-40' : ''}`}
                  >
                    {LANG_META[l.lang]?.flag ?? l.lang.toUpperCase()}
                  </span>
                ))}
                {isMTL && <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 font-black px-1 rounded">MTL</span>}
              </div>
            </div>

            {/* Meta row 2: platforms + badges */}
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {r.platforms.map(p => {
                const s = PLAT_STYLE[p];
                return (
                  <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s?.cls ?? 'bg-slate-100 text-slate-500'}`}>
                    {s?.label ?? p}
                  </span>
                );
              })}
              {age && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${age.cls}`}>{age.label}</span>}
              {r.freeware && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Free</span>}
              {r.patch    && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-200">Patch</span>}
              {r.has_ero  && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-200">18+</span>}
              {r.uncensored === true && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-200">Uncensored</span>}
              {!r.official && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Unofficial</span>}
            </div>
          </div>
        </div>

        {/* Store links row — always visible */}
        {storeLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3 pt-0" onClick={e => e.stopPropagation()}>
            {storeLinks.map((l, i) => {
              const m = STORE_META[l.name];
              return (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 ${m?.cls ?? 'bg-indigo-600 text-white'}`}
                >
                  <ExternalLink size={9} strokeWidth={2.5}/>
                  {m?.label ?? l.label}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {devs.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Developer</p>
              <div className="flex flex-wrap gap-1">
                {devs.map(d => (
                  <span key={d.id} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded font-semibold">{d.name}</span>
                ))}
              </div>
            </div>
          )}
          {pubs.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Publisher</p>
              <div className="flex flex-wrap gap-1">
                {pubs.map(p => (
                  <span key={p.id} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded font-semibold">{p.name}</span>
                ))}
              </div>
            </div>
          )}
          {(r.engine || r.resolution || r.voiced) && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Technical</p>
              <div className="space-y-0.5 text-slate-600">
                {r.engine  && <p><span className="text-slate-400">Engine</span> {r.engine}</p>}
                {r.voiced  && <p className="flex items-center gap-1"><Mic2 size={9} className="text-slate-400"/>{VOICED_LABEL[r.voiced]}</p>}
                {r.resolution && (
                  <p><span className="text-slate-400">Res</span> {Array.isArray(r.resolution) ? `${r.resolution[0]}×${r.resolution[1]}` : 'Non-standard'}</p>
                )}
              </div>
            </div>
          )}
          {r.languages.length > 0 && (
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Languages</p>
              <div className="space-y-0.5">
                {r.languages.map(l => (
                  <div key={l.lang} className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{LANG_META[l.lang]?.flag ?? '🌐'}</span>
                    <span className="text-slate-700 font-semibold">{l.title || LANG_META[l.lang]?.label || l.lang.toUpperCase()}</span>
                    {l.mtl && <span className="text-[8px] bg-amber-100 text-amber-700 font-black px-1 rounded">MTL</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {r.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-slate-600 italic leading-relaxed">{r.notes.replace(/\[[^\]]*\]/g, '').trim()}</p>
            </div>
          )}
          {otherLinks.length > 0 && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Other Links</p>
              <div className="flex flex-wrap gap-1.5">
                {otherLinks.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg"
                  >
                    <ExternalLink size={9}/>{l.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ReleaseSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3 animate-pulse">
    <div className="w-12 h-16 rounded-lg bg-slate-200 flex-shrink-0"/>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-200 rounded w-2/3"/>
      <div className="h-3 bg-slate-100 rounded w-1/3"/>
      <div className="h-3 bg-slate-100 rounded w-1/2"/>
      <div className="flex gap-1.5 mt-2">
        <div className="h-5 w-12 bg-slate-200 rounded"/>
        <div className="h-5 w-16 bg-slate-200 rounded"/>
        <div className="h-5 w-10 bg-slate-200 rounded"/>
      </div>
    </div>
  </div>
);

// ─── Chip component ───────────────────────────────────────────────────────────

const Chip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="flex-shrink-0 flex items-center gap-1 text-[11px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
    {label}
    <button onClick={onRemove} className="hover:opacity-70 ml-0.5"><X size={9}/></button>
  </span>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const Releases: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery]         = useState(searchParams.get('q') || '');
  const [sort, setSort]           = useState(searchParams.get('sort') || 'released');
  const [reverse, setReverse]     = useState(searchParams.get('reverse') !== 'false');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort]   = useState(false);
  const [filters, setFilters]     = useState<Filters>(DEFAULT_FILTERS);

  const [releases, setReleases]   = useState<Release[]>([]);
  const [loading, setLoading]     = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [total, setTotal]         = useState<number | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Build filters array for API
  const buildApiFilters = useCallback((f: Filters): any[] => {
    const out: any[] = [];
    if (f.langs.length === 1)  out.push(['lang', '=', f.langs[0]]);
    else if (f.langs.length > 1) out.push(['or', ...f.langs.map(l => ['lang', '=', l])]);
    if (f.plats.length === 1)  out.push(['platform', '=', f.plats[0]]);
    else if (f.plats.length > 1) out.push(['or', ...f.plats.map(p => ['platform', '=', p])]);
    if (f.rtype)    out.push(['rtype', '=', f.rtype]);
    if (f.minage === '0')  out.push(['minage', '=', 0]);
    if (f.minage === '18') out.push(['minage', '=', 18]);
    if (f.freeware) out.push(['freeware', '=', 1]);
    if (f.patch)    out.push(['patch', '=', 1]);
    if (f.official) out.push(['official', '=', 1]);
    // Note: 'mtl' is not a direct release filter — it's a sub-field of languages.
    // MTL filtering is applied client-side after fetching results.
    if (f.dateFrom) out.push(['released', '>=', f.dateFrom.replace(/-/g, '')]);
    if (f.dateTo)   out.push(['released', '<=', f.dateTo.replace(/-/g, '')]);
    return out;
  }, []);

  const doFetch = useCallback(async (pageNum: number, fresh: boolean) => {
    setLoading(true);
    if (fresh) setError(null);
    try {
      const data = await queryReleases({
        search: query.trim() || undefined,
        sort, reverse,
        filters: buildApiFilters(filters),
        page: pageNum,
        results: 25,
      });
      // Filter out MTL releases client-side (mtl is a languages sub-field, not a direct API filter)
      const results = filters.mtl ? data.results : data.results.filter(r => !r.languages.some((l: any) => l.mtl));
      setReleases(prev => fresh ? results : [...prev, ...results]);
      setHasMore(data.more);
      if (fresh && data.count != null) setTotal(data.count);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [query, sort, reverse, filters, buildApiFilters]);

  // Debounce on deps change
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      doFetch(1, true);
      // sync URL
      const p = new URLSearchParams();
      if (query) p.set('q', query);
      if (sort !== 'released') p.set('sort', sort);
      if (!reverse) p.set('reverse', 'false');
      setSearchParams(p, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [query, sort, reverse, filters]);

  const activeCount = buildApiFilters(filters).length
    + (filters.langs.length > 0 ? 1 : 0)
    + (filters.plats.length > 0 ? 1 : 0);

  const currentSortLabel = SORT_OPTIONS.find(s => s.value === sort)?.label ?? 'Sort';

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 px-3 md:px-6 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search releases…"
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
                <X size={14}/>
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0" ref={sortRef}>
            <button onClick={() => setShowSort(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <span className="sm:hidden"><ArrowUpDown size={15}/></span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${showSort ? 'rotate-180' : ''}`}/>
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[150px]">
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
                    {sort === opt.value && <span className="text-xs text-indigo-400">{reverse ? '↓' : '↑'}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeCount > 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={15}/>
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {(filters.langs.length > 0 || filters.plats.length > 0 || filters.rtype || filters.minage || filters.freeware || filters.patch || filters.official || filters.dateFrom || filters.dateTo) && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {filters.langs.map(l => (
              <Chip key={l} label={`${LANG_META[l]?.flag ?? ''} ${LANG_META[l]?.label ?? l}`}
                onRemove={() => setFilters(f => ({ ...f, langs: f.langs.filter(x => x !== l) }))}/>
            ))}
            {filters.plats.map(p => (
              <Chip key={p} label={PLAT_STYLE[p]?.label ?? p}
                onRemove={() => setFilters(f => ({ ...f, plats: f.plats.filter(x => x !== p) }))}/>
            ))}
            {filters.rtype && <Chip label={`Type: ${filters.rtype}`} onRemove={() => setFilters(f => ({ ...f, rtype: '' }))}/>}
            {filters.minage === '0'  && <Chip label="All ages" onRemove={() => setFilters(f => ({ ...f, minage: '' }))}/>}
            {filters.minage === '18' && <Chip label="18+"      onRemove={() => setFilters(f => ({ ...f, minage: '' }))}/>}
            {filters.freeware && <Chip label="Freeware" onRemove={() => setFilters(f => ({ ...f, freeware: false }))}/>}
            {filters.patch    && <Chip label="Patch"    onRemove={() => setFilters(f => ({ ...f, patch: false }))}/>}
            {filters.official && <Chip label="Official" onRemove={() => setFilters(f => ({ ...f, official: false }))}/>}
            {filters.dateFrom && <Chip label={`From ${filters.dateFrom}`} onRemove={() => setFilters(f => ({ ...f, dateFrom: '' }))}/>}
            {filters.dateTo   && <Chip label={`To ${filters.dateTo}`}     onRemove={() => setFilters(f => ({ ...f, dateTo: '' }))}/>}
          </div>
        )}
      </div>

      {/* Filter panel */}
      <div className="px-3 md:px-6">
        <FilterPanel
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onApply={f => { setFilters(f); setShowFilters(false); }}
        />
      </div>

      {/* ── Results ── */}
      <div className="flex-1 px-3 md:px-6 py-4">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        {/* First load skeleton */}
        {firstLoad && loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <ReleaseSkeleton key={i}/>)}
          </div>
        )}

        {/* Empty */}
        {!loading && !firstLoad && releases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={36} className="text-slate-300 mb-3"/>
            <p className="text-slate-700 font-semibold">No releases found</p>
            <p className="text-slate-400 text-sm mt-1">Try different keywords or adjust filters.</p>
          </div>
        )}

        {/* Results count */}
        {releases.length > 0 && !firstLoad && (
          <p className="text-xs text-slate-400 mb-3 tabular-nums">
            {releases.length}{hasMore ? '+' : ''} release{releases.length !== 1 ? 's' : ''}
            {total != null && total !== releases.length ? ` of ${total.toLocaleString()}` : ''}
          </p>
        )}

        {/* Cards */}
        {releases.length > 0 && (
          <div className="space-y-3">
            {releases.map(r => <ReleaseCard key={r.id} release={r}/>)}
            {/* Append skeletons while loading more */}
            {loading && !firstLoad && Array.from({ length: 3 }).map((_, i) => <ReleaseSkeleton key={`sk-${i}`}/>)}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-8 pb-4">
            <button
              onClick={() => { const n = page + 1; setPage(n); doFetch(n, false); }}
              className="px-8 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};