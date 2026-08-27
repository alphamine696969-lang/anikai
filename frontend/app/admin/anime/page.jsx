'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { animeAPI, episodeAPI, genreAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, Upload, X, Loader2, ChevronDown, Film } from 'lucide-react';

const EMPTY_ANIME = {
  title: '', title_japanese: '', synopsis: '', status: 'ongoing', type: 'TV',
  year: new Date().getFullYear(), season: '', duration: '', cover_url: '',
  banner_url: '', trailer_url: '', is_featured: false, is_trending: false,
  genres: [],
};

function AnimeModal({ anime: initial, genres, onSave, onClose }) {
  const [form,    setForm]    = useState(initial || EMPTY_ANIME);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (initial?.id) await animeAPI.update(initial.id, form);
      else             await animeAPI.create(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally { setLoading(false); }
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/[0.1]">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold">{initial?.id ? 'Edit Anime' : 'Add New Anime'}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Title *</label>
              <input {...f('title')} required className="input" placeholder="Anime title" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Japanese Title</label>
              <input {...f('title_japanese')} className="input" placeholder="アニメタイトル" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Type</label>
              <select {...f('type')} className="input">
                {['TV','Movie','OVA','ONA','Special'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Status</label>
              <select {...f('status')} className="input">
                {['ongoing','completed','upcoming','hiatus'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Year</label>
              <input type="number" {...f('year')} className="input" min="1960" max="2030" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Duration (min/ep)</label>
              <input type="number" {...f('duration')} className="input" placeholder="24" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Season</label>
              <select {...f('season')} className="input">
                <option value="">—</option>
                {['Winter','Spring','Summer','Fall'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Synopsis</label>
              <textarea {...f('synopsis')} rows={4} className="input resize-none" placeholder="Story synopsis..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Cover URL</label>
              <input {...f('cover_url')} className="input" placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Banner URL</label>
              <input {...f('banner_url')} className="input" placeholder="https://..." />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-white/50 uppercase tracking-wider">Trailer URL</label>
              <input {...f('trailer_url')} className="input" placeholder="https://youtube.com/..." />
            </div>
            {/* Genres */}
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Genres</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <button type="button" key={g.id}
                    onClick={() => {
                      const has = form.genres.includes(g.id);
                      setForm({ ...form, genres: has ? form.genres.filter((id) => id !== g.id) : [...form.genres, g.id] });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.genres.includes(g.id) ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]'
                    }`}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Flags */}
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="accent-blue-500 w-4 h-4" />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm({ ...form, is_trending: e.target.checked })}
                  className="accent-purple-500 w-4 h-4" />
                Trending
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Anime'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost px-6">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAnimePage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [anime,   setAnime]   = useState([]);
  const [genres,  setGenres]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'new' | {anime object}
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    if (!user) return router.push('/login');
    if (!isAdmin) return router.push('/');
    genreAPI.list().then(({ data }) => setGenres(data.data || [])).catch(() => {});
    load(page);
  }, [user, isAdmin, page]);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await animeAPI.list({ page: p, limit: 20, sort: 'created_at', order: 'desc' });
      setAnime(data.data  || []);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  const deleteAnime = async (id) => {
    if (!confirm('Delete this anime and all its episodes?')) return;
    try {
      await animeAPI.remove(id);
      setAnime((a) => a.filter((x) => x.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
  };

  if (!isAdmin) return null;

  return (
    <div className="pt-24 pb-16 min-h-screen fade-in">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">Manage Anime</h1>
            <p className="text-white/50 text-sm">{total} total series</p>
          </div>
          <button onClick={() => setModal('new')} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Anime
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/50 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Anime</th>
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-right px-6 py-4">Episodes</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {anime.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={a.cover_url || 'https://placehold.co/40x56/111/444'} alt=""
                          className="w-10 h-14 rounded-lg object-cover shrink-0" />
                        <div>
                          <p className="text-sm font-semibold truncate max-w-64">{a.title}</p>
                          <p className="text-xs text-white/40">{a.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="badge badge-purple">{a.type}</span></td>
                    <td className="px-6 py-4">
                      <span className={`badge ${a.status === 'ongoing' ? 'badge-green' : a.status === 'completed' ? 'badge-blue' : 'badge-yellow'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-white/70">{a.total_episodes}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModal(a)} className="btn btn-ghost py-1.5 px-3 text-xs">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => deleteAnime(a.id)} className="btn btn-ghost py-1.5 px-3 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <AnimeModal
          anime={modal === 'new' ? null : modal}
          genres={genres}
          onSave={() => { setModal(null); load(page); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
