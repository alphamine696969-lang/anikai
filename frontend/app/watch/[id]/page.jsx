'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { episodeAPI } from '@/lib/api';
import { ChevronLeft, ChevronRight, List, SkipForward, Play } from 'lucide-react';

export default function WatchPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [ep,     setEp]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    setLoading(true);
    episodeAPI.get(id)
      .then(({ data }) => setEp(data.data))
      .catch(() => router.push('/anime'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnded = () => {
    if (autoplay && ep?.next_episode) {
      router.push(`/watch/${ep.next_episode.id}`);
    }
  };

  if (loading) return (
    <div className="pt-20 container">
      <div className="skeleton w-full rounded-xl" style={{ aspectRatio: '16/9' }} />
      <div className="mt-6 space-y-3">
        <div className="skeleton h-8 w-1/2" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  );

  if (!ep) return null;

  return (
    <div className="pt-20 min-h-screen fade-in">
      <div className="container">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main player column */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/50 mb-4 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/anime/${ep.anime?.slug}`} className="hover:text-white transition-colors">
                {ep.anime?.title}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">Episode {ep.episode_number}</span>
            </div>

            {/* Player */}
            <VideoPlayer
              url={ep.video_url}
              episodeId={ep.id}
              animeId={ep.anime_id}
              onEnded={handleEnded}
              title={`${ep.anime?.title} – Episode ${ep.episode_number}: ${ep.title || ''}`}
            />

            {/* Controls under player */}
            <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold">
                  Episode {ep.episode_number}{ep.title ? `: ${ep.title}` : ''}
                </h1>
                <Link href={`/anime/${ep.anime?.slug}`}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  {ep.anime?.title}
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {/* Autoplay toggle */}
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)}
                    className="accent-blue-500 w-4 h-4" />
                  Auto-play next
                </label>

                {ep.prev_episode && (
                  <Link href={`/watch/${ep.prev_episode.id}`} className="btn btn-ghost py-2 px-3 text-sm">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Link>
                )}
                {ep.next_episode && (
                  <Link href={`/watch/${ep.next_episode.id}`} className="btn btn-primary py-2 px-3 text-sm">
                    Next <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Synopsis */}
            {ep.synopsis && (
              <div className="mt-5 glass rounded-xl p-4">
                <p className="text-sm text-white/70 leading-relaxed">{ep.synopsis}</p>
              </div>
            )}
          </div>

          {/* Sidebar: Episode list */}
          <div className="xl:w-80 shrink-0">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <List className="w-4 h-4 text-blue-400" /> Episodes
                </h2>
                <span className="text-xs text-white/40">{ep.anime?.total_episodes} total</span>
              </div>
              <div className="overflow-y-auto max-h-[70vh] divide-y divide-white/[0.04]">
                {ep.anime && (
                  <EpisodeSidebar animeId={ep.anime_id} currentId={ep.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EpisodeSidebar({ animeId, currentId }) {
  const [episodes, setEpisodes] = useState([]);
  useEffect(() => {
    episodeAPI.list(animeId)
      .then(({ data }) => setEpisodes(data.data || []))
      .catch(() => {});
  }, [animeId]);

  return (
    <>
      {episodes.map((ep) => (
        <Link key={ep.id} href={`/watch/${ep.id}`}
          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
            ep.id === currentId
              ? 'bg-blue-600/20 border-l-2 border-blue-500'
              : 'hover:bg-white/[0.04]'
          }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            ep.id === currentId ? 'bg-blue-600 text-white' : 'bg-white/[0.08] text-white/60'
          }`}>
            {ep.id === currentId ? <Play className="w-4 h-4 fill-white" /> : ep.episode_number}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Episode {ep.episode_number}</p>
            {ep.title && <p className="text-xs text-white/40 truncate">{ep.title}</p>}
          </div>
          {ep.is_filler && <span className="badge badge-yellow shrink-0 text-[9px]">Filler</span>}
        </Link>
      ))}
    </>
  );
}
