const { stringify } = require('csv-stringify/sync');
const Entry = require('../models/Entry');
const ReportTemplate = require('../models/ReportTemplate');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { findOwnedCollection } = require('./collections.controller');
const { buildReportPipeline } = require('../services/aggregation.service');
const { computeStockReport } = require('../services/stockReport.service');

const DEFAULT_STATS = { count: 0, sum: 0, avg: 0, min: null, max: null };

async function runReportForCollection(userId, config) {
  const { collectionId, filters, groupByField, metricField, aggregation } = config;
  const collection = await findOwnedCollection(userId, collectionId);

  const pipeline = buildReportPipeline(collection, { filters, groupByField, metricField, aggregation });
  const [result] = await Entry.aggregate(pipeline);

  const stats = { ...DEFAULT_STATS, ...(result?.stats?.[0] || {}) };
  const chartData = result?.chartData || [];
  const tableRows = result?.tableRows || [];

  return { collection, stats, chartData, tableRows };
}

const runReport = asyncHandler(async (req, res) => {
  const { collection, stats, chartData, tableRows } = await runReportForCollection(req.userId, req.body);
  res.json({ collection, stats, chartData, tableRows });
});

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await ReportTemplate.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json({ templates });
});

const createTemplate = asyncHandler(async (req, res) => {
  await findOwnedCollection(req.userId, req.body.collection);
  const template = await ReportTemplate.create({ ...req.body, owner: req.userId });
  res.status(201).json({ template });
});

async function findOwnedTemplate(userId, id) {
  const template = await ReportTemplate.findOne({ _id: id, owner: userId });
  if (!template) throw new ApiError(404, 'Report template not found');
  return template;
}

const getTemplate = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.userId, req.params.id);
  res.json({ template });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.userId, req.params.id);
  Object.assign(template, req.body);
  await template.save();
  res.json({ template });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.userId, req.params.id);
  await template.deleteOne();
  res.status(204).send();
});

const runTemplate = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.userId, req.params.id);
  const { collection, stats, chartData, tableRows } = await runReportForCollection(req.userId, {
    collectionId: template.collection.toString(),
    filters: template.filters,
    groupByField: template.groupByField,
    metricField: template.metricField,
    aggregation: template.aggregation,
  });
  res.json({ template, collection, stats, chartData, tableRows });
});

const exportCsv = asyncHandler(async (req, res) => {
  const { collection, tableRows } = await runReportForCollection(req.userId, req.body);
  const selectedFields = req.body.selectedFields?.length
    ? collection.fields.filter((f) => req.body.selectedFields.includes(f.key))
    : collection.fields;

  const header = ['Created At', ...selectedFields.map((f) => f.label)];
  const rows = tableRows.map((row) => [
    new Date(row.createdAt).toISOString(),
    ...selectedFields.map((f) => {
      const value = row.data?.[f.key];
      return Array.isArray(value) ? value.join(', ') : value ?? '';
    }),
  ]);

  const csv = stringify([header, ...rows]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${collection.name}-report.csv"`);
  res.send(csv);
});

const stockReport = asyncHandler(async (req, res) => {
  const { incomingCollectionId, outgoingCollectionId } = req.body;
  const [incomingCollection, outgoingCollection] = await Promise.all([
    findOwnedCollection(req.userId, incomingCollectionId),
    findOwnedCollection(req.userId, outgoingCollectionId),
  ]);

  const items = await computeStockReport(incomingCollection, outgoingCollection);
  res.json({ incomingCollection, outgoingCollection, items });
});

module.exports = {
  runReport,
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  runTemplate,
  exportCsv,
  stockReport,
};
