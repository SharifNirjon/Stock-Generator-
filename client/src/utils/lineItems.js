export function rowTotal(row) {
  return Number(row?.quantity || 0) * Number(row?.rate || 0);
}

export function getRows(value) {
  if (Array.isArray(value)) return value;
  return value?.rows || [];
}

export function getPaidAmount(value) {
  return Number(value?.paidAmount || 0);
}

export function lineItemsSubtotal(rows) {
  return (rows || []).reduce((sum, row) => sum + rowTotal(row), 0);
}

export function lineItemsDue(value) {
  return lineItemsSubtotal(getRows(value)) - getPaidAmount(value);
}

export function lineItemsFields(collection) {
  return collection.fields.filter((f) => f.type === 'line_items');
}

export function entryGrandTotal(collection, entry) {
  return lineItemsFields(collection).reduce((sum, field) => sum + lineItemsSubtotal(getRows(entry.data[field.key])), 0);
}

export function entryTotalPaid(collection, entry) {
  return lineItemsFields(collection).reduce((sum, field) => sum + getPaidAmount(entry.data[field.key]), 0);
}

export function entryTotalDue(collection, entry) {
  return entryGrandTotal(collection, entry) - entryTotalPaid(collection, entry);
}
