'use client';
import { useState, useEffect, useCallback } from 'react';
import AnimeCard    from '@/components/ui/AnimeCard';
import GenreFilter  from '@/components/ui/GenreFilter';
import { animeAPI } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';



export default function AnimeListing() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [anime,   setAnime]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q:      searchParams.get('q')      || '',
    genre:  searchParams.get('genre')  || '',
    status: searchParams.get('status') || '',
    type:   searchParams.get('type')   || '',
    sort:   searchParams.get('sort')   || 'views',
    order:  searchParams.get('order')  || 'desc',
    page:   Number(searchParams.get('page') || 1),
    limit:  24,
  });

  const load = useCallback(async (f) => {
    setLoading(true);
    try {
      const { data } = await animeAPI.list(f);
      setAnime(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setAnime([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, [filters]);

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="pt-24 pb-16 fade-in">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Browse Anime</h1>
          <p className="text-white/50">{total.toLocaleString()} series available</p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            placeholder="Search by title…"
            className="input pl-11"
          />
        </div>

        {/* Filters */}
        <div className="mb-8 p-5 glass rounded-2xl">
          <GenreFilter filters={filters} onChange={setFilters} />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : anime.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl font-bold text-white/20 mb-2">No results found</p>
            <p className="text-white/40 text-sm">Try different search terms or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {anime.map((a) => <AnimeCard key={a.id} anime={a} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={filters.page === 1}
              className="btn btn-ghost py-2 px-3 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = filters.page <= 4 ? i + 1 : filters.page - 3 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p}
                  onClick={() => setFilters((f) => ({ ...f, page: p }))}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    p === filters.page ? 'bg-blue-600 text-white' : 'btn btn-ghost py-0 px-0'
                  }`}>
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={filters.page === totalPages}
              className="btn btn-ghost py-2 px-3 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
