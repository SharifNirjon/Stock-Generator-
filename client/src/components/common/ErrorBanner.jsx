export default function ErrorBanner({ error }) {
  if (!error) return null;
  const message = error.response?.data?.message || error.message || String(error);
  const details = error.response?.data?.details;

  return (
    <div
      className="card"
      style={{ padding: '10px 14px', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: 14 }}
    >
      <div>{message}</div>
      {Array.isArray(details) && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {details.map((d, i) => (
            <li key={i}>{typeof d === 'string' ? d : d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
