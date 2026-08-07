const { body } = require('express-validator');

const registerValidators = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().isString().trim(),
];

const loginValidators = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

module.exports = { registerValidators, loginValidators };
