export default function SearchBar({ value, onChange }) {
  return (
    <input
      className="search-bar"
      type="search"
      value={value}
      onChange={onChange}
      placeholder="Search..."
    />
  );
}
