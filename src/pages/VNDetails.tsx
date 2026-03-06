import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getVN,
  getVNCharacters,
  getVNPublishers,
  getVNReleases,
  updateUlist,
  removeFromUlist,
} from "../services/vndbService";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import { VN, UlistEntry, VNCharacter, Release } from "../types";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Bookmark,
  Loader2,
  Trash2,
  Users,
  Image as ImageIcon,
  Globe,
  Monitor,
  Type,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Tag,
  User,
  CheckCircle,
  BookOpen,
  Info,
  X,
  Package,
  ExternalLink,
} from "lucide-react";
import { ImageModal } from "../components/ImageModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function stripMarkup(s: string): string {
  return s
    .replace(/\[url=[^\]]*\]/gi, "")
    .replace(/\[\/url\]/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/<[^>]*>/gm, "")
    .trim();
}

// Language code → flag emoji + label
const LANG_META: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  ja: { flag: "🇯🇵", label: "Japanese" },
  zh: { flag: "🇨🇳", label: "Chinese" },
  ko: { flag: "🇰🇷", label: "Korean" },
  de: { flag: "🇩🇪", label: "German" },
  fr: { flag: "🇫🇷", label: "French" },
  es: { flag: "🇪🇸", label: "Spanish" },
  pt: { flag: "🇵🇹", label: "Portuguese" },
  ru: { flag: "🇷🇺", label: "Russian" },
  it: { flag: "🇮🇹", label: "Italian" },
  nl: { flag: "🇳🇱", label: "Dutch" },
  pl: { flag: "🇵🇱", label: "Polish" },
  uk: { flag: "🇺🇦", label: "Ukrainian" },
  tr: { flag: "🇹🇷", label: "Turkish" },
  ar: { flag: "🇸🇦", label: "Arabic" },
  vi: { flag: "🇻🇳", label: "Vietnamese" },
  id: { flag: "🇮🇩", label: "Indonesian" },
  th: { flag: "🇹🇭", label: "Thai" },
};

// Age rating → badge label + color
function ageBadge(age: number | null): { label: string; cls: string } | null {
  if (age === null) return null;
  if (age === 0)
    return { label: "All ages", cls: "bg-green-100 text-green-800" };
  if (age < 13) return { label: `${age}+`, cls: "bg-blue-100 text-blue-800" };
  if (age < 18)
    return { label: `${age}+`, cls: "bg-yellow-100 text-yellow-800" };
  return { label: "18+", cls: "bg-red-100 text-red-800" };
}

// Voiced rating label
const VOICED: Record<number, string> = {
  1: "Not voiced",
  2: "Ero only",
  3: "Partially",
  4: "Fully voiced",
};

// rtype badge
const RTYPE_META: Record<string, { label: string; cls: string }> = {
  complete: { label: "Complete", cls: "bg-indigo-100 text-indigo-700" },
  partial: { label: "Partial", cls: "bg-amber-100  text-amber-700" },
  trial: { label: "Trial", cls: "bg-slate-100  text-slate-600" },
};

