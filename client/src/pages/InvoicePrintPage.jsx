import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { collectionsApi } from '../api/collectionsApi';
import { entriesApi } from '../api/entriesApi';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import { lineItemsFields, getRows, lineItemsSubtotal, lineItemsPaidTotal } from '../utils/lineItems';
import { amountInWords } from '../utils/amountInWords';
import { exportElementToPdf } from '../utils/exportPdf';

const BUILTIN_COLUMNS_FALLBACK = [
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'rate', label: 'Rate' },
];

function formatCellValue(row, column) {
  const value = row[column.key];
  if (value === null || value === undefined || value === '') return '';
  if (column.type === 'number') return Number(value).toLocaleString();
  return String(value);
}

function formatHeaderValue(field, value) {
  if (value === null || value === undefined || value === '') return '';
  if (field.type === 'date') return format(new Date(value), 'dd.MM.yyyy');
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : value;
  if (field.type === 'number') return Number(value).toLocaleString();
  return String(value);
}

export default function InvoicePrintPage() {
  const { id, entryId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);
  const printRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([collectionsApi.get(id), entriesApi.get(id, entryId)])
      .then(([c, e]) => {
        setCollection(c);
        setEntry(e);
      })
      .catch(setError);
  }, [id, entryId]);

  if (error) return <ErrorBanner error={error} />;
  if (!collection || !entry) return <Loader />;

  const headerFields = [...collection.fields]
    .filter((f) => f.type !== 'line_items')
    .sort((a, b) => a.order - b.order);

  const itemFields = lineItemsFields(collection);
  const primaryItemField = itemFields[0];
  const columns = primaryItemField?.itemColumns?.length ? primaryItemField.itemColumns : BUILTIN_COLUMNS_FALLBACK;
  const trackPayments = primaryItemField ? primaryItemField.trackPayments !== false : true;
  const totalColumnCount = 1 + columns.length + 1 + (trackPayments ? 2 : 0);

  const rows = itemFields.flatMap((f) => getRows(entry.data[f.key]));
  const grandTotal = itemFields.reduce((sum, f) => sum + lineItemsSubtotal(getRows(entry.data[f.key])), 0);
  const paidAmount = itemFields.reduce((sum, f) => sum + lineItemsPaidTotal(entry.data[f.key]), 0);
  const dueAmount = grandTotal - paidAmount;

  const settings = collection.invoiceSettings || {};
  const companyName = settings.companyName || collection.name;
  const currencyWord = settings.currencyWord || 'Taka';

  async function handleDownloadPdf() {
    setExporting(true);
    try {
      await exportElementToPdf(printRef.current, `${companyName}-invoice.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 24 }}>
      <div className="row no-print" style={{ justifyContent: 'space-between', maxWidth: 780, margin: '0 auto 16px' }}>
        <button className="btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="row">
          <button className="btn" onClick={handleDownloadPdf} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Download PDF'}
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div
        ref={printRef}
        className="invoice-sheet"
        style={{
          background: '#ffffff',
          color: '#000000',
          maxWidth: 780,
          margin: '0 auto',
          padding: 40,
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ color: '#9c1f5e', fontStyle: 'italic', fontSize: 34, margin: 0 }}>{companyName}</h1>
          {settings.tagline && <p style={{ fontSize: 11, fontWeight: 'bold', margin: '8px 0 2px' }}>{settings.tagline}</p>}
          {(settings.address || settings.contact) && (
            <p style={{ fontSize: 11, fontWeight: 'bold', margin: 0 }}>
              {[settings.address, settings.contact].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 18, margin: '16px 0' }}>BILL</h2>

        <div className="stack" style={{ gap: 6, marginBottom: 20 }}>
          {headerFields.map((f) => (
            <div key={f.key} className="row" style={{ gap: 6 }}>
              <strong>{f.label}:</strong>
              <span style={{ borderBottom: '1px solid #000', flex: 1, paddingBottom: 1 }}>
                {formatHeaderValue(f, entry.data[f.key])}
              </span>
            </div>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              {['No.', ...columns.map((c) => c.label), 'Total', ...(trackPayments ? ['Paid', 'Due'] : [])].map((h, i) => (
                <th key={i} style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 13 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowDue = Number(row.total) - Number(row.paid || 0);
              return (
                <tr key={i}>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 13 }}>{i + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 13 }}>
                      {formatCellValue(row, col)}
                    </td>
                  ))}
                  <td style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 13 }}>
                    {Number(row.total).toLocaleString()}
                  </td>
                  {trackPayments && (
                    <>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', fontSize: 13 }}>
                        {Number(row.paid || 0).toLocaleString()}
                      </td>
                      <td
                        style={{
                          border: '1px solid #000',
                          padding: '6px 8px',
                          fontSize: 13,
                          color: rowDue > 0 ? '#b91c1c' : undefined,
                        }}
                      >
                        {rowDue.toLocaleString()}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            <tr>
              <td
                colSpan={totalColumnCount - 1}
                style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', textAlign: 'right' }}
              >
                Amount Total =
              </td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>
                {grandTotal.toLocaleString()}/=
              </td>
            </tr>
            {trackPayments && (
              <>
                <tr>
                  <td colSpan={totalColumnCount - 1} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>
                    Paid =
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{paidAmount.toLocaleString()}/=</td>
                </tr>
                <tr>
                  <td
                    colSpan={totalColumnCount - 1}
                    style={{
                      border: '1px solid #000',
                      padding: '6px 8px',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      color: dueAmount > 0 ? '#b91c1c' : undefined,
                    }}
                  >
                    Due =
                  </td>
                  <td
                    style={{
                      border: '1px solid #000',
                      padding: '6px 8px',
                      fontWeight: 'bold',
                      color: dueAmount > 0 ? '#b91c1c' : undefined,
                    }}
                  >
                    {dueAmount.toLocaleString()}/=
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <p style={{ borderBottom: '1px solid #000', display: 'inline-block', paddingBottom: 2, fontSize: 13 }}>
          {currencyWord} in Word: {amountInWords(grandTotal, currencyWord)}.
        </p>
        {trackPayments && dueAmount > 0 && (
          <p style={{ fontSize: 13, fontWeight: 'bold', color: '#b91c1c', marginTop: 6 }}>
            Due in Word: {amountInWords(dueAmount, currencyWord)}.
          </p>
        )}

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 80 }}>
          <div style={{ textAlign: 'center', borderTop: '1px solid #000', paddingTop: 4, minWidth: 180 }}>
            Receivers Signature
          </div>
          <div style={{ textAlign: 'center', borderTop: '1px solid #000', paddingTop: 4, minWidth: 180 }}>
            For-{companyName}
          </div>
        </div>
      </div>
    </div>
  );
}
