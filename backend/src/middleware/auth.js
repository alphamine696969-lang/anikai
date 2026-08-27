const { verify } = require('../services/jwtService');
const supabase   = require('../config/supabase');

/**
 * Verifies JWT and attaches req.user = { id, email, role }
 */
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }
  try {
    const token   = header.split(' ')[1];
    const decoded = verify(token);

    // Fetch fresh user record to ensure not deleted / deactivated
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(401).json({ error: 'User not found' });
    if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
