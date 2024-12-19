const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleSignIn = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name } = ticket.getPayload();
    let user = await User.findOne({ googleId });

    if (!user) {
      user = new User({ googleId, email, name });
      await user.save();
    }

    const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ authToken });
  } catch (err) {
    res.status(401).json({ message: 'Google authentication failed' });
  }
};
