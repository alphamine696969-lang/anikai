const supabase             = require('../config/supabase');
const { uploadBuffer }     = require('../services/cloudinaryService');

// ── List episodes for anime ───────────────────────────────────
const listEpisodes = async (req, res) => {
  const { animeId } = req.params;
  const { data, error } = await supabase
    .from('episodes')
    .select('id, episode_number, title, thumbnail_url, duration, views, aired_at, is_filler')
    .eq('anime_id', animeId)
    .order('episode_number', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

// ── Get single episode (with video URL) ──────────────────────
const getEpisode = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('episodes')
    .select('*, anime:anime_id(id, title, slug, cover_url, total_episodes)')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Episode not found' });

  // Get next/prev episode
  const [{ data: next }, { data: prev }] = await Promise.all([
    supabase.from('episodes').select('id, episode_number, title')
      .eq('anime_id', data.anime_id).eq('episode_number', data.episode_number + 1).single(),
    supabase.from('episodes').select('id, episode_number, title')
      .eq('anime_id', data.anime_id).eq('episode_number', data.episode_number - 1).single(),
  ]);

  // Increment view count
  supabase.from('episodes').update({ views: data.views + 1 }).eq('id', id).then(() => {});

  res.json({ data: { ...data, next_episode: next || null, prev_episode: prev || null } });
};

// ── Create episode (admin) ────────────────────────────────────
const createEpisode = async (req, res) => {
  const body = req.body;
  const files = req.files || {};

  // Upload thumbnail if provided
  if (files.thumbnail?.[0]) {
    const result = await uploadBuffer(files.thumbnail[0].buffer, 'anikai/thumbnails');
    body.thumbnail_url = result.secure_url;
  }

  // Upload video if provided
  if (files.video?.[0]) {
    const result = await uploadBuffer(files.video[0].buffer, 'anikai/videos', {
      resource_type: 'video',
      chunk_size: 6000000,
    });
    body.video_url = result.secure_url;
  }

  const { data, error } = await supabase
    .from('episodes')
    .insert(body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Update total_episodes on anime
  const { count } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .eq('anime_id', body.anime_id);

  await supabase.from('anime').update({ total_episodes: count }).eq('id', body.anime_id);

  res.status(201).json({ data });
};

// ── Update episode (admin) ────────────────────────────────────
const updateEpisode = async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const files = req.files || {};

  if (files.thumbnail?.[0]) {
    const result = await uploadBuffer(files.thumbnail[0].buffer, 'anikai/thumbnails');
    body.thumbnail_url = result.secure_url;
  }
  if (files.video?.[0]) {
    const result = await uploadBuffer(files.video[0].buffer, 'anikai/videos', { resource_type: 'video' });
    body.video_url = result.secure_url;
  }

  const { data, error } = await supabase
    .from('episodes')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ data });
};

// ── Delete episode (admin) ────────────────────────────────────
const deleteEpisode = async (req, res) => {
  const { id } = req.params;
  const { data: ep } = await supabase.from('episodes').select('anime_id').eq('id', id).single();
  const { error }    = await supabase.from('episodes').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });

  if (ep?.anime_id) {
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('anime_id', ep.anime_id);
    await supabase.from('anime').update({ total_episodes: count }).eq('id', ep.anime_id);
  }

  res.json({ message: 'Episode deleted' });
};

module.exports = { listEpisodes, getEpisode, createEpisode, updateEpisode, deleteEpisode };
