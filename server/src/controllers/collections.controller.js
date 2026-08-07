const mongoose = require('mongoose');
const Collection = require('../models/Collection');
const Entry = require('../models/Entry');
const ReportTemplate = require('../models/ReportTemplate');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeFields } = require('../services/fieldSchema.service');

const listCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.userId) } },
    {
      $lookup: {
        from: 'entries',
        localField: '_id',
        foreignField: 'collection',
        as: 'entries',
      },
    },
    {
      $addFields: {
        entryCount: { $size: '$entries' },
      },
    },
    { $project: { entries: 0 } },
    { $sort: { createdAt: -1 } },
  ]);

  res.json({ collections });
});

const createCollection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  let fields;
  try {
    fields = normalizeFields(req.body.fields);
  } catch (err) {
    throw new ApiError(400, err.message);
  }

  const collection = await Collection.create({
    owner: req.userId,
    name,
    description,
    fields,
    invoiceSettings: req.body.invoiceSettings,
  });
  res.status(201).json({ collection });
});

async function findOwnedCollection(userId, id) {
  const collection = await Collection.findOne({ _id: id, owner: userId });
  if (!collection) throw new ApiError(404, 'Collection not found');
  return collection;
}

const getCollection = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.id);
  res.json({ collection });
});

const updateCollection = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.id);
  const { name, description } = req.body;

  let fields;
  try {
    fields = normalizeFields(req.body.fields);
  } catch (err) {
    throw new ApiError(400, err.message);
  }

  collection.name = name;
  collection.description = description;
  collection.fields = fields;
  collection.invoiceSettings = req.body.invoiceSettings;
  await collection.save();

  res.json({ collection });
});

const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.id);
  await Promise.all([
    Entry.deleteMany({ collection: collection._id }),
    ReportTemplate.deleteMany({ collection: collection._id }),
    collection.deleteOne(),
  ]);
  res.status(204).send();
});

module.exports = {
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  findOwnedCollection,
};
