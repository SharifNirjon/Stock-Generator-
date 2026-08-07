import { useState } from 'react';
import Modal from '../common/Modal';
import ErrorBanner from '../common/ErrorBanner';
import DynamicFieldInput from '../fields/DynamicFieldInput';

export default function EntryFormModal({ collection, entry, onSave, onClose }) {
  const sortedFields = [...collection.fields].sort((a, b) => a.order - b.order);
  const [values, setValues] = useState(() => {
    const initial = {};
    for (const f of sortedFields) {
      if (f.type === 'line_items') {
        initial[f.key] = entry?.data?.[f.key] ?? { rows: [], paidAmount: '' };
      } else {
        initial[f.key] = entry?.data?.[f.key] ?? (f.type === 'tags' ? [] : '');
      }
    }
    return initial;
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(values);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={entry ? 'Edit entry' : 'New entry'} onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} className="stack">
        <ErrorBanner error={error} />
        {sortedFields.map((field) => (
          <div key={field.key}>
            <label className="field-label">
              {field.label}
              {field.required && ' *'}
            </label>
            <DynamicFieldInput
              field={field}
              value={values[field.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
            />
          </div>
        ))}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
