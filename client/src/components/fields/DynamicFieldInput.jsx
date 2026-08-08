import { useState } from 'react';

function TagsInput({ value = [], onChange }) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className="row"
      style={{
        flexWrap: 'wrap',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 6,
        background: 'var(--surface)',
        gap: 6,
      }}
    >
      {value.map((tag) => (
        <span key={tag} className="badge" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            aria-label={`Remove ${tag}`}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder="Add tag…"
        style={{ border: 'none', flex: 1, minWidth: 80, padding: 4 }}
      />
    </div>
  );
}

const BUILTIN_COLUMNS_FALLBACK = [
  { key: 'description', label: 'Description', type: 'text', required: true, builtin: true },
  { key: 'quantity', label: 'Quantity', type: 'number', required: true, builtin: true },
  { key: 'rate', label: 'Rate', type: 'number', required: true, builtin: true },
];

function ColumnInput({ column, value, onChange }) {
  if (column.type === 'number') {
    return (
      <input type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }} />
    );
  }
  if (column.type === 'dropdown') {
    return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }}>
        <option value="" disabled hidden>
          Select…
        </option>
        {(column.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={{ width: '100%' }} />;
}

function LineItemsInput({ field, value, onChange }) {
  const columns = field.itemColumns && field.itemColumns.length > 0 ? field.itemColumns : BUILTIN_COLUMNS_FALLBACK;
  const trackPayments = field.trackPayments !== false;
  const rows = Array.isArray(value) ? value : value?.rows || [];

  function updateRow(index, patch) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const blank = {};
    for (const col of columns) blank[col.key] = '';
    if (trackPayments) blank.paid = '';
    onChange([...rows, blank]);
  }

  function removeRow(index) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function rowTotal(row) {
    return Number(row.quantity || 0) * Number(row.rate || 0);
  }

  const subtotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);
  const totalPaid = trackPayments ? rows.reduce((sum, r) => sum + Number(r.paid || 0), 0) : 0;
  const totalDue = subtotal - totalPaid;

  return (
    <div className="card" style={{ padding: 10, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: 32 }}>No.</th>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th style={{ width: 110 }}>Total</th>
            {trackPayments && (
              <>
                <th style={{ width: 100 }}>Paid</th>
                <th style={{ width: 110 }}>Due</th>
              </>
            )}
            <th style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const total = rowTotal(row);
            const due = total - Number(row.paid || 0);
            return (
              <tr key={index}>
                <td>{index + 1}</td>
                {columns.map((col) => (
                  <td key={col.key}>
                    <ColumnInput column={col} value={row[col.key]} onChange={(v) => updateRow(index, { [col.key]: v })} />
                  </td>
                ))}
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</td>
                {trackPayments && (
                  <>
                    <td>
                      <input
                        type="number"
                        step="any"
                        value={row.paid ?? ''}
                        onChange={(e) => updateRow(index, { paid: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: due > 0 ? 'var(--danger)' : 'var(--success)',
                      }}
                    >
                      {due.toLocaleString()}
                    </td>
                  </>
                )}
                <td>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRow(index)}>
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <button type="button" className="btn btn-sm" onClick={addRow}>
          + Add row
        </button>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ fontWeight: 600 }}>Total: {subtotal.toLocaleString()}</div>
          {trackPayments && (
            <>
              <div style={{ fontWeight: 600 }}>Paid: {totalPaid.toLocaleString()}</div>
              <div style={{ fontWeight: 600, color: totalDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                Due: {totalDue.toLocaleString()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DynamicFieldInput({ field, value, onChange }) {
  switch (field.type) {
    case 'line_items':
      return <LineItemsInput field={field} value={value} onChange={onChange} />;
    case 'number':
      return (
        <input
          type="number"
          step="any"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value)}
          required={field.required}
          style={{ width: '100%' }}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={value ? String(value).slice(0, 10) : ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          style={{ width: '100%' }}
        />
      );
    case 'dropdown':
      return (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required} style={{ width: '100%' }}>
          <option value="" disabled hidden>
            Select…
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'tags':
      return <TagsInput value={Array.isArray(value) ? value : []} onChange={onChange} />;
    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          style={{ width: '100%' }}
        />
      );
  }
}
