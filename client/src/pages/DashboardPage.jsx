import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { dashboardApi } from '../api/dashboardApi';
import Loader from '../components/common/Loader';
import ErrorBanner from '../components/common/ErrorBanner';
import ChartRenderer from '../components/reports/ChartRenderer';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function formatSummaryValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) return format(new Date(value), 'yyyy-MM-dd');
  return value;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardApi.summary().then(setSummary).catch(setError);
  }, []);

  if (error) return <ErrorBanner error={error} />;
  if (!summary) return <Loader />;

  const chartData = summary.entriesPerCollection.map((c) => ({ label: c.name, value: c.count }));

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="metric-grid">
        <div className="card metric-card">
          <div className="muted">Collections</div>
          <p className="value">{summary.totalCollections}</p>
        </div>
        <div className="card metric-card">
          <div className="muted">Total entries</div>
          <p className="value">{summary.totalEntries}</p>
        </div>
      </div>

      {summary.entriesPerCollection.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Entries per collection</h3>
          <ChartRenderer chartType="bar" data={chartData} />
        </div>
      )}

      <div>
        <h3>Recent entries</h3>
        {summary.recentEntries.length === 0 ? (
          <div className="empty-state card">No entries yet. Create a collection to get started.</div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Summary</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td data-label="Collection">
                      <Link to={`/collections/${entry.collection?._id}`}>{entry.collection?.name}</Link>
                    </td>
                    <td data-label="Summary">
                      {Object.values(entry.data)
                        .filter(Boolean)
                        .slice(0, 3)
                        .map(formatSummaryValue)
                        .join(' · ')}
                    </td>
                    <td data-label="Added">{format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
