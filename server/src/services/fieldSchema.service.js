const { FIELD_TYPES, ITEM_COLUMN_TYPES } = require('../models/Collection');

const BUILTIN_ITEM_COLUMNS = [
  { key: 'description', label: 'Description', type: 'text', required: true },
  { key: 'quantity', label: 'Quantity', type: 'number', required: true },
  { key: 'rate', label: 'Rate', type: 'number', required: true },
];

function slugify(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeItemColumns(rawColumns) {
  const raw = Array.isArray(rawColumns) ? rawColumns : [];

  const builtins = BUILTIN_ITEM_COLUMNS.map((builtin) => {
    const override = raw.find((c) => c.key === builtin.key || (c.builtin && c.label && slugify(c.label) === builtin.key));
    return {
      ...builtin,
      label: override?.label?.trim() ? override.label.trim() : builtin.label,
      builtin: true,
    };
  });

  const usedKeys = new Set(builtins.map((b) => b.key));
  const customRaw = raw.filter((c) => !c.builtin && !BUILTIN_ITEM_COLUMNS.some((b) => b.key === c.key));

  const customs = customRaw.map((c, index) => {
    if (!c.label || !String(c.label).trim()) {
      throw new Error(`Item column at index ${index + 1} is missing a label`);
    }
    if (!ITEM_COLUMN_TYPES.includes(c.type)) {
      throw new Error(`Item column "${c.label}" has invalid type "${c.type}"`);
    }
    let key = slugify(c.label);
    if (!key) key = `column_${index}`;
    let uniqueKey = key;
    let suffix = 1;
    while (usedKeys.has(uniqueKey)) {
      uniqueKey = `${key}_${suffix}`;
      suffix += 1;
    }
    usedKeys.add(uniqueKey);

    return {
      key: uniqueKey,
      label: String(c.label).trim(),
      type: c.type,
      options: c.type === 'dropdown' ? (c.options || []).map(String) : [],
      required: Boolean(c.required),
      builtin: false,
    };
  });

  return [...builtins, ...customs];
}

function normalizeFields(rawFields) {
  if (!Array.isArray(rawFields)) return [];
  const usedKeys = new Set();

  return rawFields.map((f, index) => {
    if (!f.label || !String(f.label).trim()) {
      throw new Error(`Field at index ${index} is missing a label`);
    }
    if (!FIELD_TYPES.includes(f.type)) {
      throw new Error(`Field "${f.label}" has invalid type "${f.type}"`);
    }

    let key = f.key ? slugify(f.key) : slugify(f.label);
    if (!key) key = `field_${index}`;
    let uniqueKey = key;
    let suffix = 1;
    while (usedKeys.has(uniqueKey)) {
      uniqueKey = `${key}_${suffix}`;
      suffix += 1;
    }
    usedKeys.add(uniqueKey);

    const base = {
      key: uniqueKey,
      label: String(f.label).trim(),
      type: f.type,
      options: f.type === 'dropdown' || f.type === 'tags' ? (f.options || []).map(String) : [],
      required: Boolean(f.required),
      order: Number.isFinite(f.order) ? f.order : index,
      defaultValue: f.defaultValue,
    };

    if (f.type === 'line_items') {
      base.itemColumns = normalizeItemColumns(f.itemColumns);
      base.trackPayments = f.trackPayments !== false;
    }

    return base;
  });
}

function coerceItemColumnValue(column, rawValue, fieldLabel, rowIndex) {
  const isEmpty = rawValue === undefined || rawValue === null || rawValue === '';

  if (isEmpty) {
    if (column.required) throw new Error(`"${fieldLabel}" row ${rowIndex + 1}: ${column.label} is required`);
    return column.type === 'number' ? 0 : '';
  }

  if (column.type === 'number') {
    const n = Number(rawValue);
    if (Number.isNaN(n)) throw new Error(`"${fieldLabel}" row ${rowIndex + 1}: ${column.label} must be a number`);
    return n;
  }

  if (column.type === 'dropdown') {
    const val = String(rawValue);
    if (column.options.length > 0 && !column.options.includes(val)) {
      throw new Error(`"${fieldLabel}" row ${rowIndex + 1}: ${column.label} must be one of: ${column.options.join(', ')}`);
    }
    return val;
  }

  return String(rawValue);
}

function coerceValueForField(field, rawValue) {
  if (field.type === 'line_items') {
    const rows = Array.isArray(rawValue) ? rawValue : rawValue?.rows || [];
    if (field.required && rows.length === 0) throw new Error(`"${field.label}" needs at least one row`);

    const columns = field.itemColumns && field.itemColumns.length > 0 ? field.itemColumns : BUILTIN_ITEM_COLUMNS;
    const trackPayments = field.trackPayments !== false;

    return rows.map((row, index) => {
      const coerced = {};
      for (const column of columns) {
        coerced[column.key] = coerceItemColumnValue(column, row[column.key], field.label, index);
      }

      const quantity = Number(coerced.quantity) || 0;
      const rate = Number(coerced.rate) || 0;
      coerced.total = quantity * rate;

      if (trackPayments) {
        const paid = Number(row.paid) || 0;
        coerced.paid = paid;
        coerced.due = coerced.total - paid;
      }

      return coerced;
    });
  }

  const isEmpty = rawValue === undefined || rawValue === null || rawValue === '';

  if (isEmpty) {
    if (field.required) throw new Error(`"${field.label}" is required`);
    if (field.type === 'tags') return [];
    return field.defaultValue !== undefined ? field.defaultValue : null;
  }

  switch (field.type) {
    case 'text': {
      return String(rawValue);
    }
    case 'number': {
      const n = Number(rawValue);
      if (Number.isNaN(n)) throw new Error(`"${field.label}" must be a number`);
      return n;
    }
    case 'date': {
      const d = new Date(rawValue);
      if (Number.isNaN(d.getTime())) throw new Error(`"${field.label}" must be a valid date`);
      return d;
    }
    case 'dropdown': {
      const val = String(rawValue);
      if (field.options.length > 0 && !field.options.includes(val)) {
        throw new Error(`"${field.label}" must be one of: ${field.options.join(', ')}`);
      }
      return val;
    }
    case 'tags': {
      const arr = Array.isArray(rawValue)
        ? rawValue
        : String(rawValue)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
      return arr.map(String);
    }
    default:
      return rawValue;
  }
}

function validateAndCoerceEntryData(collection, rawData = {}) {
  const errors = [];
  const data = {};

  for (const field of collection.fields) {
    try {
      data[field.key] = coerceValueForField(field, rawData[field.key]);
    } catch (err) {
      errors.push({ field: field.key, message: err.message });
    }
  }

  return { data, errors };
}

function buildSearchText(collection, data) {
  const textLikeKeys = collection.fields
    .filter((f) => f.type === 'text' || f.type === 'tags' || f.type === 'dropdown')
    .map((f) => f.key);

  return textLikeKeys
    .map((key) => {
      const value = data[key];
      if (Array.isArray(value)) return value.join(' ');
      return value ?? '';
    })
    .join(' ')
    .toLowerCase();
}

module.exports = {
  slugify,
  normalizeFields,
  normalizeItemColumns,
  validateAndCoerceEntryData,
  buildSearchText,
  BUILTIN_ITEM_COLUMNS,
};
