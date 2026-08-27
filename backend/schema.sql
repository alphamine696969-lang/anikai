-- ============================================================
-- AniKai Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (mirrors Supabase Auth + extended profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  avatar_url    TEXT,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role     ON public.users(role);

-- ============================================================
-- GENRES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.genres (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO public.genres (name, slug) VALUES
  ('Action', 'action'),
  ('Adventure', 'adventure'),
  ('Comedy', 'comedy'),
  ('Drama', 'drama'),
  ('Fantasy', 'fantasy'),
  ('Horror', 'horror'),
  ('Mecha', 'mecha'),
  ('Mystery', 'mystery'),
  ('Romance', 'romance'),
  ('Sci-Fi', 'sci-fi'),
  ('Slice of Life', 'slice-of-life'),
  ('Sports', 'sports'),
  ('Supernatural', 'supernatural'),
  ('Thriller', 'thriller'),
  ('Isekai', 'isekai')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ANIME
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anime (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(500) NOT NULL,
  title_japanese  VARCHAR(500),
  slug            VARCHAR(500) UNIQUE NOT NULL,
  synopsis        TEXT,
  cover_url       TEXT,         -- Cloudinary URL
  banner_url      TEXT,         -- Cloudinary URL
  trailer_url     TEXT,
  status          VARCHAR(30)  NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'upcoming', 'hiatus')),
  type            VARCHAR(30)  NOT NULL DEFAULT 'TV' CHECK (type IN ('TV', 'Movie', 'OVA', 'ONA', 'Special')),
  total_episodes  INTEGER      DEFAULT 0,
  duration        INTEGER,      -- minutes per episode
  year            INTEGER,
  season          VARCHAR(20)  CHECK (season IN ('Winter', 'Spring', 'Summer', 'Fall')),
  rating          DECIMAL(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  rating_count    INTEGER      DEFAULT 0,
  views           BIGINT       DEFAULT 0,
  is_featured     BOOLEAN      DEFAULT FALSE,
  is_trending     BOOLEAN      DEFAULT FALSE,
  mal_id          INTEGER      UNIQUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anime_slug       ON public.anime(slug);
CREATE INDEX idx_anime_status     ON public.anime(status);
CREATE INDEX idx_anime_type       ON public.anime(type);
CREATE INDEX idx_anime_year       ON public.anime(year);
CREATE INDEX idx_anime_rating     ON public.anime(rating DESC);
CREATE INDEX idx_anime_views      ON public.anime(views DESC);
CREATE INDEX idx_anime_trending   ON public.anime(is_trending);
CREATE INDEX idx_anime_featured   ON public.anime(is_featured);
CREATE INDEX idx_anime_title      ON public.anime USING gin(to_tsvector('english', title));

-- ============================================================
-- ANIME_GENRES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anime_genres (
  anime_id  UUID    NOT NULL REFERENCES public.anime(id)   ON DELETE CASCADE,
  genre_id  INTEGER NOT NULL REFERENCES public.genres(id)  ON DELETE CASCADE,
  PRIMARY KEY (anime_id, genre_id)
);

CREATE INDEX idx_anime_genres_genre ON public.anime_genres(genre_id);

-- ============================================================
-- EPISODES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.episodes (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id        UUID         NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  episode_number  INTEGER      NOT NULL,
  title           VARCHAR(500),
  synopsis        TEXT,
  thumbnail_url   TEXT,         -- Cloudinary URL
  video_url       TEXT,         -- Cloudinary video URL (or direct stream URL)
  duration        INTEGER,      -- seconds
  views           BIGINT        DEFAULT 0,
  is_filler       BOOLEAN       DEFAULT FALSE,
  aired_at        DATE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (anime_id, episode_number)
);

CREATE INDEX idx_episodes_anime_id ON public.episodes(anime_id);
CREATE INDEX idx_episodes_number   ON public.episodes(anime_id, episode_number);

-- ============================================================
-- WATCH_HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watch_history (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  episode_id      UUID        NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  anime_id        UUID        NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  progress        INTEGER     DEFAULT 0,   -- seconds watched
  completed       BOOLEAN     DEFAULT FALSE,
  watched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, episode_id)
);

CREATE INDEX idx_watch_history_user    ON public.watch_history(user_id);
CREATE INDEX idx_watch_history_anime   ON public.watch_history(anime_id);
CREATE INDEX idx_watch_history_watched ON public.watch_history(watched_at DESC);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id     UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  anime_id    UUID        NOT NULL REFERENCES public.anime(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, anime_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- ============================================================
-- RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  user_id    UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  anime_id   UUID        NOT NULL REFERENCES public.anime(id)  ON DELETE CASCADE,
  score      INTEGER     NOT NULL CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, anime_id)
);

CREATE INDEX idx_ratings_anime ON public.ratings(anime_id);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  anime_id   UUID        NOT NULL REFERENCES public.anime(id)  ON DELETE CASCADE,
  episode_id UUID        REFERENCES public.episodes(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  is_spoiler BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_anime   ON public.comments(anime_id);
CREATE INDEX idx_comments_episode ON public.comments(episode_id);
CREATE INDEX idx_comments_user    ON public.comments(user_id);

-- ============================================================
-- ADMIN_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  target     VARCHAR(100),
  target_id  UUID,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_time  ON public.admin_logs(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_anime_updated_at
  BEFORE UPDATE ON public.anime
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-UPDATE ANIME RATING ON RATING CHANGE
-- ============================================================
CREATE OR REPLACE FUNCTION sync_anime_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.anime
  SET rating       = (SELECT AVG(score) FROM public.ratings WHERE anime_id = COALESCE(NEW.anime_id, OLD.anime_id)),
      rating_count = (SELECT COUNT(*)   FROM public.ratings WHERE anime_id = COALESCE(NEW.anime_id, OLD.anime_id)),
      updated_at   = NOW()
  WHERE id = COALESCE(NEW.anime_id, OLD.anime_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_rating_insert
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION sync_anime_rating();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;

-- Users can read/update own profile
CREATE POLICY "users_own_read"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Watch history: own rows only
CREATE POLICY "wh_own_all" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

-- Favorites: own rows only
CREATE POLICY "fav_own_all" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Ratings: own rows only
CREATE POLICY "rat_own_all" ON public.ratings FOR ALL USING (auth.uid() = user_id);

-- Comments: anyone can read, own user can write
CREATE POLICY "comments_read"   ON public.comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Anime + Episodes + Genres are public read
CREATE POLICY "anime_public_read"    ON public.anime    FOR SELECT USING (TRUE);
CREATE POLICY "episodes_public_read" ON public.episodes FOR SELECT USING (TRUE);
CREATE POLICY "genres_public_read"   ON public.genres   FOR SELECT USING (TRUE);

-- Enable RLS on public tables
ALTER TABLE public.anime    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anime_genres_public_read" ON public.anime_genres FOR SELECT USING (TRUE);
