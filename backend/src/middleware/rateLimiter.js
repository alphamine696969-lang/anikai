const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              300,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              20,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many auth attempts. Please wait 15 minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hour
  max:              50,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Upload limit reached. Try again in an hour.' },
});

module.exports = { globalLimiter, authLimiter, uploadLimiter };
