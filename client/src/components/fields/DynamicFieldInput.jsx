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

function LineItemsInput({ value, onChange }) {
  const rows = value?.rows || [];
  const paidAmount = value?.paidAmount ?? '';

  function updateRows(nextRows) {
    onChange({ ...value, rows: nextRows });
  }

  function updateRow(index, patch) {
    updateRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    updateRows([...rows, { description: '', quantity: '', rate: '' }]);
  }

  function removeRow(index) {
    updateRows(rows.filter((_, i) => i !== index));
  }

  function updatePaidAmount(next) {
    onChange({ ...value, paidAmount: next });
  }

  const subtotal = rows.reduce((sum, r) => sum + Number(r.quantity || 0) * Number(r.rate || 0), 0);
  const due = subtotal - Number(paidAmount || 0);

  return (
    <div className="card" style={{ padding: 10, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: 32 }}>No.</th>
            <th>Description</th>
            <th style={{ width: 100 }}>Quantity</th>
            <th style={{ width: 120 }}>Rate</th>
            <th style={{ width: 120 }}>Total</th>
            <th style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  value={row.description ?? ''}
                  onChange={(e) => updateRow(index, { description: e.target.value })}
                  style={{ width: '100%' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="any"
                  value={row.quantity ?? ''}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  style={{ width: '100%' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="any"
                  value={row.rate ?? ''}
                  onChange={(e) => updateRow(index, { rate: e.target.value })}
                  style={{ width: '100%' }}
                />
              </td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                {(Number(row.quantity || 0) * Number(row.rate || 0)).toLocaleString()}
              </td>
              <td>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRow(index)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <button type="button" className="btn btn-sm" onClick={addRow}>
          + Add row
        </button>
        <div style={{ fontWeight: 600 }}>Subtotal: {subtotal.toLocaleString()}</div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', gap: 16, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <div className="row" style={{ gap: 6 }}>
          <label className="field-label" style={{ margin: 0 }}>
            Paid amount
          </label>
          <input
            type="number"
            step="any"
            value={paidAmount}
            onChange={(e) => updatePaidAmount(e.target.value)}
            style={{ width: 140 }}
          />
        </div>
        <div style={{ fontWeight: 600, color: due > 0 ? 'var(--danger)' : 'var(--success)' }}>
          Due: {due.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default function DynamicFieldInput({ field, value, onChange }) {
  switch (field.type) {
    case 'line_items':
      return <LineItemsInput value={value} onChange={onChange} />;
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
