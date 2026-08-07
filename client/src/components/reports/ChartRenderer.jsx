import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { getPalette } from '../../utils/chartPalette';

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '8px 10px', fontSize: 13 }}>
      <div className="muted">{label}</div>
      <div style={{ fontWeight: 600 }}>{Number(payload[0].value).toLocaleString()}</div>
    </div>
  );
}

export default function ChartRenderer({ chartType, data }) {
  const { theme } = useTheme();
  const palette = getPalette(theme);

  if (!data || data.length === 0) {
    return <div className="empty-state card">No data for the selected filters.</div>;
  }

  if (chartType === 'table') {
    return (
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.label}>
                <td data-label="Category">{row.label}</td>
                <td data-label="Value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {Number(row.value).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (chartType === 'pie') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" outerRadius={120} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={palette.series[index % palette.series.length]} stroke={palette.grid} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent />} />
            <Legend wrapperStyle={{ color: palette.ink, fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'line') {
    return (
      <div className="card" style={{ padding: 16 }}>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis dataKey="label" stroke={palette.axis} tick={{ fill: palette.muted, fontSize: 12 }} />
            <YAxis stroke={palette.axis} tick={{ fill: palette.muted, fontSize: 12 }} />
            <Tooltip content={<TooltipContent />} />
            <Line type="monotone" dataKey="value" stroke={palette.series[0]} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="label" stroke={palette.axis} tick={{ fill: palette.muted, fontSize: 12 }} />
          <YAxis stroke={palette.axis} tick={{ fill: palette.muted, fontSize: 12 }} />
          <Tooltip content={<TooltipContent />} />
          <Bar dataKey="value" fill={palette.series[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
