import ItemColumnsEditor from './ItemColumnsEditor';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'tags', label: 'Tags' },
  { value: 'line_items', label: 'Line items (invoice table)' },
];

const DEFAULT_ITEM_COLUMNS = [
  { key: 'description', label: 'Description', type: 'text', required: true, builtin: true },
  { key: 'quantity', label: 'Quantity', type: 'number', required: true, builtin: true },
  { key: 'rate', label: 'Rate', type: 'number', required: true, builtin: true },
];

function newField() {
  return { label: '', type: 'text', options: [], required: false };
}

export default function FieldSchemaEditor({ fields, onChange }) {
  function updateField(index, patch) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function moveField(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addField() {
    onChange([...fields, newField()]);
  }

  return (
    <div className="stack">
      {fields.map((field, index) => (
        <div key={index} className="card" style={{ padding: 12 }}>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <input
              placeholder="Field label (e.g. Amount)"
              value={field.label}
              onChange={(e) => updateField(index, { label: e.target.value })}
              style={{ flex: '1 1 180px' }}
              required
            />
            <select
              value={field.type}
              onChange={(e) => {
                const type = e.target.value;
                const patch = { type };
                if (type === 'line_items' && !field.itemColumns) {
                  patch.itemColumns = DEFAULT_ITEM_COLUMNS.map((c) => ({ ...c }));
                  patch.trackPayments = true;
                }
                updateField(index, patch);
              }}
              style={{ flex: '0 0 140px' }}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="row" style={{ gap: 4, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
              />
              Required
            </label>
            <div className="row" style={{ marginLeft: 'auto' }}>
              <button type="button" className="btn btn-sm" onClick={() => moveField(index, -1)} disabled={index === 0}>
                ↑
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
              >
                ↓
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeField(index)}>
                Remove
              </button>
            </div>
          </div>

          {field.type === 'dropdown' && (
            <div style={{ marginTop: 10 }}>
              <label className="field-label">Options (comma-separated)</label>
              <input
                value={(field.options || []).join(', ')}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                style={{ width: '100%' }}
                placeholder="e.g. Food, Travel, Office"
              />
            </div>
          )}

          {field.type === 'line_items' && (
            <div style={{ marginTop: 10 }}>
              <label className="field-label">Invoice table columns</label>
              <ItemColumnsEditor
                columns={field.itemColumns || DEFAULT_ITEM_COLUMNS}
                trackPayments={field.trackPayments !== false}
                onChangeColumns={(itemColumns) => updateField(index, { itemColumns })}
                onChangeTrackPayments={(trackPayments) => updateField(index, { trackPayments })}
              />
            </div>
          )}
        </div>
      ))}

      <button type="button" className="btn" onClick={addField}>
        + Add field
      </button>
    </div>
  );
}
