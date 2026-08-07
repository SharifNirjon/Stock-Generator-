const { body } = require('express-validator');

const upsertEntryValidators = [body('data').isObject().withMessage('data must be an object')];

const bulkDeleteValidators = [body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array')];

module.exports = { upsertEntryValidators, bulkDeleteValidators };
