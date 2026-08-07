import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getRows, lineItemsSubtotal, lineItemsDue } from '../../utils/lineItems';

function formatValue(field, value) {
  if (field.type === 'line_items') {
    const rows = getRows(value);
    if (rows.length === 0) return '—';
    const due = lineItemsDue(value);
    return (
      <>
        {rows.length} item{rows.length === 1 ? '' : 's'} · Total {lineItemsSubtotal(rows).toLocaleString()}
        {due > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Due {due.toLocaleString()}</span>
          </>
        )}
      </>
    );
  }
  if (value === null || value === undefined || value === '') return '—';
  if (field.type === 'date') return format(new Date(value), 'yyyy-MM-dd');
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : value;
  if (field.type === 'number') return Number(value).toLocaleString();
  return String(value);
}

export default function EntryTable({ collection, entries, selectedIds, onToggleSelect, onToggleSelectAll, onEdit, onDelete }) {
  const sortedFields = [...collection.fields].sort((a, b) => a.order - b.order);
  const allSelected = entries.length > 0 && entries.every((e) => selectedIds.includes(e._id));
  const hasLineItems = collection.fields.some((f) => f.type === 'line_items');

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: 32 }}>
              <input type="checkbox" checked={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} />
            </th>
            {sortedFields.map((f) => (
              <th key={f.key}>{f.label}</th>
            ))}
            <th style={{ width: 120 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry._id}>
              <td data-label="">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(entry._id)}
                  onChange={(e) => onToggleSelect(entry._id, e.target.checked)}
                />
              </td>
              {sortedFields.map((f) => (
                <td key={f.key} data-label={f.label}>
                  {formatValue(f, entry.data[f.key])}
                </td>
              ))}
              <td data-label="Actions">
                <div className="row">
                  {hasLineItems && (
                    <Link className="btn btn-sm" to={`/collections/${collection._id}/entries/${entry._id}/print`}>
                      Print
                    </Link>
                  )}
                  <button className="btn btn-sm" onClick={() => onEdit(entry)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete(entry)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
