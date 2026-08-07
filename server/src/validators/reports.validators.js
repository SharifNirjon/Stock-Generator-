const { body } = require('express-validator');

const runReportValidators = [
  body('collectionId').isString().notEmpty().withMessage('collectionId is required'),
  body('filters').optional().isArray(),
  body('chartType').optional().isIn(['bar', 'line', 'pie', 'table']),
  body('aggregation').optional().isIn(['count', 'sum', 'avg', 'min', 'max']),
];

const saveTemplateValidators = [
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('collection').isString().notEmpty().withMessage('collection is required'),
  body('chartType').isIn(['bar', 'line', 'pie', 'table']),
];

const stockReportValidators = [
  body('incomingCollectionId').isString().notEmpty().withMessage('incomingCollectionId is required'),
  body('outgoingCollectionId').isString().notEmpty().withMessage('outgoingCollectionId is required'),
];

module.exports = { runReportValidators, saveTemplateValidators, stockReportValidators };
