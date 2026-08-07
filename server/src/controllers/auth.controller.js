const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ email, passwordHash: password, name });
  const token = signToken(user._id);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await user.comparePassword(password);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const token = signToken(user._id);
  res.json({ user, token });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

module.exports = { register, login, me };
