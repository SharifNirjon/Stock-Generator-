import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collectionsApi } from '../api/collectionsApi';
import { entriesApi } from '../api/entriesApi';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/entries/SearchBar';
import EntryTable from '../components/entries/EntryTable';
import EntryFormModal from '../components/entries/EntryFormModal';
import CsvImportModal from '../components/entries/CsvImportModal';

export default function CollectionDetailPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingEntry, setEditingEntry] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      setError(null);
      const data = await entriesApi.list(id, { page, search });
      setEntries(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err);
    }
  }, [id, page, search]);

  useEffect(() => {
    setLoading(true);
    collectionsApi
      .get(id)
      .then(setCollection)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (collection) loadEntries();
  }, [collection, loadEntries]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function toggleSelect(entryId, checked) {
    setSelectedIds((prev) => (checked ? [...prev, entryId] : prev.filter((i) => i !== entryId)));
  }

  function toggleSelectAll(checked) {
    setSelectedIds(checked ? entries.map((e) => e._id) : []);
  }

  async function handleCreate(values) {
    await entriesApi.create(id, values);
    setShowCreateModal(false);
    loadEntries();
  }

  async function handleUpdate(values) {
    await entriesApi.update(id, editingEntry._id, values);
    setEditingEntry(null);
    loadEntries();
  }

  async function handleDelete() {
    await entriesApi.remove(id, pendingDelete._id);
    setPendingDelete(null);
    loadEntries();
  }

  async function handleBulkDelete() {
    await entriesApi.bulkDelete(id, selectedIds);
    setSelectedIds([]);
    setPendingBulkDelete(false);
    loadEntries();
  }

  if (loading) return <Loader />;
  if (!collection) return <ErrorBanner error={error} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{collection.name}</h1>
          <p className="muted">
            {total} entries · <Link to={`/collections/${id}/edit`}>Edit schema</Link>
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setShowImportModal(true)}>
            Import CSV
          </button>
          <Link className="btn" to={`/reports/new?collectionId=${id}`}>
            Build report
          </Link>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + New entry
          </button>
        </div>
      </div>

      <ErrorBanner error={error} />

      <div className="row" style={{ marginBottom: 14, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} />
        {selectedIds.length > 0 && (
          <button className="btn btn-sm btn-danger" onClick={() => setPendingBulkDelete(true)}>
            Delete {selectedIds.length} selected
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="empty-state card">No entries yet. Add one or import a CSV.</div>
      ) : (
        <EntryTable
          collection={collection}
          entries={entries}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={setEditingEntry}
          onDelete={setPendingDelete}
        />
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />

      {showCreateModal && (
        <EntryFormModal collection={collection} onSave={handleCreate} onClose={() => setShowCreateModal(false)} />
      )}
      {editingEntry && (
        <EntryFormModal
          collection={collection}
          entry={editingEntry}
          onSave={handleUpdate}
          onClose={() => setEditingEntry(null)}
        />
      )}
      {showImportModal && (
        <CsvImportModal
          collection={collection}
          onClose={() => setShowImportModal(false)}
          onImported={loadEntries}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete entry"
          message="This entry will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {pendingBulkDelete && (
        <ConfirmDialog
          title="Delete selected entries"
          message={`Delete ${selectedIds.length} selected entries? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleBulkDelete}
          onCancel={() => setPendingBulkDelete(false)}
        />
      )}
    </div>
  );
}
