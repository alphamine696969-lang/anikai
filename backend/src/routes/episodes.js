const router  = require('express').Router();
const multer  = require('multer');
const ctrl    = require('../controllers/episodeController');
const { authenticate }   = require('../middleware/auth');
const { requireAdmin }   = require('../middleware/admin');
const { uploadLimiter }  = require('../middleware/rateLimiter');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2 GB

// Public
router.get('/anime/:animeId', ctrl.listEpisodes);
router.get('/:id',            ctrl.getEpisode);

// Admin only
router.post('/',
  authenticate, requireAdmin, uploadLimiter,
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  ctrl.createEpisode
);
router.put('/:id',
  authenticate, requireAdmin, uploadLimiter,
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  ctrl.updateEpisode
);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteEpisode);

module.exports = router;
