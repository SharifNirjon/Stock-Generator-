const { FIELD_TYPES } = require('../models/Collection');

function slugify(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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

    return {
      key: uniqueKey,
      label: String(f.label).trim(),
      type: f.type,
      options: f.type === 'dropdown' || f.type === 'tags' ? (f.options || []).map(String) : [],
      required: Boolean(f.required),
      order: Number.isFinite(f.order) ? f.order : index,
      defaultValue: f.defaultValue,
    };
  });
}

function coerceValueForField(field, rawValue) {
  if (field.type === 'line_items') {
    const container = rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue) ? rawValue : { rows: rawValue };
    const rows = Array.isArray(container.rows) ? container.rows : [];
    if (field.required && rows.length === 0) throw new Error(`"${field.label}" needs at least one row`);

    const coercedRows = rows.map((row, index) => {
      const description = String(row.description ?? '').trim();
      const quantity = Number(row.quantity);
      const rate = Number(row.rate);
      if (!description) throw new Error(`"${field.label}" row ${index + 1}: description is required`);
      if (Number.isNaN(quantity)) throw new Error(`"${field.label}" row ${index + 1}: quantity must be a number`);
      if (Number.isNaN(rate)) throw new Error(`"${field.label}" row ${index + 1}: rate must be a number`);
      return { description, quantity, rate, total: quantity * rate };
    });

    const paidAmount = Number(container.paidAmount) || 0;
    return { rows: coercedRows, paidAmount };
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

module.exports = { slugify, normalizeFields, validateAndCoerceEntryData, buildSearchText };
