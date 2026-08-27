const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const { authenticate }  = require('../middleware/auth');
const { validate }      = require('../middleware/validate');
const { authLimiter }   = require('../middleware/rateLimiter');

router.post('/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username 3–50 chars'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  validate,
  ctrl.register
);

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

router.get('/me',       authenticate, ctrl.getMe);
router.put('/profile',  authenticate, validate, ctrl.updateProfile);

module.exports = router;
