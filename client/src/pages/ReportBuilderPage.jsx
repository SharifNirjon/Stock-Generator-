import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collectionsApi } from '../api/collectionsApi';
import { reportsApi } from '../api/reportsApi';
import ErrorBanner from '../components/common/ErrorBanner';
import Loader from '../components/common/Loader';
import FilterPanel from '../components/reports/FilterPanel';
import StatsSummaryCards from '../components/reports/StatsSummaryCards';
import ChartRenderer from '../components/reports/ChartRenderer';
import ReportTable from '../components/reports/ReportTable';
import SaveTemplateDialog from '../components/reports/SaveTemplateDialog';
import { downloadBlob } from '../utils/exportCsv';
import { exportElementToPdf } from '../utils/exportPdf';

const CHART_TYPES = ['bar', 'line', 'pie', 'table'];
const AGGREGATIONS = ['count', 'sum', 'avg', 'min', 'max'];

export default function ReportBuilderPage() {
  const { id: templateId } = useParams();
  const [searchParams] = useSearchParams();

  const [collections, setCollections] = useState(null);
  const [collectionId, setCollectionId] = useState(searchParams.get('collectionId') || '');
  const [filters, setFilters] = useState([]);
  const [groupByField, setGroupByField] = useState('');
  const [metricField, setMetricField] = useState('');
  const [aggregation, setAggregation] = useState('count');
  const [chartType, setChartType] = useState('bar');

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  const reportSectionRef = useRef(null);

  useEffect(() => {
    collectionsApi.list().then(setCollections).catch(setError);
  }, []);

  useEffect(() => {
    if (!templateId) return;
    reportsApi.getTemplate(templateId).then((template) => {
      setTemplateName(template.name);
      setCollectionId(template.collection);
      setFilters(template.filters || []);
      setGroupByField(template.groupByField || '');
      setMetricField(template.metricField || '');
      setAggregation(template.aggregation || 'count');
      setChartType(template.chartType || 'bar');
    });
  }, [templateId]);

  const collection = useMemo(() => collections?.find((c) => c._id === collectionId), [collections, collectionId]);
  const fields = collection?.fields || [];
  const dropdownFields = fields.filter((f) => f.type === 'dropdown' || f.type === 'tags');
  const numberFields = fields.filter((f) => f.type === 'number');

  function buildConfig() {
    return {
      collectionId,
      filters: filters.filter((f) => f.fieldKey),
      groupByField: groupByField || undefined,
      metricField: metricField || undefined,
      aggregation,
      selectedFields: fields.map((f) => f.key),
    };
  }

  async function handleRun() {
    if (!collectionId) return;
    setError(null);
    setLoading(true);
    try {
      const data = await reportsApi.run(buildConfig());
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTemplate(name) {
    const { collectionId, ...rest } = buildConfig();
    await reportsApi.saveTemplate({ ...rest, collection: collectionId, name, chartType });
    setShowSaveDialog(false);
  }

  async function handleExportCsv() {
    try {
      const blob = await reportsApi.exportCsv(buildConfig());
      downloadBlob(blob, `${collection?.name || 'report'}.csv`);
    } catch (err) {
      setError(err);
    }
  }

  async function handleExportPdf() {
    if (!reportSectionRef.current) return;
    setExportingPdf(true);
    try {
      await exportElementToPdf(reportSectionRef.current, `${collection?.name || 'report'}.pdf`, collection?.name);
    } catch (err) {
      setError(err);
    } finally {
      setExportingPdf(false);
    }
  }

  if (!collections) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <h1>Report Builder</h1>
      </div>

      <ErrorBanner error={error} />

      <div className="card stack" style={{ padding: 20, marginBottom: 20 }}>
        <div className="grid-form">
          <div>
            <label className="field-label">Collection</label>
            <select value={collectionId} onChange={(e) => { setCollectionId(e.target.value); setResult(null); }} style={{ width: '100%' }}>
              <option value="" disabled hidden>
                Select a collection
              </option>
              {collections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Chart type</label>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ width: '100%' }}>
              {CHART_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Group by (category)</label>
            <select value={groupByField} onChange={(e) => setGroupByField(e.target.value)} style={{ width: '100%' }} disabled={!collection}>
              <option value="">None</option>
              {dropdownFields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Aggregation</label>
            <select value={aggregation} onChange={(e) => setAggregation(e.target.value)} style={{ width: '100%' }}>
              {AGGREGATIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {aggregation !== 'count' && (
            <div>
              <label className="field-label">Metric field (numeric)</label>
              <select value={metricField} onChange={(e) => setMetricField(e.target.value)} style={{ width: '100%' }} disabled={!collection}>
                <option value="" disabled hidden>
                  Select a numeric field
                </option>
                {numberFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {collection && (
          <div>
            <label className="field-label">Filters</label>
            <FilterPanel fields={fields} filters={filters} onChange={setFilters} />
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleRun} disabled={!collectionId || loading}>
            {loading ? 'Running…' : 'Run report'}
          </button>
        </div>
      </div>

      {result && (
        <div ref={reportSectionRef}>
          <StatsSummaryCards stats={result.stats} hasMetric={Boolean(metricField)} />
          {groupByField ? (
            <ChartRenderer chartType={chartType} data={result.chartData} />
          ) : (
            <p className="muted">Pick a "Group by" field to see a chart. Showing raw filtered rows below.</p>
          )}
          <div style={{ marginTop: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Detail rows ({result.tableRows.length})</h3>
              <div className="row">
                <button className="btn btn-sm" onClick={() => setShowSaveDialog(true)}>
                  Save as template
                </button>
                <button className="btn btn-sm" onClick={handleExportCsv}>
                  Export CSV
                </button>
                <button className="btn btn-sm" onClick={handleExportPdf} disabled={exportingPdf}>
                  {exportingPdf ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
            </div>
            <ReportTable fields={fields} rows={result.tableRows} />
          </div>
        </div>
      )}

      {showSaveDialog && (
        <SaveTemplateDialog initialName={templateName} onSave={handleSaveTemplate} onClose={() => setShowSaveDialog(false)} />
      )}
    </div>
  );
}
