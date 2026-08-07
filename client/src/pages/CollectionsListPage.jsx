import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collectionsApi } from '../api/collectionsApi';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function CollectionsListPage() {
  const [collections, setCollections] = useState(null);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const navigate = useNavigate();

  async function load() {
    try {
      setError(null);
      setCollections(await collectionsApi.list());
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    try {
      await collectionsApi.remove(pendingDelete._id);
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
          <h1>Collections</h1>
          <p className="muted">Your custom data tables</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/collections/new')}>
          + New collection
        </button>
      </div>

      <ErrorBanner error={error} />

      {!collections && !error && <Loader />}

      {collections && collections.length === 0 && (
        <div className="empty-state card">
          <p>No collections yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/collections/new')}>
            Create your first collection
          </button>
        </div>
      )}

      {collections && collections.length > 0 && (
        <div className="stack">
          {collections.map((c) => (
            <div key={c._id} className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <Link to={`/collections/${c._id}`} style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
                    {c.name}
                  </Link>
                  {c.description && <p className="muted" style={{ margin: '2px 0 0' }}>{c.description}</p>}
                  <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
                    {c.fields.length} fields · {c.entryCount} entries
                  </p>
                </div>
                <div className="row">
                  <Link className="btn btn-sm" to={`/collections/${c._id}`}>
                    Open
                  </Link>
                  <Link className="btn btn-sm" to={`/collections/${c._id}/edit`}>
                    Edit schema
                  </Link>
                  <button className="btn btn-sm btn-danger" onClick={() => setPendingDelete(c)}>
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
          title="Delete collection"
          message={`Delete "${pendingDelete.name}" and all of its entries? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
