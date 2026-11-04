const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mycourse_super_secret_jwt_key_2026_at_least_32_characters_long';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
};

module.exports = {
  generateToken,
  verifyToken,
  sendTokenResponse,
};

