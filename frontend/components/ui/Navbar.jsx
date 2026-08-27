'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { animeAPI } from '@/lib/api';
import { Search, X, Menu, Bell, User, LogOut, Shield, Bookmark, History } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [query,        setQuery]   = useState('');
  const [results,      setResults] = useState([]);
  const [searching,    setSearching] = useState(false);
  const [menuOpen,     setMenuOpen]  = useState(false);
  const [userMenu,     setUserMenu]  = useState(false);
  const [scrolled,     setScrolled]  = useState(false);
  const searchRef = useRef(null);
  const debounce  = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await animeAPI.list({ q: query, limit: 6 });
        setResults(data.data || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { href: '/',          label: 'Home'    },
    { href: '/anime',     label: 'Browse'  },
    { href: '/anime?sort=rating&order=desc', label: 'Top Rated' },
    { href: '/anime?status=upcoming',        label: 'Upcoming'  },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass border-b border-white/[0.06] py-3' : 'py-5'
    }`}>
      <div className="container flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-sm">A</div>
          <span className="font-black text-xl tracking-tight gradient-text">AniKai</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 ml-2">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-all">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="input pl-9 pr-9 py-2.5 text-sm"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {(results.length > 0 || searching) && (
            <div className="absolute top-full mt-2 left-0 right-0 glass rounded-xl overflow-hidden z-50 shadow-2xl">
              {searching && <div className="p-4 text-sm text-white/50 text-center">Searching…</div>}
              {results.map((a) => (
                <Link key={a.id} href={`/anime/${a.slug}`}
                  onClick={() => { setQuery(''); setResults([]); }}
                  className="flex items-center gap-3 p-3 hover:bg-white/[0.06] transition-colors">
                  <img src={a.cover_url || '/placeholder-cover.jpg'} alt={a.title}
                    className="w-10 h-14 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-xs text-white/50">{a.type} · {a.status}</p>
                  </div>
                  <div className="ml-auto badge badge-yellow shrink-0">⭐ {a.rating?.toFixed(1) || '—'}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* User actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/[0.08] transition-all">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.username}</span>
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl overflow-hidden z-50 shadow-2xl border border-white/[0.08]">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold">{user.username}</p>
                    <p className="text-xs text-white/50 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard" onClick={() => setUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors">
                      <History className="w-4 h-4 text-white/50" /> Dashboard
                    </Link>
                    <Link href="/dashboard?tab=favorites" onClick={() => setUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors">
                      <Bookmark className="w-4 h-4 text-white/50" /> Favorites
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors text-purple-400">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-white/[0.06] py-1">
                    <button onClick={() => { logout(); setUserMenu(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition-colors w-full">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"    className="btn btn-ghost text-sm py-2 px-4">Login</Link>
              <Link href="/register" className="btn btn-primary text-sm py-2 px-4">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
