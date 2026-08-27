const router = require('express').Router();
const ctrl   = require('../controllers/watchHistoryController');
const { authenticate } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

// Watch progress
router.post('/progress',                    ctrl.upsertProgress);
router.get('/',                             ctrl.getHistory);
router.get('/continue-watching',            ctrl.getContinueWatching);
router.delete('/:id',                       ctrl.deleteEntry);

// Favorites
router.get('/favorites',                    ctrl.getFavorites);
router.post('/favorites',                   ctrl.addFavorite);
router.delete('/favorites/:animeId',        ctrl.removeFavorite);

// Ratings
router.post('/rate',                        ctrl.rateAnime);

// Comments (read public, write needs auth)
router.get('/comments/:animeId',            ctrl.getComments);
router.post('/comments',                    ctrl.addComment);
router.delete('/comments/:id',              ctrl.deleteComment);

module.exports = router;
