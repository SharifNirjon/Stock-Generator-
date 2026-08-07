import { useState } from 'react';
import Modal from '../common/Modal';
import ErrorBanner from '../common/ErrorBanner';
import { entriesApi } from '../../api/entriesApi';

export default function CsvImportModal({ collection, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const data = await entriesApi.previewImport(collection._id, f);
      setPreview(data);
      const autoMapping = {};
      for (const header of data.headers) {
        const match = collection.fields.find(
          (field) => field.label.toLowerCase() === header.toLowerCase() || field.key === header.toLowerCase()
        );
        if (match) autoMapping[header] = match.key;
      }
      setMapping(autoMapping);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setError(null);
    setBusy(true);
    try {
      const data = await entriesApi.importCsv(collection._id, file, mapping);
      setResult(data);
      onImported();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Bulk import from CSV" onClose={onClose} width={620}>
      <div className="stack">
        <ErrorBanner error={error} />

        <div>
          <label className="field-label">CSV file</label>
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        </div>

        {preview && (
          <>
            <p className="muted" style={{ fontSize: 13 }}>
              {preview.rowCount} rows detected. Map each CSV column to a field:
            </p>
            <div className="stack">
              {preview.headers.map((header) => (
                <div key={header} className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{header}</span>
                  <span className="muted">→</span>
                  <select
                    value={mapping[header] || ''}
                    onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                    style={{ flex: 1 }}
                  >
                    <option value="">Ignore this column</option>
                    {collection.fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {result && (
              <div className="card" style={{ padding: 10, fontSize: 13 }}>
                Imported {result.insertedCount} rows. {result.errorCount > 0 && `${result.errorCount} rows failed.`}
                {result.errors?.slice(0, 5).map((e) => (
                  <div key={e.row} className="muted">
                    Row {e.row}: {e.messages.join(', ')}
                  </div>
                ))}
              </div>
            )}

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleImport} disabled={busy}>
                {busy ? 'Importing…' : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
