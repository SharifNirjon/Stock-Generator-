const express = require('express');
const {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  bulkDeleteEntries,
  previewImport,
  importEntries,
} = require('../controllers/entries.controller');
const { upsertEntryValidators, bulkDeleteValidators } = require('../validators/entries.validators');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router({ mergeParams: true });

router.get('/', listEntries);
router.post('/', upsertEntryValidators, validate, createEntry);
router.post('/bulk-delete', bulkDeleteValidators, validate, bulkDeleteEntries);
router.post('/import/preview', upload.single('file'), previewImport);
router.post('/import', upload.single('file'), importEntries);
router.get('/:entryId', getEntry);
router.put('/:entryId', upsertEntryValidators, validate, updateEntry);
router.delete('/:entryId', deleteEntry);

module.exports = router;
