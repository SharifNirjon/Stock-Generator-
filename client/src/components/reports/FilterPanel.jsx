const OPERATORS_BY_TYPE = {
  text: [{ value: 'contains', label: 'contains' }],
  number: [
    { value: 'eq', label: '=' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'between', label: 'between' },
  ],
  date: [
    { value: 'between', label: 'between' },
    { value: 'gte', label: 'on/after' },
    { value: 'lte', label: 'on/before' },
  ],
  dropdown: [
    { value: 'eq', label: 'is' },
    { value: 'in', label: 'is one of' },
  ],
  tags: [{ value: 'contains', label: 'contains' }],
};

function emptyFilter(fields) {
  const field = fields[0];
  return { fieldKey: field?.key || '', operator: OPERATORS_BY_TYPE[field?.type]?.[0]?.value || 'eq', value: '' };
}

function ValueInput({ field, filter, onChange }) {
  if (!field) return null;

  if (filter.operator === 'between') {
    const range = filter.value && typeof filter.value === 'object' ? filter.value : {};
    const type = field.type === 'date' ? 'date' : 'number';
    return (
      <div className="row">
        <input
          type={type}
          value={range.from ?? ''}
          onChange={(e) => onChange({ ...range, from: e.target.value })}
          placeholder="From"
        />
        <input
          type={type}
          value={range.to ?? ''}
          onChange={(e) => onChange({ ...range, to: e.target.value })}
          placeholder="To"
        />
      </div>
    );
  }

  if (field.type === 'dropdown' && filter.operator === 'in') {
    const selected = Array.isArray(filter.value) ? filter.value : [];
    return (
      <select
        multiple
        value={selected}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
      >
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'dropdown') {
    return (
      <select value={filter.value ?? ''} onChange={(e) => onChange(e.target.value)}>
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
  }

  if (field.type === 'date') {
    return <input type="date" value={filter.value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={filter.value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function FilterPanel({ fields, filters, onChange }) {
  function updateFilter(index, patch) {
    onChange(filters.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeFilter(index) {
    onChange(filters.filter((_, i) => i !== index));
  }

  function addFilter() {
    onChange([...filters, emptyFilter(fields)]);
  }

  return (
    <div className="stack">
      {filters.map((filter, index) => {
        const field = fields.find((f) => f.key === filter.fieldKey);
        const operators = OPERATORS_BY_TYPE[field?.type] || [];
        return (
          <div key={index} className="row" style={{ flexWrap: 'wrap' }}>
            <select
              value={filter.fieldKey}
              onChange={(e) => {
                const nextField = fields.find((f) => f.key === e.target.value);
                updateFilter(index, {
                  fieldKey: e.target.value,
                  operator: OPERATORS_BY_TYPE[nextField?.type]?.[0]?.value || 'eq',
                  value: '',
                });
              }}
            >
              {fields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <select value={filter.operator} onChange={(e) => updateFilter(index, { operator: e.target.value, value: '' })}>
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <ValueInput field={field} filter={filter} onChange={(value) => updateFilter(index, { value })} />
            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFilter(index)}>
              Remove
            </button>
          </div>
        );
      })}
      <button type="button" className="btn btn-sm" onClick={addFilter} disabled={fields.length === 0}>
        + Add filter
      </button>
    </div>
  );
}
