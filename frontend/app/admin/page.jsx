'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import { LayoutDashboard, Film, Users, ScrollText, TrendingUp, Eye, Star, Tv2 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/[0.06]">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-black mb-1">{value?.toLocaleString() ?? '—'}</p>
      <p className="text-white/50 text-sm">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [stats,  setStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/'); return; }
    adminAPI.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="pt-24 pb-16 min-h-screen fade-in">
      <div className="container">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black gradient-text">Admin Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">Manage your AniKai platform</p>
          </div>
          <div className="badge badge-purple text-sm px-4 py-2">Admin</div>
        </div>

        {/* Nav */}
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            { href: '/admin/anime', icon: Film,  label: 'Manage Anime' },
            { href: '/admin/users', icon: Users, label: 'Manage Users' },
            { href: '/admin/logs',  icon: ScrollText, label: 'Audit Logs' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="btn btn-ghost">
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Film}       label="Total Anime"    value={stats?.totalAnime}    color="bg-blue-600/20"   />
            <StatCard icon={Tv2}        label="Total Episodes" value={stats?.totalEpisodes} color="bg-purple-600/20" />
            <StatCard icon={Users}      label="Total Users"    value={stats?.totalUsers}    color="bg-pink-600/20"   />
            <StatCard icon={TrendingUp} label="Library Score"  value="A+"                   color="bg-green-600/20"  />
          </div>
        )}

        {/* Top anime */}
        {stats?.topAnime?.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Top Performing Anime</h2>
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/50 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-4">#</th>
                    <th className="text-left px-6 py-4">Anime</th>
                    <th className="text-right px-6 py-4"><Eye className="inline w-3.5 h-3.5 mr-1" />Views</th>
                    <th className="text-right px-6 py-4"><Star className="inline w-3.5 h-3.5 mr-1" />Rating</th>
                    <th className="text-right px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {stats.topAnime.map((a, i) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white/40 text-sm font-mono">#{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={a.cover_url || 'https://placehold.co/40x56/111/444'} alt=""
                            className="w-10 h-14 rounded-lg object-cover" />
                          <p className="text-sm font-semibold truncate max-w-48">{a.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-white/70">{a.views?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-yellow-400 text-sm font-semibold">{a.rating?.toFixed(1) || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/anime?edit=${a.id}`} className="btn btn-ghost py-1.5 px-3 text-xs">Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
