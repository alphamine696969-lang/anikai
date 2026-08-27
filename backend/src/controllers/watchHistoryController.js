const supabase = require('../config/supabase');

// ── Upsert progress ───────────────────────────────────────────
const upsertProgress = async (req, res) => {
  const { episode_id, anime_id, progress, completed } = req.body;
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from('watch_history')
    .upsert({ user_id, episode_id, anime_id, progress, completed, watched_at: new Date().toISOString() },
             { onConflict: 'user_id,episode_id' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
};

// ── Get user watch history ────────────────────────────────────
const getHistory = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const from = (page - 1) * limit;
  const to   = from + Number(limit) - 1;

  const { data, count, error } = await supabase
    .from('watch_history')
    .select(`
      id, progress, completed, watched_at,
      episode:episode_id(id, episode_number, title, thumbnail_url, duration),
      anime:anime_id(id, title, slug, cover_url, total_episodes)
    `, { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('watched_at', { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
};

// ── Get continue-watching (latest incomplete per anime) ───────
const getContinueWatching = async (req, res) => {
  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      id, progress, completed, watched_at,
      episode:episode_id(id, episode_number, title, thumbnail_url, duration),
      anime:anime_id(id, title, slug, cover_url, total_episodes)
    `)
    .eq('user_id', req.user.id)
    .eq('completed', false)
    .order('watched_at', { ascending: false })
    .limit(12);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

// ── Delete entry ──────────────────────────────────────────────
const deleteEntry = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Entry removed' });
};

// ── Favorites ─────────────────────────────────────────────────
const addFavorite = async (req, res) => {
  const { anime_id } = req.body;
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: req.user.id, anime_id });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Added to favorites' });
};

const removeFavorite = async (req, res) => {
  const { animeId } = req.params;
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', req.user.id)
    .eq('anime_id', animeId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Removed from favorites' });
};

const getFavorites = async (req, res) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('created_at, anime:anime_id(id, title, slug, cover_url, rating, status)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

// ── Ratings ───────────────────────────────────────────────────
const rateAnime = async (req, res) => {
  const { anime_id, score } = req.body;
  const { data, error } = await supabase
    .from('ratings')
    .upsert({ user_id: req.user.id, anime_id, score }, { onConflict: 'user_id,anime_id' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
};

// ── Comments ──────────────────────────────────────────────────
const getComments = async (req, res) => {
  const { animeId } = req.params;
  const { data, error } = await supabase
    .from('comments')
    .select('id, content, is_spoiler, created_at, user:user_id(username, avatar_url)')
    .eq('anime_id', animeId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

const addComment = async (req, res) => {
  const { anime_id, episode_id, content, is_spoiler } = req.body;
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: req.user.id, anime_id, episode_id, content, is_spoiler })
    .select('id, content, is_spoiler, created_at, user:user_id(username, avatar_url)')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
};

const deleteComment = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Comment deleted' });
};

module.exports = {
  upsertProgress, getHistory, getContinueWatching, deleteEntry,
  addFavorite, removeFavorite, getFavorites,
  rateAnime, getComments, addComment, deleteComment,
};
