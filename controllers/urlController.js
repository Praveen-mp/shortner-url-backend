const Url = require('../models/Url');
const Analytics = require('../models/Analytics');
const redisClient = require('../config/redis');

exports.createShortUrl = async (req, res) => {
  const { longUrl, customAlias, topic } = req.body;
  const shortUrl = customAlias || generateRandomString();

  const url = new Url({
    longUrl,
    shortUrl,
    customAlias,
    topic,
    createdBy: req.user.userId,
  });
  await url.save();

  redisClient.set(shortUrl, longUrl, 'EX', 86400); // Cache for 24 hours
  res.json({ shortUrl: `${req.headers.host}/${shortUrl}`, createdAt: url.createdAt });
};

exports.redirectUrl = async (req, res) => {
  const { alias } = req.params;

  let longUrl = await redisClient.get(alias);
  if (!longUrl) {
    const url = await Url.findOne({ shortUrl: alias });
    if (!url) return res.status(404).json({ message: 'URL not found' });

    longUrl = url.longUrl;
    redisClient.set(alias, longUrl, 'EX', 86400);
  }

  logClick(alias, req);
  res.redirect(longUrl);
};
