import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { fetchAuthInfo } from '../services/vndbService';
import { motion } from 'motion/react';
import { Key, User, LogOut, Loader2, ShieldCheck, Eye, EyeOff, ExternalLink } from 'lucide-react';

export const Profile = () => {
  const { token, user, setAuth, logout } = useAuthStore();
  const { showNSFW, toggleNSFW, theme, setTheme } = useSettingsStore();
  const [inputToken, setInputToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const authInfo = await fetchAuthInfo(inputToken);
      setAuth(inputToken, authInfo);
      setInputToken('');
    } catch (err) {
      setError('Invalid token or failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const SettingsSection = () => (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Preferences</h2>

      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <h3 className="font-medium text-slate-900">Show NSFW Content</h3>
          <p className="text-sm text-slate-500">Disable blurring on explicit images and screenshots.</p>
        </div>
        <button
          onClick={toggleNSFW}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            showNSFW ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showNSFW ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between py-4">
        <div>
          <h3 className="font-medium text-slate-900">Theme</h3>
          <p className="text-sm text-slate-500">Use device setting or force light / dark.</p>
        </div>
        <div className="inline-flex bg-slate-100 p-0.5 rounded-xl">
          {[
            { value: 'device' as const, label: 'Device' },
            { value: 'light'  as const, label: 'Light' },
            { value: 'dark'   as const, label: 'Dark' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                theme === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (user && token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-8 max-w-2xl mx-auto"
      >
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
          <p className="text-slate-500 mt-2">Manage your VNDB account connection.</p>
        </header>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.username}</h2>
              <p className="text-slate-500 font-mono text-sm">{user.id}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((perm) => (
                <span key={perm} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={14} className="mr-1" />
                  {perm}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={20} className="mr-2" />
            Disconnect Account
          </button>
        </div>

        <SettingsSection />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-xl mx-auto"
    >
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Connect VNDB</h1>
        <p className="text-slate-500 mt-2">Enter your Personal Access Token to sync your library.</p>
      </header>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-2">
              Personal Access Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Enter your token..."
                className="block w-full pl-11 pr-11 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm bg-slate-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              You can generate a token in your VNDB account settings under “Applications”.
            </p>
            <div className="mt-2">
              <a
                href="https://vndb.org/u/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <span>Get VNDB Personal Access Token</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !inputToken.trim()}
            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Connect Account'
            )}
          </button>
        </form>
      </div>

      <SettingsSection />
    </motion.div>
  );
};
