'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { historyAPI } from '@/lib/api';
import AnimeCard from '@/components/ui/AnimeCard';
import { Clock, Bookmark, User, Settings, Trash2, Play } from 'lucide-react';

const TABS = [
  { id: 'history',   label: 'History',   icon: Clock     },
  { id: 'favorites', label: 'Favorites', icon: Bookmark  },
  { id: 'profile',   label: 'Profile',   icon: User      },
];

export default function DashboardPage() {
  const router     = useRouter();
  const { user, logout } = useAuth();
  const [tab,      setTab]      = useState('history');
  const [history,  setHistory]  = useState([]);
  const [favorites, setFavs]   = useState([]);
  const [continueW, setContinueW] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [hist, favs, cont] = await Promise.all([
          historyAPI.getHistory(),
          historyAPI.getFavorites(),
          historyAPI.getContinue(),
        ]);
        setHistory(hist.data.data   || []);
        setFavs(favs.data.data      || []);
        setContinueW(cont.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const deleteEntry = async (id) => {
    try {
      await historyAPI.deleteEntry(id);
      setHistory((h) => h.filter((e) => e.id !== id));
    } catch {}
  };

  const removeFav = async (animeId) => {
    try {
      await historyAPI.removeFavorite(animeId);
      setFavs((f) => f.filter((e) => e.anime?.id !== animeId));
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-16 min-h-screen fade-in">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user.username}</h1>
            <p className="text-white/50 text-sm">{user.email}</p>
          </div>
          <button onClick={logout} className="ml-auto btn btn-ghost text-sm text-red-400 border-red-500/20 hover:bg-red-500/10">
            Sign Out
          </button>
        </div>

        {/* Continue watching */}
        {continueW.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-400" /> Continue Watching
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {continueW.map((item) => item.anime && (
                <div key={item.id} className="relative">
                  <AnimeCard anime={item.anime} showProgress progress={(item.progress / (item.episode?.duration || 1)) * 100} />
                  <Link href={`/watch/${item.episode?.id}`}
                    className="absolute inset-0 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 glass rounded-xl p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="skeleton aspect-[2/3]" />
                <div className="p-3 space-y-2 bg-[#111118]">
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'history' ? (
          history.length === 0 ? (
            <p className="text-white/40 text-center py-20">No watch history yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <img src={item.anime?.cover_url || 'https://placehold.co/60x90/111/444'} alt=""
                    className="w-12 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.anime?.title}</p>
                    <p className="text-xs text-white/50">Episode {item.episode?.episode_number} · {item.episode?.title || ''}</p>
                    <div className="mt-2 w-40 bg-white/10 rounded-full h-1">
                      <div className="progress-bar h-full" style={{ width: `${Math.min((item.progress / (item.episode?.duration || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/watch/${item.episode?.id}`} className="btn btn-primary py-2 px-3 text-xs">
                      <Play className="w-3.5 h-3.5" /> Resume
                    </Link>
                    <button onClick={() => deleteEntry(item.id)} className="btn btn-ghost py-2 px-3 text-xs text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'favorites' ? (
          favorites.length === 0 ? (
            <p className="text-white/40 text-center py-20">No favorites yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.map((item) => item.anime && (
                <div key={item.anime.id} className="relative group">
                  <AnimeCard anime={item.anime} />
                  <button onClick={() => removeFav(item.anime.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="max-w-lg glass rounded-2xl p-6 space-y-5">
            <h2 className="font-bold">Account Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/50 mb-1">Username</p>
                <p className="font-semibold">{user.username}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Email</p>
                <p className="font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Role</p>
                <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
