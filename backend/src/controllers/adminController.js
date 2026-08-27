const supabase = require('../config/supabase');

// ── Dashboard stats ───────────────────────────────────────────
const getStats = async (_req, res) => {
  const [
    { count: totalAnime },
    { count: totalUsers },
    { count: totalEpisodes },
    { data: topAnime },
  ] = await Promise.all([
    supabase.from('anime').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('episodes').select('*', { count: 'exact', head: true }),
    supabase.from('anime').select('id, title, slug, cover_url, views, rating')
      .order('views', { ascending: false }).limit(5),
  ]);

  res.json({ totalAnime, totalUsers, totalEpisodes, topAnime });
};

// ── List users ────────────────────────────────────────────────
const listUsers = async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const from = (page - 1) * limit;
  const to   = from + Number(limit) - 1;

  let query = supabase
    .from('users')
    .select('id, username, email, role, is_active, created_at', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (q) query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count });
};

// ── Toggle user status ────────────────────────────────────────
const toggleUser = async (req, res) => {
  const { id } = req.params;
  const { data: user } = await supabase.from('users').select('is_active').eq('id', id).single();
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: !user.is_active })
    .eq('id', id)
    .select('id, username, is_active')
    .single();
  if (error) return res.status(400).json({ error: error.message });

  await logAction(req.user.id, 'toggle_user', 'users', id, { is_active: data.is_active });
  res.json({ data });
};

// ── Set user role ─────────────────────────────────────────────
const setRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select('id, username, role')
    .single();
  if (error) return res.status(400).json({ error: error.message });

  await logAction(req.user.id, 'set_role', 'users', id, { role });
  res.json({ data });
};

// ── Admin logs ────────────────────────────────────────────────
const getLogs = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const from = (page - 1) * limit;
  const to   = from + Number(limit) - 1;

  const { data, count, error } = await supabase
    .from('admin_logs')
    .select('*, admin:admin_id(username)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count });
};

// ── Helper: log admin action ──────────────────────────────────
const logAction = async (adminId, action, target, targetId, details = {}) => {
  await supabase.from('admin_logs').insert({ admin_id: adminId, action, target, target_id: targetId, details });
};

module.exports = { getStats, listUsers, toggleUser, setRole, getLogs, logAction };
