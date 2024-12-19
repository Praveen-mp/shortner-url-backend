const Analytics = require('../models/Analytics');
const Url = require('../models/Url');
const mongoose = require('mongoose');

/**
 * Get detailed analytics for a specific short URL.
 * Endpoint: GET /api/analytics/:alias
 */
exports.getUrlAnalytics = async (req, res) => {
  try {
    const { alias } = req.params;

    // Find the short URL
    const url = await Url.findOne({ shortUrl: alias });
    if (!url) return res.status(404).json({ message: 'Short URL not found' });

    // Retrieve analytics data
    const analytics = await Analytics.findOne({ urlId: url._id });
    if (!analytics) {
      return res.json({
        totalClicks: 0,
        uniqueClicks: 0,
        clicksByDate: [],
        osType: [],
        deviceType: []
      });
    }

    // Aggregate analytics data
    const totalClicks = analytics.clicks.length;
    const uniqueClicks = new Set(analytics.clicks.map((c) => c.ip)).size;

    // Aggregate clicks by date
    const clicksByDate = analytics.clicks.reduce((acc, click) => {
      const date = click.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Aggregate clicks by OS type
    const osType = aggregateByField(analytics.clicks, 'osName');

    // Aggregate clicks by device type
    const deviceType = aggregateByField(analytics.clicks, 'deviceName');

    res.json({
      totalClicks,
      uniqueClicks,
      clicksByDate: formatObjectToArray(clicksByDate),
      osType,
      deviceType
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get topic-based analytics for all short URLs grouped under a specific topic.
 * Endpoint: GET /api/analytics/topic/:topic
 */
exports.getTopicAnalytics = async (req, res) => {
  try {
    const { topic } = req.params;
    const userId = req.user.userId;

    // Find all URLs under the topic created by the user
    const urls = await Url.find({ topic, createdBy: userId });
    if (!urls.length) return res.json({ message: 'No URLs found under this topic' });

    // Aggregate analytics for each URL
    let totalClicks = 0;
    let uniqueClicks = new Set();
    const clicksByDate = {};

    const urlAnalytics = await Promise.all(
      urls.map(async (url) => {
        const analytics = await Analytics.findOne({ urlId: url._id });
        if (!analytics) return { shortUrl: url.shortUrl, totalClicks: 0, uniqueClicks: 0 };

        totalClicks += analytics.clicks.length;
        analytics.clicks.forEach((c) => uniqueClicks.add(c.ip));

        // Aggregate clicks by date
        analytics.clicks.forEach((click) => {
          const date = click.timestamp.toISOString().split('T')[0];
          clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });

        return {
          shortUrl: url.shortUrl,
          totalClicks: analytics.clicks.length,
          uniqueClicks: new Set(analytics.clicks.map((c) => c.ip)).size
        };
      })
    );

    res.json({
      totalClicks,
      uniqueClicks: uniqueClicks.size,
      clicksByDate: formatObjectToArray(clicksByDate),
      urls: urlAnalytics
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get overall analytics for all URLs created by the user.
 * Endpoint: GET /api/analytics/overall
 */
exports.getOverallAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all URLs created by the user
    const urls = await Url.find({ createdBy: userId });
    if (!urls.length) return res.json({ message: 'No URLs found' });

    let totalClicks = 0;
    let uniqueClicks = new Set();
    const clicksByDate = {};
    const osType = {};
    const deviceType = {};

    await Promise.all(
      urls.map(async (url) => {
        const analytics = await Analytics.findOne({ urlId: url._id });
        if (!analytics) return;

        totalClicks += analytics.clicks.length;
        analytics.clicks.forEach((c) => {
          uniqueClicks.add(c.ip);

          // Aggregate clicks by date
          const date = c.timestamp.toISOString().split('T')[0];
          clicksByDate[date] = (clicksByDate[date] || 0) + 1;

          // Aggregate OS type and device type
          osType[c.osName] = (osType[c.osName] || 0) + 1;
          deviceType[c.deviceName] = (deviceType[c.deviceName] || 0) + 1;
        });
      })
    );

    res.json({
      totalUrls: urls.length,
      totalClicks,
      uniqueClicks: uniqueClicks.size,
      clicksByDate: formatObjectToArray(clicksByDate),
      osType: formatObjectToArray(osType, 'osName', 'uniqueClicks'),
      deviceType: formatObjectToArray(deviceType, 'deviceName', 'uniqueClicks')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function: Aggregate clicks based on a specific field.
 */
function aggregateByField(data, field) {
  return data.reduce((acc, item) => {
    acc[item[field]] = (acc[item[field]] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Helper function: Convert an object into an array of key-value pairs.
 */
function formatObjectToArray(obj, keyName = 'date', valueName = 'clickCount') {
  return Object.keys(obj).map((key) => ({
    [keyName]: key,
    [valueName]: obj[key]
  }));
}
