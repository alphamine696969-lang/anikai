'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import { Search, Shield, ShieldOff, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    if (!user) return router.push('/login');
    if (!isAdmin) return router.push('/');
    load();
  }, [user, isAdmin, page, q]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.listUsers({ page, limit: 25, q });
      setUsers(data.data  || []);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  const toggle = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      setUsers((u) => u.map((x) => x.id === id ? { ...x, is_active: data.data.is_active } : x));
    } catch {}
  };

  const setRole = async (id, role) => {
    try {
      await adminAPI.setRole(id, role);
      setUsers((u) => u.map((x) => x.id === id ? { ...x, role } : x));
    } catch {}
  };

  if (!isAdmin) return null;

  return (
    <div className="pt-24 pb-16 min-h-screen fade-in">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">Manage Users</h1>
            <p className="text-white/50 text-sm">{total} registered users</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by username or email…" className="input pl-11" />
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/50 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-4">User</th>
                <th className="text-left px-6 py-4">Role</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Joined</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="skeleton h-4 w-full rounded" /></td></tr>
                ))
                : users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.username}</p>
                          <p className="text-xs text-white/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select value={u.role}
                        onChange={(e) => setRole(u.id, e.target.value)}
                        className="bg-transparent text-sm border border-white/10 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toggle(u.id)}
                        className={`btn py-1.5 px-3 text-xs ${u.is_active ? 'btn-ghost text-red-400 border-red-500/20 hover:bg-red-500/10' : 'btn-ghost text-green-400 border-green-500/20 hover:bg-green-500/10'}`}>
                        {u.is_active ? <><UserX className="w-3.5 h-3.5" /> Suspend</> : <><UserCheck className="w-3.5 h-3.5" /> Restore</>}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 text-sm text-white/50">
          <p>Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-ghost py-2 px-3 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total} className="btn btn-ghost py-2 px-3 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
