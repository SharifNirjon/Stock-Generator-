const mongoose = require('mongoose');
const Collection = require('../models/Collection');
const Entry = require('../models/Entry');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const ownerId = new mongoose.Types.ObjectId(req.userId);

  const [collections, entriesPerCollection, totalEntries, recentEntries] = await Promise.all([
    Collection.find({ owner: ownerId }),
    Entry.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: '$collection', count: { $sum: 1 } } },
    ]),
    Entry.countDocuments({ owner: ownerId }),
    Entry.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(10).populate('collection', 'name'),
  ]);

  const countsByCollectionId = Object.fromEntries(entriesPerCollection.map((c) => [c._id.toString(), c.count]));

  res.json({
    totalCollections: collections.length,
    totalEntries,
    entriesPerCollection: collections.map((c) => ({
      collectionId: c._id,
      name: c.name,
      count: countsByCollectionId[c._id.toString()] || 0,
    })),
    recentEntries,
  });
});

module.exports = { getSummary };
