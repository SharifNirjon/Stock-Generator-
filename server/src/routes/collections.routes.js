const express = require('express');
const {
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
} = require('../controllers/collections.controller');
const { upsertCollectionValidators } = require('../validators/collections.validators');
const validate = require('../middleware/validate.middleware');
const verifyJwt = require('../middleware/auth.middleware');
const entriesRouter = require('./entries.routes');

const router = express.Router();
router.use(verifyJwt);

router.get('/', listCollections);
router.post('/', upsertCollectionValidators, validate, createCollection);
router.get('/:id', getCollection);
router.put('/:id', upsertCollectionValidators, validate, updateCollection);
router.delete('/:id', deleteCollection);

router.use('/:collectionId/entries', entriesRouter);

module.exports = router;
