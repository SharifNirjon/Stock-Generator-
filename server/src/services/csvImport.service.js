const { parse } = require('csv-parse/sync');

function parseCsvBuffer(buffer) {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { headers, rows: records };
}

function mapRowToEntryData(row, mapping) {
  const rawData = {};
  for (const [csvColumn, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey) continue;
    rawData[fieldKey] = row[csvColumn];
  }
  return rawData;
}

module.exports = { parseCsvBuffer, mapRowToEntryData };
