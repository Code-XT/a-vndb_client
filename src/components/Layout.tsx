import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Search, Library, User, Package, Monitor, Sun, Moon } from 'lucide-react';
import { useSettingsStore, Theme } from '../store/settingsStore';

function useApplyTheme() {
  const theme = useSettingsStore(s => s.theme);
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark')  { html.classList.add('dark'); return; }
    if (theme === 'light') { html.classList.remove('dark'); return; }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    html.classList.toggle('dark', mq.matches);
    const handler = (e: MediaQueryListEvent) => html.classList.toggle('dark', e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
}

const THEMES: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'device', icon: Monitor, label: 'Device' },
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
];

const ThemePicker = () => {
  const { theme, setTheme } = useSettingsStore();
  return (
    <div className="flex bg-slate-100 p-0.5 rounded-xl">
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button key={value} onClick={() => setTheme(value)} title={label}
          className={`flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}>
          <Icon size={13} /><span>{label}</span>
        </button>
      ))}
    </div>
  );
};

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
  <NavLink to={to} end={to === '/'}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
        isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    <Icon size={18} /><span>{label}</span>
  </NavLink>
);

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
  <NavLink to={to} end={to === '/'}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
        isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
      }`
    }
  >
    <Icon size={21} /><span className="text-[10px] font-semibold">{label}</span>
  </NavLink>
);

export const Layout = () => {
  useApplyTheme();
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <h1 className="text-lg font-black text-indigo-600 tracking-tight">VNDB</h1>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Visual Novel Browser</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1">
          <SidebarItem to="/"         icon={Home}    label="Discover" />
          <SidebarItem to="/search"   icon={Search}  label="VN Search" />
          <SidebarItem to="/releases" icon={Package} label="Releases" />
          <SidebarItem to="/library"  icon={Library} label="Library" />
          <SidebarItem to="/profile"  icon={User}    label="Profile" />
        </nav>
        <div className="px-3 py-4 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Theme</p>
          <ThemePicker />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto w-full min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex flex-col z-50">
        <div className="flex items-stretch h-14">
          <NavItem to="/"         icon={Home}    label="Discover" />
          <NavItem to="/search"   icon={Search}  label="Search" />
          <NavItem to="/releases" icon={Package} label="Releases" />
          <NavItem to="/library"  icon={Library} label="Library" />
          <NavItem to="/profile"  icon={User}    label="Profile" />
        </div>
      </nav>
    </div>
  );
};