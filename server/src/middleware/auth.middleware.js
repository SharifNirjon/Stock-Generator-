const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

function verifyJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Missing or invalid Authorization header'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = verifyJwt;
