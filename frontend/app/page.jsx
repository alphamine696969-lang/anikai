'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimeCard from '@/components/ui/AnimeCard';
import { animeAPI, recommendAPI, historyAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Play, ChevronRight, Star, Flame, Clock, TrendingUp } from 'lucide-react';

// Hero banner with auto-rotate
function HeroBanner({ items }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!items?.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items?.length]);

  if (!items?.length) return null;
  const anime = items[idx];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '75vh', minHeight: 500 }}>
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${anime.banner_url || anime.cover_url})`, filter: 'blur(2px) brightness(0.35)', transform: 'scale(1.05)' }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative container h-full flex items-center">
        <div className="max-w-xl fade-in">
          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-4">
            {anime.anime_genres?.slice(0, 3).map((ag) => (
              <span key={ag.genres?.name} className="badge badge-blue">{ag.genres?.name}</span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-3 drop-shadow-lg">
            {anime.title}
          </h1>
          <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-6">
            {anime.synopsis}
          </p>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Star className="w-5 h-5 fill-yellow-400" />
              <span className="font-bold text-lg">{anime.rating?.toFixed(1) || '—'}</span>
            </div>
            <span className="badge badge-purple">{anime.type}</span>
            <span className="text-white/50 text-sm">{anime.total_episodes} Episodes</span>
          </div>

          <div className="flex gap-3">
            <Link href={`/anime/${anime.slug}`} className="btn btn-primary text-base px-6 py-3">
              <Play className="w-5 h-5 fill-white" /> Watch Now
            </Link>
            <Link href={`/anime/${anime.slug}`} className="btn btn-ghost text-base px-6 py-3">
              More Info
            </Link>
          </div>
        </div>

        {/* Cover card */}
        <div className="hidden lg:block ml-auto">
          <img
            src={anime.cover_url}
            alt={anime.title}
            className="h-72 w-48 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-blue-400' : 'w-2 bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, href, children }) {
  return (
    <section className="section">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-blue-400" />}
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          {href && (
            <Link href={href} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [featured,   setFeatured]   = useState([]);
  const [trending,   setTrending]   = useState([]);
  const [popular,    setPopular]    = useState([]);
  const [forYou,     setForYou]     = useState([]);
  const [continueW,  setContinueW]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feat, trend, pop] = await Promise.all([
          animeAPI.featured(),
          animeAPI.trending(),
          recommendAPI.popular(),
        ]);
        setFeatured(feat.data.data || []);
        setTrending(trend.data.data || []);
        setPopular(pop.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      recommendAPI.forYou().catch(() => ({ data: { data: [] } })),
      historyAPI.getContinue().catch(() => ({ data: { data: [] } })),
    ]).then(([fy, cw]) => {
      setForYou(fy.data.data || []);
      setContinueW(cw.data.data || []);
    });
  }, [user]);

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <div className="skeleton aspect-[2/3]" />
          <div className="p-3 space-y-2 bg-[#111118]">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fade-in">
      {/* Hero */}
      {featured.length > 0 && <HeroBanner items={featured} />}

      {/* Continue watching */}
      {continueW.length > 0 && (
        <Section title="Continue Watching" icon={Clock} href="/dashboard">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {continueW.map((item) => (
              <AnimeCard key={item.id} anime={item.anime}
                showProgress
                progress={(item.progress / (item.episode?.duration || 1)) * 100} />
            ))}
          </div>
        </Section>
      )}

      {/* Trending */}
      <Section title="Trending Now" icon={Flame} href="/anime?sort=views">
        {loading ? <SkeletonGrid /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trending.map((a) => <AnimeCard key={a.id} anime={a} />)}
          </div>
        )}
      </Section>

      {/* Popular */}
      <Section title="Most Popular" icon={TrendingUp} href="/anime?sort=rating">
        {loading ? <SkeletonGrid /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popular.map((a) => <AnimeCard key={a.id} anime={a} />)}
          </div>
        )}
      </Section>

      {/* Recommendations */}
      {forYou.length > 0 && (
        <Section title="Recommended For You" href="/anime">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {forYou.map((a) => <AnimeCard key={a.id} anime={a} />)}
          </div>
        </Section>
      )}

      <div className="h-20" />
    </div>
  );
}
