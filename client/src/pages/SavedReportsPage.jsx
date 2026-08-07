import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../api/reportsApi';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function SavedReportsPage() {
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  function load() {
    reportsApi.listTemplates().then(setTemplates).catch(setError);
  }

  useEffect(load, []);

  async function handleDelete() {
    try {
      await reportsApi.deleteTemplate(pendingDelete._id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(err);
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Saved Reports</h1>
          <p className="muted">Reusable report templates</p>
        </div>
        <Link className="btn btn-primary" to="/reports/new">
          + New report
        </Link>
      </div>

      <ErrorBanner error={error} />

      {!templates && !error && <Loader />}

      {templates && templates.length === 0 && (
        <div className="empty-state card">No saved report templates yet.</div>
      )}

      {templates && templates.length > 0 && (
        <div className="stack">
          {templates.map((t) => (
            <div key={t._id} className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                    {t.chartType} · {t.aggregation}
                    {t.groupByField ? ` by ${t.groupByField}` : ''}
                  </p>
                </div>
                <div className="row">
                  <Link className="btn btn-sm" to={`/reports/templates/${t._id}`}>
                    Open
                  </Link>
                  <button className="btn btn-sm btn-danger" onClick={() => setPendingDelete(t)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete template"
          message={`Delete report template "${pendingDelete.name}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
