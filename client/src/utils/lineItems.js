export function getRows(value) {
  if (Array.isArray(value)) return value;
  return value?.rows || [];
}

export function rowTotal(row) {
  return Number(row?.quantity || 0) * Number(row?.rate || 0);
}

export function rowPaid(row) {
  return Number(row?.paid || 0);
}

export function rowDue(row) {
  return rowTotal(row) - rowPaid(row);
}

export function lineItemsSubtotal(value) {
  return getRows(value).reduce((sum, row) => sum + rowTotal(row), 0);
}

export function lineItemsPaidTotal(value) {
  return getRows(value).reduce((sum, row) => sum + rowPaid(row), 0);
}

export function lineItemsDue(value) {
  return getRows(value).reduce((sum, row) => sum + rowDue(row), 0);
}

export function lineItemsFields(collection) {
  return collection.fields.filter((f) => f.type === 'line_items');
}

export function entryGrandTotal(collection, entry) {
  return lineItemsFields(collection).reduce((sum, field) => sum + lineItemsSubtotal(entry.data[field.key]), 0);
}

export function entryTotalPaid(collection, entry) {
  return lineItemsFields(collection).reduce((sum, field) => sum + lineItemsPaidTotal(entry.data[field.key]), 0);
}

export function entryTotalDue(collection, entry) {
  return entryGrandTotal(collection, entry) - entryTotalPaid(collection, entry);
}
