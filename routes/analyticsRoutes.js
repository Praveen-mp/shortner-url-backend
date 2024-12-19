const express = require('express');
const { 
  getUrlAnalytics, 
  getTopicAnalytics, 
  getOverallAnalytics 
} = require('../controllers/analyticsController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/analytics/:alias', authenticateUser, getUrlAnalytics);
router.get('/analytics/topic/:topic', authenticateUser, getTopicAnalytics);
router.get('/analytics/overall', authenticateUser, getOverallAnalytics);

module.exports = router;
