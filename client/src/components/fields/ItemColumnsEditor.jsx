const COLUMN_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
];

function newColumn() {
  return { label: '', type: 'text', options: [], required: false, builtin: false };
}

export default function ItemColumnsEditor({ columns, trackPayments, onChangeColumns, onChangeTrackPayments }) {
  const builtins = columns.filter((c) => c.builtin);
  const customs = columns.filter((c) => !c.builtin);

  function updateBuiltinLabel(key, label) {
    onChangeColumns(columns.map((c) => (c.builtin && c.key === key ? { ...c, label } : c)));
  }

  function updateCustom(index, patch) {
    const customIndex = columns.findIndex((c) => c === customs[index]);
    onChangeColumns(columns.map((c, i) => (i === customIndex ? { ...c, ...patch } : c)));
  }

  function addCustom() {
    onChangeColumns([...columns, newColumn()]);
  }

  function removeCustom(index) {
    const target = customs[index];
    onChangeColumns(columns.filter((c) => c !== target));
  }

  return (
    <div className="card stack" style={{ padding: 12 }}>
      <div>
        <label className="field-label">Built-in columns (rename to fit your business)</label>
        <div className="stack" style={{ gap: 6 }}>
          {builtins.map((col) => (
            <div key={col.key} className="row">
              <input
                value={col.label}
                onChange={(e) => updateBuiltinLabel(col.key, e.target.value)}
                style={{ flex: '1 1 200px' }}
              />
              <span className="badge">{col.type}</span>
              <span className="muted" style={{ fontSize: 12 }}>
                used for totals
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">Extra columns (optional, e.g. Unit, Brand, Batch No.)</label>
        <div className="stack" style={{ gap: 6 }}>
          {customs.map((col, index) => (
            <div key={index} className="card" style={{ padding: 10 }}>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <input
                  placeholder="Column label (e.g. Unit)"
                  value={col.label}
                  onChange={(e) => updateCustom(index, { label: e.target.value })}
                  style={{ flex: '1 1 160px' }}
                />
                <select value={col.type} onChange={(e) => updateCustom(index, { type: e.target.value })} style={{ flex: '0 0 130px' }}>
                  {COLUMN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <label className="row" style={{ gap: 4, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={col.required}
                    onChange={(e) => updateCustom(index, { required: e.target.checked })}
                  />
                  Required
                </label>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeCustom(index)}>
                  Remove
                </button>
              </div>
              {col.type === 'dropdown' && (
                <div style={{ marginTop: 8 }}>
                  <input
                    placeholder="Options, comma-separated"
                    value={(col.options || []).join(', ')}
                    onChange={(e) =>
                      updateCustom(index, {
                        options: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-sm" onClick={addCustom}>
            + Add column
          </button>
        </div>
      </div>

      <label className="row" style={{ gap: 6 }}>
        <input type="checkbox" checked={trackPayments} onChange={(e) => onChangeTrackPayments(e.target.checked)} />
        Track payments (show Paid &amp; Due columns)
      </label>
    </div>
  );
}
