const mongoose = require('mongoose');
const Entry = require('../models/Entry');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { findOwnedCollection } = require('./collections.controller');
const { validateAndCoerceEntryData, buildSearchText } = require('../services/fieldSchema.service');
const { parseCsvBuffer, mapRowToEntryData } = require('../services/csvImport.service');

function buildFieldFilter(field, rawValue) {
  if (rawValue === undefined || rawValue === '') return undefined;
  const path = `data.${field.key}`;

  switch (field.type) {
    case 'number': {
      if (typeof rawValue === 'object') {
        const range = {};
        if (rawValue.gte !== undefined) range.$gte = Number(rawValue.gte);
        if (rawValue.lte !== undefined) range.$lte = Number(rawValue.lte);
        return { [path]: range };
      }
      return { [path]: Number(rawValue) };
    }
    case 'date': {
      if (typeof rawValue === 'object') {
        const range = {};
        if (rawValue.from) range.$gte = new Date(rawValue.from);
        if (rawValue.to) range.$lte = new Date(rawValue.to);
        return { [path]: range };
      }
      return { [path]: new Date(rawValue) };
    }
    case 'dropdown': {
      const values = Array.isArray(rawValue) ? rawValue : String(rawValue).split(',');
      return { [path]: { $in: values } };
    }
    case 'tags': {
      const values = Array.isArray(rawValue) ? rawValue : String(rawValue).split(',');
      return { [path]: { $in: values } };
    }
    default:
      return { [path]: { $regex: String(rawValue), $options: 'i' } };
  }
}

const listEntries = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.collectionId);
  const { search, page = 1, limit = 25, sort = '-createdAt' } = req.query;

  const filter = { collection: collection._id };
  if (search) {
    filter.searchText = { $regex: String(search).toLowerCase(), $options: 'i' };
  }

  for (const field of collection.fields) {
    const raw = req.query[field.key];
    const fieldFilter = buildFieldFilter(field, raw);
    if (fieldFilter) Object.assign(filter, fieldFilter);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));

  const [items, total] = await Promise.all([
    Entry.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Entry.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

const createEntry = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.collectionId);
  const { data, errors } = validateAndCoerceEntryData(collection, req.body.data || {});
  if (errors.length > 0) throw new ApiError(400, 'Entry validation failed', errors);

  const entry = await Entry.create({
    collection: collection._id,
    owner: req.userId,
    data,
    searchText: buildSearchText(collection, data),
  });

  res.status(201).json({ entry });
});

async function findOwnedEntry(userId, collectionId, entryId) {
  const entry = await Entry.findOne({ _id: entryId, collection: collectionId, owner: userId });
  if (!entry) throw new ApiError(404, 'Entry not found');
  return entry;
}

const getEntry = asyncHandler(async (req, res) => {
  const entry = await findOwnedEntry(req.userId, req.params.collectionId, req.params.entryId);
  res.json({ entry });
});

const updateEntry = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.collectionId);
  const entry = await findOwnedEntry(req.userId, req.params.collectionId, req.params.entryId);

  const { data, errors } = validateAndCoerceEntryData(collection, req.body.data || {});
  if (errors.length > 0) throw new ApiError(400, 'Entry validation failed', errors);

  entry.data = data;
  entry.searchText = buildSearchText(collection, data);
  await entry.save();

  res.json({ entry });
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await findOwnedEntry(req.userId, req.params.collectionId, req.params.entryId);
  await entry.deleteOne();
  res.status(204).send();
});

const bulkDeleteEntries = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.collectionId);
  const ids = req.body.ids.filter((id) => mongoose.isValidObjectId(id));
  const result = await Entry.deleteMany({ _id: { $in: ids }, collection: collection._id, owner: req.userId });
  res.json({ deletedCount: result.deletedCount });
});

const previewImport = asyncHandler(async (req, res) => {
  await findOwnedCollection(req.userId, req.params.collectionId);
  if (!req.file) throw new ApiError(400, 'CSV file is required');

  const { headers, rows } = parseCsvBuffer(req.file.buffer);
  res.json({ headers, preview: rows.slice(0, 5), rowCount: rows.length });
});

const importEntries = asyncHandler(async (req, res) => {
  const collection = await findOwnedCollection(req.userId, req.params.collectionId);
  if (!req.file) throw new ApiError(400, 'CSV file is required');

  let mapping;
  try {
    mapping = JSON.parse(req.body.mapping || '{}');
  } catch {
    throw new ApiError(400, 'mapping must be valid JSON');
  }

  const { rows } = parseCsvBuffer(req.file.buffer);
  const docs = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rawData = mapRowToEntryData(row, mapping);
    const { data, errors: rowErrors } = validateAndCoerceEntryData(collection, rawData);
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, messages: rowErrors.map((e) => e.message) });
      return;
    }
    docs.push({
      collection: collection._id,
      owner: req.userId,
      data,
      searchText: buildSearchText(collection, data),
    });
  });

  const inserted = docs.length > 0 ? await Entry.insertMany(docs, { ordered: false }) : [];
  res.json({ insertedCount: inserted.length, errorCount: errors.length, errors });
});

module.exports = {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  bulkDeleteEntries,
  findOwnedEntry,
  previewImport,
  importEntries,
};
