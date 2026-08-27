const router   = require('express').Router();
const ctrl     = require('../controllers/animeController');
const { authenticate }  = require('../middleware/auth');
const { requireAdmin }  = require('../middleware/admin');

// Public
router.get('/trending',   ctrl.getTrending);
router.get('/featured',   ctrl.getFeatured);
router.get('/',           ctrl.listAnime);
router.get('/:id',        ctrl.getAnime);

// Admin only
router.post('/',          authenticate, requireAdmin, ctrl.createAnime);
router.put('/:id',        authenticate, requireAdmin, ctrl.updateAnime);
router.delete('/:id',     authenticate, requireAdmin, ctrl.deleteAnime);

module.exports = router;
