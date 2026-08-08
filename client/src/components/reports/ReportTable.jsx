import { format } from 'date-fns';
import { getRows, lineItemsSubtotal, lineItemsDue } from '../../utils/lineItems';

function formatValue(field, value) {
  if (field.type === 'line_items') {
    const rows = getRows(value);
    if (rows.length === 0) return '—';
    const due = field.trackPayments !== false ? lineItemsDue(value) : 0;
    return `${rows.length} item${rows.length === 1 ? '' : 's'} · Total ${lineItemsSubtotal(rows).toLocaleString()}${due > 0 ? ` · Due ${due.toLocaleString()}` : ''}`;
  }
  if (value === null || value === undefined || value === '') return '—';
  if (field.type === 'date') return format(new Date(value), 'yyyy-MM-dd');
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : value;
  if (field.type === 'number') return Number(value).toLocaleString();
  return String(value);
}

export default function ReportTable({ fields, rows }) {
  if (rows.length === 0) return <div className="empty-state card">No rows match the selected filters.</div>;

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.key}>{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {fields.map((f) => (
                <td key={f.key} data-label={f.label}>
                  {formatValue(f, row.data[f.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
