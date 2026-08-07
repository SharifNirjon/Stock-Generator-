const Entry = require('../models/Entry');
const ApiError = require('../utils/ApiError');

function findLineItemsFieldKey(collection) {
  const field = collection.fields.find((f) => f.type === 'line_items');
  if (!field) throw new ApiError(400, `Collection "${collection.name}" has no line-items field`);
  return field.key;
}

function normalizeDescription(description) {
  return String(description || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function fetchLineItemRows(collectionId, lineItemsKey) {
  const entries = await Entry.find({ collection: collectionId }).select(`data.${lineItemsKey} createdAt`).lean();

  const rows = [];
  for (const entry of entries) {
    const container = entry.data?.[lineItemsKey];
    const items = Array.isArray(container) ? container : container?.rows || [];
    for (const item of items) {
      rows.push({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        total: Number(item.total) || 0,
        createdAt: entry.createdAt,
      });
    }
  }
  return rows;
}

function aggregateRows(rows) {
  const byKey = new Map();

  for (const row of rows) {
    const key = normalizeDescription(row.description);
    if (!key) continue;

    if (!byKey.has(key)) {
      byKey.set(key, { description: row.description, quantity: 0, value: 0, latestRate: 0, latestAt: null });
    }
    const agg = byKey.get(key);
    agg.quantity += row.quantity;
    agg.value += row.total;

    if (!agg.latestAt || new Date(row.createdAt) > new Date(agg.latestAt)) {
      agg.latestAt = row.createdAt;
      agg.latestRate = row.rate;
      agg.description = row.description;
    }
  }

  return byKey;
}

async function computeStockReport(incomingCollection, outgoingCollection) {
  const incomingKey = findLineItemsFieldKey(incomingCollection);
  const outgoingKey = findLineItemsFieldKey(outgoingCollection);

  const [incomingRows, outgoingRows] = await Promise.all([
    fetchLineItemRows(incomingCollection._id, incomingKey),
    fetchLineItemRows(outgoingCollection._id, outgoingKey),
  ]);

  const incomingByKey = aggregateRows(incomingRows);
  const outgoingByKey = aggregateRows(outgoingRows);

  const allKeys = new Set([...incomingByKey.keys(), ...outgoingByKey.keys()]);

  const items = [...allKeys].map((key) => {
    const inAgg = incomingByKey.get(key);
    const outAgg = outgoingByKey.get(key);

    const totalIn = inAgg?.quantity || 0;
    const totalOut = outAgg?.quantity || 0;
    const currentStock = totalIn - totalOut;
    const latestRate = inAgg?.latestRate || 0;

    return {
      description: inAgg?.description || outAgg?.description,
      totalIn,
      totalOut,
      currentStock,
      totalPurchaseValue: inAgg?.value || 0,
      totalSalesValue: outAgg?.value || 0,
      currentStockValue: currentStock * latestRate,
      latestRate,
    };
  });

  items.sort((a, b) => a.description.localeCompare(b.description));
  return items;
}

module.exports = { computeStockReport, findLineItemsFieldKey };
