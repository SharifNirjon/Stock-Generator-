const ApiError = require('../utils/ApiError');

function coerceForType(type, value) {
  if (type === 'number') return Number(value);
  if (type === 'date') return new Date(value);
  return value;
}

function buildFilterStage(field, filter) {
  const path = `data.${field.key}`;
  const { operator, value } = filter;

  switch (operator) {
    case 'eq':
      return { [path]: coerceForType(field.type, value) };
    case 'ne':
      return { [path]: { $ne: coerceForType(field.type, value) } };
    case 'gt':
      return { [path]: { $gt: coerceForType(field.type, value) } };
    case 'gte':
      return { [path]: { $gte: coerceForType(field.type, value) } };
    case 'lt':
      return { [path]: { $lt: coerceForType(field.type, value) } };
    case 'lte':
      return { [path]: { $lte: coerceForType(field.type, value) } };
    case 'in': {
      const values = Array.isArray(value) ? value : [value];
      return { [path]: { $in: values.map((v) => coerceForType(field.type, v)) } };
    }
    case 'between': {
      const { from, to } = value || {};
      const range = {};
      if (from !== undefined) range.$gte = coerceForType(field.type, from);
      if (to !== undefined) range.$lte = coerceForType(field.type, to);
      return { [path]: range };
    }
    case 'contains':
      return { [path]: { $regex: String(value), $options: 'i' } };
    default:
      throw new ApiError(400, `Unsupported filter operator: ${operator}`);
  }
}

function buildReportPipeline(collection, { filters = [], groupByField, metricField, aggregation = 'count' }) {
  const fieldsByKey = Object.fromEntries(collection.fields.map((f) => [f.key, f]));
  const match = { collection: collection._id };

  for (const filter of filters) {
    const field = fieldsByKey[filter.fieldKey];
    if (!field) throw new ApiError(400, `Unknown filter field: ${filter.fieldKey}`);
    Object.assign(match, buildFilterStage(field, filter));
  }

  const statsGroup = { _id: null, count: { $sum: 1 } };
  if (metricField) {
    const metric = fieldsByKey[metricField];
    if (!metric) throw new ApiError(400, `Unknown metric field: ${metricField}`);
    if (metric.type !== 'number') throw new ApiError(400, `Metric field "${metric.label}" must be numeric`);
    statsGroup.sum = { $sum: `$data.${metricField}` };
    statsGroup.avg = { $avg: `$data.${metricField}` };
    statsGroup.min = { $min: `$data.${metricField}` };
    statsGroup.max = { $max: `$data.${metricField}` };
  }

  const chartDataPipeline = [];
  if (groupByField) {
    const groupField = fieldsByKey[groupByField];
    if (!groupField) throw new ApiError(400, `Unknown group-by field: ${groupByField}`);

    if (groupField.type === 'tags') {
      chartDataPipeline.push({ $unwind: { path: `$data.${groupByField}`, preserveNullAndEmptyArrays: true } });
    }

    const groupStage = { _id: `$data.${groupByField}` };
    if (aggregation === 'count') {
      groupStage.value = { $sum: 1 };
    } else {
      if (!metricField) throw new ApiError(400, 'metricField is required for sum/avg/min/max aggregation');
      groupStage.value = { [`$${aggregation}`]: `$data.${metricField}` };
    }

    chartDataPipeline.push(
      { $group: groupStage },
      { $project: { _id: 0, label: { $ifNull: ['$_id', 'Unspecified'] }, value: 1 } },
      { $sort: { label: 1 } }
    );
  }

  return [
    { $match: match },
    {
      $facet: {
        stats: [{ $group: statsGroup }],
        chartData: chartDataPipeline.length > 0 ? chartDataPipeline : [{ $match: { _id: null } }],
        tableRows: [{ $project: { data: 1, createdAt: 1 } }, { $sort: { createdAt: -1 } }, { $limit: 1000 }],
      },
    },
  ];
}

module.exports = { buildReportPipeline };
