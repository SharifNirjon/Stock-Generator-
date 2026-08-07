export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
      <button className="btn btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span className="muted">
        Page {page} of {pages}
      </span>
      <button className="btn btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
