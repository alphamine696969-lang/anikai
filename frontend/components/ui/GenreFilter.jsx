'use client';
import { useState, useEffect } from 'react';
import { genreAPI } from '@/lib/api';
import { Filter, ChevronDown, X } from 'lucide-react';

const TYPES    = ['TV', 'Movie', 'OVA', 'ONA', 'Special'];
const STATUSES = ['ongoing', 'completed', 'upcoming', 'hiatus'];
const YEARS    = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
const SORTS    = [
  { value: 'views',   label: 'Most Watched' },
  { value: 'rating',  label: 'Top Rated'    },
  { value: 'created_at', label: 'Newest'    },
];

export default function GenreFilter({ filters, onChange }) {
  const [genres,  setGenres]  = useState([]);
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    genreAPI.list().then(({ data }) => setGenres(data.data || [])).catch(() => {});
  }, []);

  const set = (key, value) => onChange({ ...filters, [key]: value === filters[key] ? '' : value, page: 1 });
  const clear = () => onChange({ page: 1, sort: 'views', order: 'desc' });
  const hasFilters = filters.genre || filters.status || filters.type || filters.year;

  return (
    <div className="space-y-4">
      {/* Filter toggle (mobile) */}
      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 btn btn-ghost md:hidden">
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {hasFilters && (
          <button onClick={clear} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Filters panel */}
      <div className={`${open ? 'flex' : 'hidden md:flex'} flex-wrap gap-4`}>
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-wider">Sort</span>
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <button key={s.value}
                onClick={() => onChange({ ...filters, sort: s.value, page: 1 })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.sort === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-wider">Status</span>
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button key={s}
                onClick={() => set('status', s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filters.status === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 uppercase tracking-wider">Type</span>
          <div className="flex gap-1">
            {TYPES.map((t) => (
              <button key={t}
                onClick={() => set('type', t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.type === t
                    ? 'bg-pink-600 text-white'
                    : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/50 uppercase tracking-wider">Genre</span>
          <div className="flex flex-wrap gap-1">
            {genres.map((g) => (
              <button key={g.id}
                onClick={() => set('genre', g.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filters.genre === g.slug
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]'
                }`}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
