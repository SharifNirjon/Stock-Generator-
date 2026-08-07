const express = require('express');
const {
  runReport,
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  runTemplate,
  exportCsv,
  stockReport,
} = require('../controllers/reports.controller');
const { runReportValidators, saveTemplateValidators, stockReportValidators } = require('../validators/reports.validators');
const validate = require('../middleware/validate.middleware');
const verifyJwt = require('../middleware/auth.middleware');

const router = express.Router();
router.use(verifyJwt);

router.post('/run', runReportValidators, validate, runReport);
router.post('/export/csv', runReportValidators, validate, exportCsv);
router.post('/stock', stockReportValidators, validate, stockReport);

router.get('/templates', listTemplates);
router.post('/templates', saveTemplateValidators, validate, createTemplate);
router.get('/templates/:id', getTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.post('/templates/:id/run', runTemplate);

module.exports = router;
