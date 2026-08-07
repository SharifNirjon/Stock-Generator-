export default function SearchBar({ value, onChange, placeholder = 'Search entries…' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ minWidth: 220 }}
    />
  );
}
