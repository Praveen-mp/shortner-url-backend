const express = require('express');
const { createShortUrl, redirectUrl } = require('../controllers/urlController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const rateLimiter = require('../middlewares/rateLimitter');
const router = express.Router();

router.post('/shorten', authenticateUser, rateLimiter, createShortUrl);
router.get('/shorten/:alias', redirectUrl);

module.exports = router;
