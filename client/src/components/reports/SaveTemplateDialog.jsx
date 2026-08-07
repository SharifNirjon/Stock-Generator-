import { useState } from 'react';
import Modal from '../common/Modal';
import ErrorBanner from '../common/ErrorBanner';

export default function SaveTemplateDialog({ initialName, onSave, onClose }) {
  const [name, setName] = useState(initialName || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(name);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Save report template" onClose={onClose} width={420}>
      <form onSubmit={handleSubmit} className="stack">
        <ErrorBanner error={error} />
        <div>
          <label className="field-label">Template name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} autoFocus />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
