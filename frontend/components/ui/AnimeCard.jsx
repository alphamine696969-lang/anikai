'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Star, Play, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { historyAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STATUS_COLORS = {
  ongoing:   'badge-green',
  completed: 'badge-blue',
  upcoming:  'badge-yellow',
  hiatus:    'badge-red',
};

export default function AnimeCard({ anime, size = 'md', showProgress = false, progress = 0 }) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setLoading(true);
    try {
      if (favorited) {
        await historyAPI.removeFavorite(anime.id);
      } else {
        await historyAPI.addFavorite({ anime_id: anime.id });
      }
      setFavorited(!favorited);
    } catch {}
    finally { setLoading(false); }
  };

  const isSmall = size === 'sm';

  return (
    <Link href={`/anime/${anime.slug}`} className={`anime-card block group relative rounded-xl overflow-hidden bg-[#111118] cursor-pointer`}>
      {/* Thumbnail */}
      <div className={`relative overflow-hidden ${isSmall ? 'aspect-[3/4]' : 'aspect-[2/3]'}`}>
        <img
          src={anime.cover_url || 'https://placehold.co/300x450/111118/444?text=No+Image'}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        {/* Status badge */}
        <div className={`absolute top-2 left-2 badge ${STATUS_COLORS[anime.status] || 'badge-blue'}`}>
          {anime.status}
        </div>

        {/* Favorite button */}
        {user && (
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70">
            {favorited
              ? <BookmarkCheck className="w-4 h-4 text-blue-400" />
              : <Bookmark       className="w-4 h-4 text-white"   />}
          </button>
        )}

        {/* Episode count */}
        <div className="absolute bottom-2 right-2 badge bg-black/60 backdrop-blur-sm text-white/80 text-[10px]">
          {anime.total_episodes} eps
        </div>

        {/* Progress bar */}
        {showProgress && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className="progress-bar h-full" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
          {anime.title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-3 h-3 fill-yellow-400" />
            <span className="text-xs font-semibold">{anime.rating?.toFixed(1) || '—'}</span>
          </div>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-xs text-white/50">{anime.type}</span>
          {anime.year && <>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-xs text-white/50">{anime.year}</span>
          </>}
        </div>
      </div>
    </Link>
  );
}
