const router   = require('express').Router();
const supabase = require('../config/supabase');

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name, slug')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

module.exports = router;
