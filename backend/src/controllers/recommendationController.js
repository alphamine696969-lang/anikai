const supabase = require('../config/supabase');

/**
 * Genre-based collaborative filtering recommendation.
 * 1. Get genres the user has watched most.
 * 2. Find anime with matching genres not yet watched.
 * 3. Sort by rating × views score.
 */
const getRecommendations = async (req, res) => {
  const userId = req.user.id;

  // Get user's watched anime IDs
  const { data: history } = await supabase
    .from('watch_history')
    .select('anime_id')
    .eq('user_id', userId);

  const watchedIds = [...new Set((history || []).map((h) => h.anime_id))];

  // Get genre counts from watched anime
  const { data: watchedGenres } = watchedIds.length
    ? await supabase
        .from('anime_genres')
        .select('genre_id')
        .in('anime_id', watchedIds)
    : { data: [] };

  // Count genre frequency
  const genreFreq = {};
  (watchedGenres || []).forEach(({ genre_id }) => {
    genreFreq[genre_id] = (genreFreq[genre_id] || 0) + 1;
  });
  const topGenreIds = Object.entries(genreFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => Number(id));

  // Fallback: top-rated if no history
  if (!topGenreIds.length) {
    const { data } = await supabase
      .from('anime')
      .select('id, title, slug, cover_url, rating, views, status, type')
      .order('rating', { ascending: false })
      .limit(12);
    return res.json({ data: data || [] });
  }

  // Get anime in those genres, exclude already watched
  const { data: genreMatches } = await supabase
    .from('anime_genres')
    .select('anime_id, genre_id')
    .in('genre_id', topGenreIds);

  const candidateIds = [
    ...new Set(
      (genreMatches || [])
        .map((g) => g.anime_id)
        .filter((id) => !watchedIds.includes(id))
    ),
  ];

  if (!candidateIds.length) {
    return res.json({ data: [] });
  }

  const { data } = await supabase
    .from('anime')
    .select('id, title, slug, cover_url, rating, views, status, type, year')
    .in('id', candidateIds.slice(0, 50))
    .order('rating', { ascending: false })
    .limit(12);

  res.json({ data: data || [] });
};

// ── Popular this week (by views + rating composite) ───────────
const getPopular = async (_req, res) => {
  const { data, error } = await supabase
    .from('anime')
    .select('id, title, slug, cover_url, rating, views, status, type')
    .order('views', { ascending: false })
    .limit(12);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
};

module.exports = { getRecommendations, getPopular };
