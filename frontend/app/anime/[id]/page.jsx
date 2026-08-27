'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { animeAPI, historyAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Star, Play, Bookmark, BookmarkCheck, Heart, Share2,
  ChevronRight, Clock, Calendar, Tv2, Film, MessageCircle, Send,
} from 'lucide-react';

const STATUS_BADGE = {
  ongoing: 'badge-green', completed: 'badge-blue',
  upcoming: 'badge-yellow', hiatus: 'badge-red',
};

function EpisodeList({ episodes, animeSlug, currentId }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? episodes : episodes.slice(0, 26);
  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {visible.map((ep) => (
          <Link key={ep.id}
            href={`/watch/${ep.id}`}
            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all hover:scale-105 ${
              ep.id === currentId
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : ep.is_filler
                ? 'bg-yellow-900/40 text-yellow-400/70 hover:bg-yellow-900/60'
                : 'bg-white/[0.06] hover:bg-white/[0.12]'
            }`}>
            {ep.episode_number}
          </Link>
        ))}
      </div>
      {episodes.length > 26 && (
        <button onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          {showAll ? 'Show less' : `Show all ${episodes.length} episodes`}
        </button>
      )}
    </div>
  );
}

function CommentSection({ animeId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content,  setContent]  = useState('');
  const [spoiler,  setSpoiler]  = useState(false);
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    historyAPI.getComments(animeId)
      .then(({ data }) => setComments(data.data || []))
      .catch(() => {});
  }, [animeId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSending(true);
    try {
      const { data } = await historyAPI.addComment({ anime_id: animeId, content, is_spoiler: spoiler });
      setComments([data.data, ...comments]);
      setContent('');
    } catch {}
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-400" />
        Comments <span className="text-white/40 text-sm font-normal">({comments.length})</span>
      </h3>

      {user && (
        <form onSubmit={submit} className="glass rounded-xl p-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="input resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)}
                className="accent-blue-500" />
              Mark as spoiler
            </label>
            <button type="submit" disabled={sending || !content.trim()}
              className="btn btn-primary py-2 px-4 text-sm disabled:opacity-50">
              <Send className="w-4 h-4" />
              {sending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                {c.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{c.user?.username}</p>
                <p className="text-xs text-white/40">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              {c.is_spoiler && <span className="badge badge-yellow ml-auto">Spoiler</span>}
            </div>
            <p className={`text-sm text-white/80 ${c.is_spoiler ? 'blur-sm hover:blur-none transition-all cursor-pointer' : ''}`}>
              {c.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnimeDetail() {
  const { id }   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const [anime,      setAnime]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [favorited,  setFavorited]  = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hovRating,  setHovRating]  = useState(0);

  useEffect(() => {
    animeAPI.get(id)
      .then(({ data }) => setAnime(data.data))
      .catch(() => router.push('/anime'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFav = async () => {
    if (!user) return router.push('/login');
    try {
      if (favorited) await historyAPI.removeFavorite(anime.id);
      else           await historyAPI.addFavorite({ anime_id: anime.id });
      setFavorited(!favorited);
    } catch {}
  };

  const rate = async (score) => {
    if (!user) return router.push('/login');
    try {
      await historyAPI.rate({ anime_id: anime.id, score });
      setUserRating(score);
    } catch {}
  };

  if (loading) return (
    <div className="pt-24 container">
      <div className="flex gap-8">
        <div className="skeleton w-48 h-72 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-32" />
        </div>
      </div>
    </div>
  );

  if (!anime) return null;

  const firstEp = anime.episodes?.[0];

  return (
    <div className="fade-in">
      {/* Banner */}
      {anime.banner_url && (
        <div className="relative w-full h-64 overflow-hidden">
          <img src={anime.banner_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0f]" />
        </div>
      )}

      <div className="container pt-8 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="shrink-0">
            <img
              src={anime.cover_url || 'https://placehold.co/220x320/111118/444?text=No+Image'}
              alt={anime.title}
              className="w-48 h-72 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 mx-auto md:mx-0"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`badge ${STATUS_BADGE[anime.status] || 'badge-blue'}`}>{anime.status}</span>
              <span className="badge badge-purple">{anime.type}</span>
              {anime.year && <span className="badge badge-blue">{anime.year}</span>}
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-1">{anime.title}</h1>
            {anime.title_japanese && (
              <p className="text-white/40 text-sm mb-4">{anime.title_japanese}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-white/60">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Star className="w-4 h-4 fill-yellow-400" />
                {anime.rating?.toFixed(1) || '—'} <span className="text-white/40 font-normal">({anime.rating_count} ratings)</span>
              </div>
              {anime.total_episodes > 0 && (
                <div className="flex items-center gap-1"><Tv2 className="w-4 h-4" />{anime.total_episodes} Episodes</div>
              )}
              {anime.duration && (
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{anime.duration} min/ep</div>
              )}
            </div>

            {/* Synopsis */}
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-2xl">{anime.synopsis}</p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {anime.anime_genres?.map((ag) => (
                <Link key={ag.genres?.slug} href={`/anime?genre=${ag.genres?.slug}`}
                  className="badge badge-blue hover:bg-blue-500/30 transition-colors cursor-pointer">
                  {ag.genres?.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              {firstEp && (
                <Link href={`/watch/${firstEp.id}`} className="btn btn-primary px-6">
                  <Play className="w-5 h-5 fill-white" /> Watch EP 1
                </Link>
              )}
              <button onClick={toggleFav} className="btn btn-ghost px-4">
                {favorited
                  ? <BookmarkCheck className="w-5 h-5 text-blue-400" />
                  : <Bookmark className="w-5 h-5" />}
                {favorited ? 'Saved' : 'Favorite'}
              </button>
            </div>

            {/* Rate */}
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Your Rating</p>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                  <button key={s}
                    onClick={() => rate(s)}
                    onMouseEnter={() => setHovRating(s)}
                    onMouseLeave={() => setHovRating(0)}
                    className={`text-2xl transition-all hover:scale-125 ${
                      s <= (hovRating || userRating) ? 'text-yellow-400' : 'text-white/20'
                    }`}>★</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Episodes */}
        {anime.episodes?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-5">Episodes</h2>
            <EpisodeList episodes={anime.episodes} animeSlug={anime.slug} />
          </div>
        )}

        {/* Comments */}
        <div className="mt-12">
          <CommentSection animeId={anime.id} />
        </div>
      </div>
    </div>
  );
}
