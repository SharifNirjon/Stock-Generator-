import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collectionsApi } from '../api/collectionsApi';
import FieldSchemaEditor from '../components/fields/FieldSchemaEditor';
import ErrorBanner from '../components/common/ErrorBanner';
import Loader from '../components/common/Loader';

export default function CollectionBuilderPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState({
    companyName: '',
    tagline: '',
    address: '',
    contact: '',
    currencyWord: 'Taka',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasLineItemsField = fields.some((f) => f.type === 'line_items');

  useEffect(() => {
    if (!isEdit) return;
    collectionsApi
      .get(id)
      .then((c) => {
        setName(c.name);
        setDescription(c.description || '');
        setFields(c.fields);
        if (c.invoiceSettings) setInvoiceSettings({ currencyWord: 'Taka', ...c.invoiceSettings });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (fields.length === 0) {
      setError(new Error('Add at least one field'));
      return;
    }

    setSaving(true);
    try {
      const payload = { name, description, fields, invoiceSettings: hasLineItemsField ? invoiceSettings : undefined };
      const collection = isEdit ? await collectionsApi.update(id, payload) : await collectionsApi.create(payload);
      navigate(`/collections/${collection._id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit collection' : 'New collection'}</h1>
      </div>

      <ErrorBanner error={error} />

      <form className="card stack" style={{ padding: 20 }} onSubmit={handleSubmit}>
        <div>
          <label className="field-label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div>
          <label className="field-label">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div>
          <label className="field-label">Fields</label>
          <FieldSchemaEditor fields={fields} onChange={setFields} />
        </div>

        {hasLineItemsField && (
          <div>
            <label className="field-label">Invoice header (for printing)</label>
            <div className="card grid-form" style={{ padding: 12 }}>
              <div>
                <label className="field-label">Company name</label>
                <input
                  value={invoiceSettings.companyName}
                  onChange={(e) => setInvoiceSettings((s) => ({ ...s, companyName: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="field-label">Tagline / description</label>
                <input
                  value={invoiceSettings.tagline}
                  onChange={(e) => setInvoiceSettings((s) => ({ ...s, tagline: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="field-label">Address</label>
                <input
                  value={invoiceSettings.address}
                  onChange={(e) => setInvoiceSettings((s) => ({ ...s, address: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="field-label">Contact (phone / email)</label>
                <input
                  value={invoiceSettings.contact}
                  onChange={(e) => setInvoiceSettings((s) => ({ ...s, contact: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="field-label">Currency word</label>
                <input
                  value={invoiceSettings.currencyWord}
                  onChange={(e) => setInvoiceSettings((s) => ({ ...s, currencyWord: e.target.value }))}
                  placeholder="e.g. Taka"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save collection'}
          </button>
        </div>
      </form>
    </div>
  );
}
