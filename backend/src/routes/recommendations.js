const router = require('express').Router();
const ctrl   = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');

router.get('/popular',  ctrl.getPopular);
router.get('/for-you',  authenticate, ctrl.getRecommendations);

module.exports = router;