// ─── Section wrapper ─────────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Icon size={15} className="text-indigo-500 flex-shrink-0" />
          {title}
        </span>
        {open ? (
          <ChevronUp size={15} className="text-slate-400" />
        ) : (
          <ChevronDown size={15} className="text-slate-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
};

// ─── Platform chips ───────────────────────────────────────────────────────────

const PLAT_STYLE: Record<string, { label: string; cls: string }> = {
  win: { label: "Win", cls: "bg-sky-100 text-sky-700" },
  lin: { label: "Linux", cls: "bg-orange-100 text-orange-700" },
  mac: { label: "Mac", cls: "bg-zinc-200 text-zinc-700" },
  ios: { label: "iOS", cls: "bg-slate-100 text-slate-600" },
  and: { label: "Android", cls: "bg-green-100 text-green-700" },
  ps4: { label: "PS4", cls: "bg-blue-100 text-blue-800" },
  ps5: { label: "PS5", cls: "bg-blue-100 text-blue-800" },
  psv: { label: "Vita", cls: "bg-indigo-100 text-indigo-700" },
  ps3: { label: "PS3", cls: "bg-blue-100 text-blue-700" },
  psp: { label: "PSP", cls: "bg-indigo-100 text-indigo-600" },
  swi: { label: "Switch", cls: "bg-red-100 text-red-700" },
  xbo: { label: "Xbox", cls: "bg-green-100 text-green-800" },
  web: { label: "Browser", cls: "bg-teal-100 text-teal-700" },
  dos: { label: "DOS", cls: "bg-slate-100 text-slate-500" },
  p98: { label: "PC-98", cls: "bg-slate-100 text-slate-500" },
  p88: { label: "PC-88", cls: "bg-slate-100 text-slate-500" },
  fmt: { label: "FMT", cls: "bg-slate-100 text-slate-500" },
  sat: { label: "Saturn", cls: "bg-slate-100 text-slate-500" },
  sfc: { label: "SNES", cls: "bg-slate-100 text-slate-500" },
  oth: { label: "Other", cls: "bg-slate-100 text-slate-400" },
};

// Store link name → display config
const STORE_META: Record<string, { label: string; cls: string }> = {
  steam: { label: "Steam", cls: "bg-[#1b2838] text-white hover:bg-[#2a475e]" },
  gog: { label: "GOG", cls: "bg-[#86329e] text-white hover:bg-[#9b3db5]" },
  itchio: {
    label: "itch.io",
    cls: "bg-[#fa5c5c] text-white hover:bg-[#e04e4e]",
  },
  dlsite: {
    label: "DLsite",
    cls: "bg-[#e6003e] text-white hover:bg-[#c40035]",
  },
  dmm: { label: "DMM", cls: "bg-[#c0392b] text-white hover:bg-[#a93226]" },
  jast: { label: "JAST", cls: "bg-violet-600 text-white hover:bg-violet-700" },
  mg: { label: "MangaGamer", cls: "bg-pink-600 text-white hover:bg-pink-700" },
  nutaku: {
    label: "Nutaku",
    cls: "bg-orange-500 text-white hover:bg-orange-600",
  },
  denpasoft: {
    label: "Denpasoft",
    cls: "bg-purple-600 text-white hover:bg-purple-700",
  },
  fakku: { label: "FAKKU", cls: "bg-[#4a148c] text-white hover:bg-[#6a1fb0]" },
  playasia: {
    label: "Play-Asia",
    cls: "bg-sky-600 text-white hover:bg-sky-700",
  },
  amazon: {
    label: "Amazon",
    cls: "bg-[#ff9900] text-black hover:bg-[#e68900]",
  },
};

function storeButton(link: { url: string; label: string; name: string }) {
  const meta = STORE_META[link.name];
  return (
    <a
      key={link.url}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
        meta ? meta.cls : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      <ExternalLink size={9} strokeWidth={2.5} />
      {meta?.label ?? link.label}
    </a>
  );
}

// ─── Releases section ─────────────────────────────────────────────────────────

const ReleasesSection: React.FC<{ releases: Release[] }> = ({ releases }) => {
  const allLangs: string[] = Array.from(
    new Set(releases.flatMap((r) => r.languages.map((l) => l.lang))),
  );

  // Sort: ja first if present, then en, then rest alphabetically
  const sortedLangs = allLangs.sort((a, b) => {
    if (a === "ja") return -1;
    if (b === "ja") return 1;
    if (a === "en") return -1;
    if (b === "en") return 1;
    return a.localeCompare(b);
  });

  const [activeLang, setActiveLang] = useState<string>("all");
  const [showMTL, setShowMTL] = useState(false);
  const [typeFilter, setTypeFilter] = useState<
    "all" | "complete" | "partial" | "trial"
  >("all");

  const filtered = releases.filter((r) => {
    if (activeLang !== "all" && !r.languages.some((l) => l.lang === activeLang))
      return false;
    if (!showMTL && r.languages.every((l) => l.mtl)) return false; // hide if ALL langs are MTL
    if (typeFilter !== "all" && r.vns[0]?.rtype !== typeFilter) return false;
    return true;
  });

  const hasMTL = releases.some((r) => r.languages.some((l) => l.mtl));
  const types = (["complete", "partial", "trial"] as const).filter((t) =>
    releases.some((r) => r.vns[0]?.rtype === t),
  );
  const hasMultipleTypes = types.length > 1;

  // Group by rtype
  const byType: Record<string, Release[]> = {};
  for (const r of filtered) {
    const t = r.vns[0]?.rtype ?? "complete";
    if (!byType[t]) byType[t] = [];
    byType[t].push(r);
  }

  return (
    <div className="-mx-1">
      {/* ── Toolbar ── */}
      <div className="px-1 mb-3 flex flex-wrap gap-2 items-center">
        {/* Language tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
          <button
            onClick={() => setActiveLang("all")}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
              activeLang === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            All
            <span
              className={`text-[10px] ${activeLang === "all" ? "text-slate-400" : "text-slate-300"}`}
            >
              {releases.length}
            </span>
          </button>
          {sortedLangs.map((lang) => {
            const cnt = releases.filter((r) =>
              r.languages.some((l) => l.lang === lang),
            ).length;
            const meta = LANG_META[lang];
            const active = activeLang === lang;
            return (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                <span className="text-sm leading-none">
                  {meta?.flag ?? "🌐"}
                </span>
                <span className="hidden sm:inline">
                  {meta?.label ?? lang.toUpperCase()}
                </span>
                <span className="sm:hidden">{lang.toUpperCase()}</span>
                <span
                  className={`text-[9px] ${active ? "text-indigo-300" : "text-slate-300"}`}
                >
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          {/* Type segmented */}
          {hasMultipleTypes && (
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(["all", ...types] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t as any)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md capitalize transition-colors ${
                    typeFilter === t
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          )}

          {/* MTL toggle */}
          {hasMTL && (
            <button
              onClick={() => setShowMTL((m) => !m)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                showMTL
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
              }`}
            >
              MTL {showMTL ? "✓" : ""}
            </button>
          )}
        </div>
      </div>

      {/* ── Release groups ── */}
      {filtered.length === 0 ? (
        <div className="px-1 py-10 text-center text-sm text-slate-400">
          No releases match the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {(["complete", "partial", "trial"] as const).map((rtype) => {
            const group = byType[rtype];
            if (!group?.length) return null;
            return (
              <div key={rtype}>
                {/* Group header */}
                {hasMultipleTypes && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${RTYPE_META[rtype].cls}`}
                    >
                      {RTYPE_META[rtype].label}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400">
                      {group.length}
                    </span>
                  </div>
                )}

                {/* Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Desktop table header */}
                  <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-0 bg-slate-50 border-b border-slate-200">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Release
                    </div>
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                      Rating
                    </div>
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                      Voice
                    </div>
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Links
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.map((r) => (
                      <ReleaseRow key={r.id} release={r} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Single release row ───────────────────────────────────────────────────────

const ReleaseRow: React.FC<{ release: Release }> = ({ release: r }) => {
  const [expanded, setExpanded] = useState(false);

  const isMTL = r.languages.some((l) => l.mtl);
  const devs = r.producers.filter((p) => p.developer);
  const pubs = r.producers.filter((p) => p.publisher);
  const age = ageBadge(r.minage);
  const rtype = r.vns[0]?.rtype ?? "complete";

  // Separate buy links vs other links
  const storeNames = new Set(Object.keys(STORE_META));
  const buyLinks = r.extlinks.filter((l) => storeNames.has(l.name));
  const otherLinks = r.extlinks.filter((l) => !storeNames.has(l.name));

  const rtypeDot =
    rtype === "complete"
      ? "bg-indigo-400"
      : rtype === "partial"
        ? "bg-amber-400"
        : "bg-slate-300";

  return (
    <div className="group">
      {/* ── Main clickable row ── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`w-full text-left transition-colors ${expanded ? "bg-slate-50" : "bg-white hover:bg-slate-50/60"}`}
      >
        {/* Mobile layout: stacked */}
        <div className="md:hidden px-4 py-3 space-y-2">
          <div className="flex items-start gap-2">
            <div
              className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${rtypeDot}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {r.title}
              </p>
              {r.alttitle && r.alttitle !== r.title && (
                <p className="text-xs text-slate-400 mt-0.5">{r.alttitle}</p>
              )}
            </div>
            <div className="flex-shrink-0 text-slate-300">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </div>

          {/* Mobile meta: date, flags, platforms */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-3.5">
            {r.released && (
              <span className="text-[11px] text-slate-500 tabular-nums">
                {r.released}
              </span>
            )}
            {/* Languages */}
            <div className="flex items-center gap-0.5">
              {r.languages.map((l) => (
                <span
                  key={l.lang}
                  title={`${LANG_META[l.lang]?.label ?? l.lang}${l.mtl ? " (Machine Translation)" : ""}`}
                  className={`text-sm leading-none ${l.mtl ? "opacity-40" : ""}`}
                >
                  {LANG_META[l.lang]?.flag ?? l.lang.toUpperCase()}
                </span>
              ))}
              {isMTL && (
                <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1 py-0.5 rounded ml-1">
                  MTL
                </span>
              )}
            </div>
            {/* Platforms */}
            {r.platforms.slice(0, 4).map((p) => {
              const s = PLAT_STYLE[p];
              return (
                <span
                  key={p}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s?.cls ?? "bg-slate-100 text-slate-500"}`}
                >
                  {s?.label ?? p}
                </span>
              );
            })}
            {/* Flags */}
            {age && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${age.cls}`}
              >
                {age.label}
              </span>
            )}
            {r.freeware && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                Free
              </span>
            )}
            {r.patch && (
              <span className="text-[10px] font-bold bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded border border-sky-200">
                Patch
              </span>
            )}
            {r.has_ero && (
              <span className="text-[10px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-200">
                18+
              </span>
            )}
            {r.uncensored === true && (
              <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded border border-violet-200">
                Uncensored
              </span>
            )}
          </div>

          {/* Mobile buy links */}
          {buyLinks.length > 0 && (
            <div
              className="flex flex-wrap gap-1.5 pl-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              {buyLinks.map((l) => storeButton(l))}
            </div>
          )}
        </div>

        {/* Desktop layout: table grid */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-0">
          {/* Col 1: title + meta */}
          <div className="px-4 py-3 flex items-start gap-2 min-w-0">
            <div
              className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${rtypeDot}`}
            />
            <div className="min-w-0">
              {/* Title line */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {r.title}
                </span>
                {r.alttitle && r.alttitle !== r.title && (
                  <span className="text-xs text-slate-400">{r.alttitle}</span>
                )}
              </div>
              {/* Meta line */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                {/* Date */}
                {r.released && (
                  <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">
                    {r.released}
                  </span>
                )}
                {/* Lang flags */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {r.languages.map((l) => (
                    <span
                      key={l.lang}
                      title={`${LANG_META[l.lang]?.label ?? l.lang}${l.mtl ? " (Machine Translation)" : ""}`}
                      className={`text-sm leading-none ${l.mtl ? "opacity-35" : ""}`}
                    >
                      {LANG_META[l.lang]?.flag ?? l.lang.toUpperCase()}
                    </span>
                  ))}
                  {isMTL && (
                    <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1 rounded ml-0.5">
                      MTL
                    </span>
                  )}
                </div>
                {/* Platforms */}
                <div className="flex flex-wrap gap-1">
                  {r.platforms.map((p) => {
                    const s = PLAT_STYLE[p];
                    return (
                      <span
                        key={p}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s?.cls ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {s?.label ?? p}
                      </span>
                    );
                  })}
                </div>
                {/* Property badges */}
                {r.freeware && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">
                    Free
                  </span>
                )}
                {r.patch && (
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100 px-1.5 py-0.5 rounded">
                    Patch
                  </span>
                )}
                {r.has_ero && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded">
                    18+
                  </span>
                )}
                {r.uncensored === true && (
                  <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded">
                    Uncensored
                  </span>
                )}
                {!r.official && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    Unofficial
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: age rating */}
          <div className="px-3 py-3 flex-shrink-0 flex justify-center">
            {age ? (
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${age.cls}`}
              >
                {age.label}
              </span>
            ) : (
              <span className="text-[10px] text-slate-300">—</span>
            )}
          </div>

          {/* Col 3: voiced */}
          <div className="px-3 py-3 flex-shrink-0 flex justify-center">
            {r.voiced ? (
              <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                {VOICED[r.voiced]}
              </span>
            ) : (
              <span className="text-[10px] text-slate-300">—</span>
            )}
          </div>

          {/* Col 4: buy links + expand */}
          <div
            className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {buyLinks.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {buyLinks.map((l) => storeButton(l))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-300">—</span>
            )}
            <div
              className="text-slate-300 ml-1 pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((x) => !x);
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </div>
        </div>
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Developers */}
            {devs.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Developer
                </p>
                <div className="flex flex-wrap gap-1">
                  {devs.map((d) => (
                    <span
                      key={d.id}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-semibold"
                    >
                      {d.name}
                      {d.original && d.original !== d.name && (
                        <span className="ml-1 text-emerald-500 font-normal">
                          {d.original}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Publishers */}
            {pubs.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Publisher
                </p>
                <div className="flex flex-wrap gap-1">
                  {pubs.map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-semibold"
                    >
                      {p.name}
                      {p.original && p.original !== p.name && (
                        <span className="ml-1 text-amber-500 font-normal">
                          {p.original}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical */}
            {(r.engine || r.resolution || r.voiced) && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Technical
                </p>
                <div className="space-y-1 text-slate-600">
                  {r.engine && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold w-16">
                        Engine
                      </span>
                      <span>{r.engine}</span>
                    </div>
                  )}
                  {r.voiced && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold w-16">
                        Voice
                      </span>
                      <span>{VOICED[r.voiced]}</span>
                    </div>
                  )}
                  {r.resolution && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold w-16">
                        Resolution
                      </span>
                      <span>
                        {Array.isArray(r.resolution)
                          ? `${r.resolution[0]}×${r.resolution[1]}`
                          : "Non-standard"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Languages detail */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Languages
              </p>
              <div className="space-y-1">
                {r.languages.map((l) => (
                  <div key={l.lang} className="flex items-center gap-2">
                    <span className="text-base leading-none">
                      {LANG_META[l.lang]?.flag ?? "🌐"}
                    </span>
                    <div className="min-w-0">
                      <span className="text-slate-700 font-semibold">
                        {l.title ||
                          LANG_META[l.lang]?.label ||
                          l.lang.toUpperCase()}
                      </span>
                      {l.latin && l.latin !== l.title && (
                        <span className="text-slate-400 ml-1 font-normal">
                          ({l.latin})
                        </span>
                      )}
                      {l.mtl && (
                        <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-700 font-black px-1 rounded">
                          MTL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Properties */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Properties
              </p>
              <div className="flex flex-wrap gap-1">
                {r.official && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-semibold">
                    Official
                  </span>
                )}
                {!r.official && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-semibold">
                    Unofficial
                  </span>
                )}
                {r.freeware && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-semibold">
                    Freeware
                  </span>
                )}
                {r.patch && (
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-md font-semibold">
                    Patch
                  </span>
                )}
                {r.has_ero && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-md font-semibold">
                    Adult content
                  </span>
                )}
                {r.uncensored === true && (
                  <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md font-semibold">
                    Uncensored
                  </span>
                )}
                {r.uncensored === false && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                    Censored
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            {r.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Notes
                </p>
                <p className="text-slate-600 leading-relaxed italic">
                  {stripMarkup(r.notes)}
                </p>
              </div>
            )}

            {/* Other links (non-store) */}
            {otherLinks.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Links
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {otherLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <ExternalLink size={9} />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Character Card ────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  main: "bg-yellow-100 text-yellow-800",
  primary: "bg-blue-100 text-blue-800",
  side: "bg-slate-100 text-slate-700",
  appears: "bg-green-100 text-green-700",
};

const CharacterCard: React.FC<{ char: VNCharacter; showNSFW: boolean }> = ({
  char,
  showNSFW,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isNSFW =
    !showNSFW &&
    char.image &&
    (char.image.sexual > 1 || char.image.violence > 1);
  const roleColor = ROLE_COLORS[char.role] ?? ROLE_COLORS.side;
  const desc = char.description
    ? stripMarkup(char.description).slice(0, 280)
    : "";
  const visibleTraits = (char.traits ?? [])
    .filter((t) => t.spoiler === 0)
    .slice(0, 8);
  const sexLabel = char.sex
    ? ({ m: "Male", f: "Female", b: "Both", n: "Sexless" }[char.sex[0] ?? ""] ??
      null)
    : null;

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-slate-200">
          {char.image ? (
            <img
              src={char.image.url}
              alt={char.name}
              className={`w-full h-full object-cover object-top ${isNSFW ? "blur-md" : ""}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <User size={18} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 leading-tight truncate">
                {char.name}
              </p>
              {char.original && (
                <p className="text-xs text-slate-500 truncate">
                  {char.original}
                </p>
              )}
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${roleColor}`}
            >
              {char.role}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500">
            {sexLabel && <span>{sexLabel}</span>}
            {char.age != null && <span>{char.age}y</span>}
            {char.blood_type && <span>{char.blood_type.toUpperCase()}</span>}
            {char.height != null && <span>{char.height}cm</span>}
          </div>
        </div>
      </div>
      {(desc || visibleTraits.length > 0) && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
          >
            {expanded ? "Less" : "More"}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {desc && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {desc}
                  {char.description && char.description.length > 280 ? "…" : ""}
                </p>
              )}
              {visibleTraits.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {visibleTraits.map((t) => (
                    <span
                      key={t.id}
                      className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Tag Section ──────────────────────────────────────────────────────────────

const TagSection: React.FC<{
  tags: NonNullable<VN["tags"]>;
  onTagClick: (id: string, name: string) => void;
}> = ({ tags, onTagClick }) => {
  const [showAll, setShowAll] = useState(false);
  const filtered = tags
    .filter((t) => !t.lie && t.spoiler === 0 && t.rating >= 1.5)
    .sort((a, b) => b.rating - a.rating);
  const displayed = showAll ? filtered : filtered.slice(0, 20);
  const catColor: Record<string, string> = {
    cont: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    ero: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
    tech: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {displayed.map((t) => (
          <button
            key={t.id}
            onClick={() => onTagClick(t.id, t.name)}
            title={`Rating: ${t.rating.toFixed(1)}`}
            className={`text-xs px-2.5 py-0.5 rounded-full border font-medium transition-colors ${catColor[t.category] ?? catColor.tech}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      {filtered.length > 20 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 text-xs text-indigo-500 hover:underline flex items-center gap-1"
        >
          {showAll ? "Show fewer" : `Show all ${filtered.length} tags`}
          {showAll ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      )}
    </div>
  );
};

// ─── Library Panel ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<number, string> = {
  1: "Playing",
  2: "Finished",
  3: "Stalled",
  4: "Dropped",
  5: "Wishlist",
  6: "Blacklist",
};
const STATUS_COLORS: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-green-500",
  3: "bg-yellow-500",
  4: "bg-red-500",
  5: "bg-purple-500",
  6: "bg-slate-500",
};

const LibraryPanel: React.FC<{
  token: string | null;
  vn: VN;
  entry: UlistEntry | null;
  onEntryChange: (e: UlistEntry | null) => void;
}> = ({ token, vn, entry, onEntryChange }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<number>(0);
  const [pendingScore, setPendingScore] = useState<number>(0);

  useEffect(() => {
    setPendingLabel(entry?.labels?.[0]?.id ?? 0);
    setPendingScore(entry?.vote ? Math.round(entry.vote / 10) : 0);
  }, [entry]);

  const currentLabel = entry?.labels?.[0]?.id ?? 0;
  const currentScore = entry?.vote ? Math.round(entry.vote / 10) : 0;

  const handleSave = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const labels = pendingLabel > 0 ? [pendingLabel] : [];
      const vote = pendingScore > 0 ? pendingScore * 10 : null;
      await updateUlist(token, vn.id, labels, vote);
      onEntryChange({
        id: entry?.id ?? "temp",
        vn,
        labels:
          pendingLabel > 0
            ? [{ id: pendingLabel, label: STATUS_LABELS[pendingLabel] }]
            : [],
        vote,
        added: entry?.added,
      });
      setOpen(false);
    } catch (e: any) {
      alert("Failed to update library: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await removeFromUlist(token, vn.id);
      onEntryChange(null);
      setPendingLabel(0);
      setPendingScore(0);
      setOpen(false);
    } catch (e: any) {
      alert("Failed to remove: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <p className="text-sm text-slate-500 mb-3 text-center">
          Connect your VNDB account to track this VN.
        </p>
        <button
          onClick={() => navigate("/profile")}
          className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Go to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          {currentLabel > 0 ? (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[currentLabel]}`}
              />
              <span className="text-sm font-semibold text-slate-800">
                {STATUS_LABELS[currentLabel]}
              </span>
              {currentScore > 0 && (
                <span className="ml-auto flex items-center gap-1 text-yellow-600 font-bold text-sm">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {currentScore}/10
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400">Not in library</span>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 ${
            currentLabel > 0
              ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          <Bookmark size={14} />
          {currentLabel > 0 ? "Edit" : "Add"}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Status
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(STATUS_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() =>
                    setPendingLabel(pendingLabel === +id ? 0 : +id)
                  }
                  className={`text-xs py-1.5 px-2 rounded-lg font-medium border transition-all ${
                    pendingLabel === +id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Score{pendingScore > 0 ? ` — ${pendingScore}/10` : ""}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setPendingScore(pendingScore === n ? 0 : n)}
                  className={`flex-1 py-1.5 text-xs rounded font-bold transition-all ${
                    n <= pendingScore
                      ? "bg-yellow-400 text-white"
                      : "bg-white text-slate-400 border border-slate-200 hover:border-yellow-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle size={13} />
              )}
              Save
            </button>
            {currentLabel > 0 && (
              <button
                onClick={handleRemove}
                disabled={busy}
                className="px-3 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const VNDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vn, setVn] = useState<VN | null>(null);
  const [publishers, setPublishers] = useState<
    { id: string; name: string; original: string | null }[]
  >([]);
  const [characters, setCharacters] = useState<VNCharacter[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [entry, setEntry] = useState<UlistEntry | null>(null);
  const [sexualFilter, setSexualFilter] = useState(0);
  const [violenceFilter, setViolenceFilter] = useState(0);

  const { token, user } = useAuthStore();
  const { showNSFW } = useSettingsStore();

  useEffect(() => {
    setSexualFilter(showNSFW ? 2 : 0);
    setViolenceFilter(showNSFW ? 2 : 0);
  }, [showNSFW]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setVn(null);
    setCharacters([]);
    setPublishers([]);
    setReleases([]);
    setEntry(null);

    (async () => {
      try {
        // Fetch core VN data first so the page can render quickly
        const vnData = await getVN(id);
        if (!vnData) {
          setError("Visual Novel not found.");
          setLoading(false);
          return;
        }
        setVn(vnData);
        setLoading(false);

        // Fire all secondary data loads in parallel without blocking render
        getVNCharacters(id)
          .then(setCharacters)
          .catch((e) => console.warn("getVNCharacters failed", e));

        getVNPublishers(id)
          .then(setPublishers)
          .catch((e) => console.warn("getVNPublishers failed", e));

        getVNReleases(id)
          .then(setReleases)
          .catch((e) => console.warn("getVNReleases failed", e));

        // Fetch library entry separately so "in library" status appears as soon as possible
        if (token && user) {
          (async () => {
            try {
              const res = await fetch("/api/kana/ulist", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                  user: user.id,
                  filters: ["id", "=", id],
                  fields: "id, vn.id, labels.id, labels.label, vote, added",
                }),
              });
              const ul = await res.json();
              setEntry(ul.results?.length > 0 ? ul.results[0] : null);
            } catch (e) {
              console.warn("ulist fetch failed", e);
            }
          })();
        }
      } catch (e: any) {
        setError("Failed to load details: " + e.message);
        setLoading(false);
      }
    })();
  }, [id, token, user]);

  const isNSFW =
    !showNSFW && vn?.image && (vn.image.sexual > 1 || vn.image.violence > 1);
  const imageUrl = vn?.image?.url ?? "";
  const filteredShots = (vn?.screenshots ?? []).filter(
    (s) => s.sexual <= sexualFilter && s.violence <= violenceFilter,
  );

  const allImages = React.useMemo(() => {
    const images: string[] = [];
    if (imageUrl) images.push(imageUrl);
    filteredShots.forEach((s) => images.push(s.url));
    return images;
  }, [imageUrl, filteredShots]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
      </div>
    );
  if (error || !vn)
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 inline-block">
          {error ?? "Not found."}
        </p>
        <br />
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-8"
    >
      <ImageModal
        images={allImages}
        currentImage={selectedImage}
        onClose={() => setSelectedImage(null)}
        onSelectImage={setSelectedImage}
      />

      {/* Hero */}
      <div className="relative h-52 md:h-72 overflow-hidden bg-slate-900">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={vn.title}
            className={`w-full h-full object-cover opacity-30 ${isNSFW ? "blur-2xl" : ""}`}
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-slate-900/60 hover:bg-slate-900/80 md:bg-white/80 md:hover:bg-white text-white md:text-slate-900 backdrop-blur rounded-full transition-colors border border-white/30 md:border-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex items-end gap-4">
          {imageUrl && (
            <div
              className="hidden sm:block w-24 md:w-36 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/10 shadow-xl cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedImage(imageUrl)}
            >
              <img
                src={imageUrl}
                alt={vn.title}
                className={`w-full h-auto ${isNSFW ? "blur-xl" : ""}`}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="flex-1 text-white min-w-0">
            <h1 className="text-lg md:text-2xl font-bold leading-tight mb-0.5">
              {vn.title}
            </h1>
            {vn.alttitle && (
              <p className="text-slate-300 text-xs mb-2 opacity-70">
                {vn.alttitle}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {vn.rating && (
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  {(vn.rating / 10).toFixed(1)}
                  {vn.votecount ? (
                    <span className="opacity-60">
                      ({vn.votecount.toLocaleString()})
                    </span>
                  ) : null}
                </div>
              )}
              {vn.length_minutes ? (
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  {formatDuration(vn.length_minutes)}
                </div>
              ) : null}
              {vn.released ? (
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                  <Calendar size={12} />
                  {vn.released}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Synopsis" icon={BookOpen}>
            {vn.description ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {stripMarkup(vn.description)}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                No description available.
              </p>
            )}
          </Section>

          <Section title="Details" icon={Info}>
            <div className="grid grid-cols-2 gap-4">
              {vn.languages && vn.languages.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Globe size={10} /> Languages
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {vn.languages.map((l, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/search?language=${l}`)}
                        className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded font-medium uppercase hover:bg-indigo-100 transition-colors"
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {vn.platforms && vn.platforms.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Monitor size={10} /> Platforms
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {vn.platforms.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/search?platform=${p}`)}
                        className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded font-medium uppercase hover:bg-slate-700 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {vn.developers && vn.developers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Users size={10} /> Developer
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {vn.developers.map((d, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          navigate(
                            `/search?devId=${d.id}&devName=${encodeURIComponent(d.name)}`,
                          )
                        }
                        className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded font-medium hover:bg-emerald-100 transition-colors"
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {publishers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <BookOpen size={10} /> Publisher
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {publishers.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded font-medium"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {vn.aliases && vn.aliases.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Type size={10} /> Aliases
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {vn.aliases.map((a, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* RELEASES */}
          {releases.length > 0 && (
            <Section
              title={`Releases (${releases.length})`}
              icon={Package}
              defaultOpen={false}
            >
              <ReleasesSection releases={releases} />
            </Section>
          )}

          {vn.tags && vn.tags.length > 0 && (
            <Section
              title={`Tags (${vn.tags.filter((t) => !t.lie && t.spoiler === 0 && t.rating >= 1.5).length})`}
              icon={Tag}
              defaultOpen={false}
            >
              <TagSection
                tags={vn.tags}
                onTagClick={(tagId, tagName) =>
                  navigate(
                    `/search?tagId=${tagId}&tagName=${encodeURIComponent(tagName)}`,
                  )
                }
              />
            </Section>
          )}

          {characters.length > 0 && (
            <Section
              title={`Characters (${characters.length})`}
              icon={Users}
              defaultOpen={false}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {characters.map((c) => (
                  <CharacterCard key={c.id} char={c} showNSFW={showNSFW} />
                ))}
              </div>
            </Section>
          )}

          {vn.staff && vn.staff.length > 0 && (
            <Section
              title={`Staff (${vn.staff.length})`}
              icon={Users}
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vn.staff.map((s, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <p className="text-sm font-medium text-slate-800 leading-tight">
                      {s.name}
                    </p>
                    <p className="text-xs text-indigo-500 mt-0.5">{s.role}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {vn.relations &&
            vn.relations.length > 0 &&
            (() => {
              const RELATION_META: Record<
                string,
                { label: string; cls: string }
              > = {
                seq: { label: "Sequel", cls: "bg-indigo-100 text-indigo-700" },
                preq: {
                  label: "Prequel",
                  cls: "bg-violet-100 text-violet-700",
                },
                set: { label: "Same Setting", cls: "bg-sky-100 text-sky-700" },
                alt: { label: "Alternative", cls: "bg-teal-100 text-teal-700" },
                char: {
                  label: "Shares Characters",
                  cls: "bg-emerald-100 text-emerald-700",
                },
                side: {
                  label: "Side Story",
                  cls: "bg-amber-100 text-amber-700",
                },
                par: {
                  label: "Parent Story",
                  cls: "bg-orange-100 text-orange-700",
                },
                ser: { label: "Same Series", cls: "bg-rose-100 text-rose-700" },
                fan: { label: "Fandisc", cls: "bg-pink-100 text-pink-700" },
                orig: {
                  label: "Original Game",
                  cls: "bg-slate-100 text-slate-600",
                },
              };
              // Preferred display order
              const ORDER = [
                "preq",
                "seq",
                "ser",
                "par",
                "side",
                "fan",
                "set",
                "char",
                "alt",
                "orig",
              ];
              const grouped = vn.relations.reduce<
                Record<string, typeof vn.relations>
              >((acc, r) => {
                (acc[r.relation] = acc[r.relation] ?? []).push(r);
                return acc;
              }, {});
              const sortedKeys = [
                ...ORDER.filter((k) => grouped[k]),
                ...Object.keys(grouped).filter((k) => !ORDER.includes(k)),
              ];
              return (
                <Section
                  title={`Relations (${vn.relations.length})`}
                  icon={LinkIcon}
                  defaultOpen={false}
                >
                  <div className="space-y-4">
                    {sortedKeys.map((key) => {
                      const meta = RELATION_META[key] ?? {
                        label: key,
                        cls: "bg-slate-100 text-slate-600",
                      };
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${meta.cls}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {grouped[key].length}
                            </span>
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {grouped[key].map((r, i) => (
                              <Link
                                key={i}
                                to={`/vn/${r.id}`}
                                className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all group"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-slate-900 font-medium group-hover:text-indigo-700 line-clamp-2 leading-snug">
                                    {r.title}
                                  </p>
                                  {!r.relation_official && (
                                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
                                      unofficial
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              );
            })()}

          {vn.screenshots && vn.screenshots.length > 0 && (
            <Section
              title={`Screenshots (${vn.screenshots.length})`}
              icon={ImageIcon}
              defaultOpen={false}
            >
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  {["Safe", "Suggestive", "Explicit"].map((l, i) => (
                    <button
                      key={i}
                      onClick={() => setSexualFilter(i)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${sexualFilter === i ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  {["Tame", "Violent", "Brutal"].map((l, i) => (
                    <button
                      key={i}
                      onClick={() => setViolenceFilter(i)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${violenceFilter === i ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {filteredShots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredShots.map((s, i) => {
                    const blur = !showNSFW && (s.sexual > 1 || s.violence > 1);
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(s.url)}
                        className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 cursor-pointer group border border-slate-200"
                      >
                        <img
                          src={s.url}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${blur ? "blur-xl" : ""}`}
                        />
                        {blur && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                              NSFW
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No screenshots match current filters.
                </p>
              )}
            </Section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-4 space-y-4">
            <LibraryPanel
              token={token}
              vn={vn}
              entry={entry}
              onEntryChange={setEntry}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
