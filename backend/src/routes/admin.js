const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.use(authenticate, requireAdmin);

router.get('/stats',           ctrl.getStats);
router.get('/users',           ctrl.listUsers);
router.patch('/users/:id/toggle', ctrl.toggleUser);
router.patch('/users/:id/role',   ctrl.setRole);
router.get('/logs',            ctrl.getLogs);

module.exports = router;
