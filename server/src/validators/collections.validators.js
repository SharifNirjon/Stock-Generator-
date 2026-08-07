const { body } = require('express-validator');

const upsertCollectionValidators = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('description').optional().isString().trim(),
  body('fields').isArray().withMessage('Fields must be an array'),
];

module.exports = { upsertCollectionValidators };
