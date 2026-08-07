import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { collectionsApi } from '../api/collectionsApi';
import { reportsApi } from '../api/reportsApi';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import { downloadBlob } from '../utils/exportCsv';

function formatNum(n) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function StockReportPage() {
  const [collections, setCollections] = useState(null);
  const [incomingCollectionId, setIncomingCollectionId] = useState('');
  const [outgoingCollectionId, setOutgoingCollectionId] = useState('');
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    collectionsApi.list().then(setCollections).catch(setError);
  }, []);

  const eligibleCollections = useMemo(
    () => (collections || []).filter((c) => c.fields.some((f) => f.type === 'line_items')),
    [collections]
  );

  const totals = useMemo(() => {
    if (!items) return null;
    return items.reduce(
      (acc, it) => ({
        totalPurchaseValue: acc.totalPurchaseValue + it.totalPurchaseValue,
        totalSalesValue: acc.totalSalesValue + it.totalSalesValue,
        currentStockValue: acc.currentStockValue + it.currentStockValue,
      }),
      { totalPurchaseValue: 0, totalSalesValue: 0, currentStockValue: 0 }
    );
  }, [items]);

  async function handleRun() {
    setError(null);
    setLoading(true);
    try {
      const data = await reportsApi.stockReport({ incomingCollectionId, outgoingCollectionId });
      setItems(data.items);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      items.map((it) => ({
        Item: it.description,
        'Total In': it.totalIn,
        'Total Out': it.totalOut,
        'Current Stock': it.currentStock,
        'Purchase Value': it.totalPurchaseValue,
        'Sales Value': it.totalSalesValue,
        'Stock Value': it.currentStockValue,
      }))
    );
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'stock-report.csv');
  }

  if (!collections) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Report</h1>
          <p className="muted">Compare incoming (purchase) and outgoing (sales) invoices to see current stock</p>
        </div>
      </div>

      <ErrorBanner error={error} />

      <div className="card stack" style={{ padding: 20, marginBottom: 20 }}>
        <div className="grid-form">
          <div>
            <label className="field-label">Incoming invoices (purchases)</label>
            <select value={incomingCollectionId} onChange={(e) => setIncomingCollectionId(e.target.value)} style={{ width: '100%' }}>
              <option value="" disabled hidden>
                Select a collection
              </option>
              {eligibleCollections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Outgoing invoices (sales)</label>
            <select value={outgoingCollectionId} onChange={(e) => setOutgoingCollectionId(e.target.value)} style={{ width: '100%' }}>
              <option value="" disabled hidden>
                Select a collection
              </option>
              {eligibleCollections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {eligibleCollections.length === 0 && (
          <p className="muted">
            No collections with a "Line items" field yet. Create an incoming and an outgoing invoice collection first.
          </p>
        )}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={!incomingCollectionId || !outgoingCollectionId || loading}
          >
            {loading ? 'Running…' : 'Run stock report'}
          </button>
        </div>
      </div>

      {items && (
        <>
          <div className="metric-grid">
            <div className="card metric-card">
              <div className="muted">Total purchase value</div>
              <p className="value">{formatNum(totals.totalPurchaseValue)}</p>
            </div>
            <div className="card metric-card">
              <div className="muted">Total sales value</div>
              <p className="value">{formatNum(totals.totalSalesValue)}</p>
            </div>
            <div className="card metric-card">
              <div className="muted">Current stock value</div>
              <p className="value">{formatNum(totals.currentStockValue)}</p>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 10 }}>
            <button className="btn btn-sm" onClick={handleExportCsv} disabled={items.length === 0}>
              Export CSV
            </button>
          </div>

          {items.length === 0 ? (
            <div className="empty-state card">No line items found in either collection yet.</div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Total In</th>
                    <th>Total Out</th>
                    <th>Current Stock</th>
                    <th>Purchase Value</th>
                    <th>Sales Value</th>
                    <th>Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.description}>
                      <td data-label="Item">{it.description}</td>
                      <td data-label="Total In" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNum(it.totalIn)}
                      </td>
                      <td data-label="Total Out" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNum(it.totalOut)}
                      </td>
                      <td
                        data-label="Current Stock"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                          color: it.currentStock < 0 ? 'var(--danger)' : undefined,
                          fontWeight: 600,
                        }}
                      >
                        {formatNum(it.currentStock)}
                      </td>
                      <td data-label="Purchase Value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNum(it.totalPurchaseValue)}
                      </td>
                      <td data-label="Sales Value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNum(it.totalSalesValue)}
                      </td>
                      <td data-label="Stock Value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatNum(it.currentStockValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
