const supabase = require('../config/supabase');
const slugify  = require('slugify');

const PAGE_SIZE = 24;

// ── List / Search / Filter ────────────────────────────────────
const listAnime = async (req, res) => {
  const {
    page = 1, limit = PAGE_SIZE,
    q, genre, status, type, year, sort = 'views', order = 'desc',
  } = req.query;

  const from = (page - 1) * limit;
  const to   = from + Number(limit) - 1;

  let query = supabase
    .from('anime')
    .select(`
      id, title, slug, cover_url, status, type, year, rating, rating_count, views,
      is_trending, is_featured, total_episodes,
      anime_genres!inner(genre_id, genres(name, slug))
    `, { count: 'exact' })
    .range(from, to)
    .order(sort, { ascending: order === 'asc' });

  if (q)      query = query.ilike('title', `%${q}%`);
  if (status) query = query.eq('status', status);
  if (type)   query = query.eq('type', type);
  if (year)   query = query.eq('year', year);
  if (genre)  query = query.eq('anime_genres.genres.slug', genre);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
};

// ── Get Single Anime ──────────────────────────────────────────
const getAnime = async (req, res) => {
  const { id } = req.params;
  const field  = id.length === 36 ? 'id' : 'slug';

  const { data, error } = await supabase
    .from('anime')
    .select(`
      *,
      anime_genres(genres(id, name, slug)),
      episodes(id, episode_number, title, thumbnail_url, duration, views, aired_at, is_filler)
    `)
    .eq(field, id)
    .order('episode_number', { referencedTable: 'episodes', ascending: true })
    .single();

  if (error || !data) return res.status(404).json({ error: 'Anime not found' });

  // Increment view count (fire and forget)
  supabase.from('anime').update({ views: data.views + 1 }).eq('id', data.id).then(() => {});

  res.json({ data });
};

// ── Trending ──────────────────────────────────────────────────
const getTrending = async (_req, res) => {
  const { data, error } = await supabase
    .from('anime')
    .select('id, title, slug, cover_url, banner_url, rating, views, total_episodes, status, type')
    .eq('is_trending', true)
    .order('views', { ascending: false })
    .limit(12);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

// ── Featured ──────────────────────────────────────────────────
const getFeatured = async (_req, res) => {
  const { data, error } = await supabase
    .from('anime')
    .select('id, title, slug, cover_url, banner_url, synopsis, rating, status, type, year, anime_genres(genres(name))')
    .eq('is_featured', true)
    .limit(5);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

// ── Create Anime (admin) ──────────────────────────────────────
const createAnime = async (req, res) => {
  const { genres: genreIds, ...body } = req.body;
  body.slug = slugify(body.title, { lower: true, strict: true });

  const { data: anime, error } = await supabase
    .from('anime')
    .insert(body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (genreIds?.length) {
    const links = genreIds.map((gid) => ({ anime_id: anime.id, genre_id: gid }));
    await supabase.from('anime_genres').insert(links);
  }

  res.status(201).json({ data: anime });
};

// ── Update Anime (admin) ──────────────────────────────────────
const updateAnime = async (req, res) => {
  const { id } = req.params;
  const { genres: genreIds, ...body } = req.body;
  if (body.title) body.slug = slugify(body.title, { lower: true, strict: true });

  const { data: anime, error } = await supabase
    .from('anime')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (genreIds) {
    await supabase.from('anime_genres').delete().eq('anime_id', id);
    if (genreIds.length) {
      const links = genreIds.map((gid) => ({ anime_id: id, genre_id: gid }));
      await supabase.from('anime_genres').insert(links);
    }
  }

  res.json({ data: anime });
};

// ── Delete Anime (admin) ──────────────────────────────────────
const deleteAnime = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('anime').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Anime deleted successfully' });
};

module.exports = { listAnime, getAnime, getTrending, getFeatured, createAnime, updateAnime, deleteAnime };
