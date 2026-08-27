const bcrypt   = require('bcryptjs');
const supabase = require('../config/supabase');
const { sign } = require('../services/jwtService');

// ── Register ──────────────────────────────────────────────────
const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Create Supabase auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) return res.status(400).json({ error: authErr.message });

    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert into public.users profile table
    const { data: user, error: profileErr } = await supabase
      .from('users')
      .insert({ id: authData.user.id, username, email })
      .select('id, username, email, role, avatar_url')
      .single();

    if (profileErr) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileErr.message });
    }

    const token = sign({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ── Login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Verify via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) return res.status(401).json({ error: 'Invalid email or password' });

    const { data: user, error: profileErr } = await supabase
      .from('users')
      .select('id, username, email, role, avatar_url, is_active')
      .eq('id', authData.user.id)
      .single();

    if (profileErr || !user) return res.status(401).json({ error: 'User profile not found' });
    if (!user.is_active)     return res.status(403).json({ error: 'Account suspended' });

    const token = sign({ id: user.id, email: user.email, role: user.role });
    const { is_active, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── Get Me ────────────────────────────────────────────────────
const getMe = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, role, avatar_url, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
};

// ── Update Profile ────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { username, avatar_url } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .update({ username, avatar_url })
    .eq('id', req.user.id)
    .select('id, username, email, role, avatar_url')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user });
};

module.exports = { register, login, getMe, updateProfile };
