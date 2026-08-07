const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    collection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
    searchText: { type: String, index: true },
  },
  { timestamps: true }
);

entrySchema.index({ collection: 1, createdAt: -1 });

module.exports = mongoose.model('Entry', entrySchema);
