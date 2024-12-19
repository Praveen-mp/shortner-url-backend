const jwt = require('jsonwebtoken');

exports.authenticateUser = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if (!token) throw new Error();

    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
