const mongoose = require('mongoose');

const filterSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    operator: {
      type: String,
      enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'between', 'contains'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const reportTemplateSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    collection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
    filters: [filterSchema],
    chartType: { type: String, enum: ['bar', 'line', 'pie', 'table'], required: true, default: 'table' },
    groupByField: { type: String },
    metricField: { type: String },
    aggregation: { type: String, enum: ['count', 'sum', 'avg', 'min', 'max'], default: 'count' },
    selectedFields: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
