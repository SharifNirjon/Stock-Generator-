const mongoose = require('mongoose');

const FIELD_TYPES = ['text', 'number', 'date', 'dropdown', 'tags', 'line_items'];
const ITEM_COLUMN_TYPES = ['text', 'number', 'dropdown'];

const itemColumnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ITEM_COLUMN_TYPES, required: true },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    builtin: { type: Boolean, default: false },
  },
  { _id: false }
);

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    itemColumns: [itemColumnSchema],
    trackPayments: { type: Boolean, default: true },
  },
  { _id: false }
);

const invoiceSettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true },
    tagline: { type: String, trim: true },
    address: { type: String, trim: true },
    contact: { type: String, trim: true },
    currencyWord: { type: String, trim: true, default: 'Taka' },
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fields: [fieldSchema],
    invoiceSettings: { type: invoiceSettingsSchema, default: undefined },
  },
  { timestamps: true }
);

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });

collectionSchema.pre('save', function ensureUniqueFieldKeys(next) {
  const keys = this.fields.map((f) => f.key);
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    return next(new Error(`Duplicate field keys: ${[...new Set(duplicates)].join(', ')}`));
  }
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);
module.exports.FIELD_TYPES = FIELD_TYPES;
module.exports.ITEM_COLUMN_TYPES = ITEM_COLUMN_TYPES;
