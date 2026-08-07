function formatNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function StatsSummaryCards({ stats, hasMetric }) {
  const cards = [
    { label: 'Count', value: formatNum(stats.count) },
    ...(hasMetric
      ? [
          { label: 'Sum', value: formatNum(stats.sum) },
          { label: 'Average', value: formatNum(stats.avg) },
          { label: 'Min', value: formatNum(stats.min) },
          { label: 'Max', value: formatNum(stats.max) },
        ]
      : []),
  ];

  return (
    <div className="metric-grid" style={{ marginBottom: 18 }}>
      {cards.map((c) => (
        <div key={c.label} className="card metric-card">
          <div className="muted" style={{ fontSize: 13 }}>
            {c.label}
          </div>
          <p className="value" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
