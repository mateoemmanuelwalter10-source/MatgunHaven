export default function Loader({ label = "Loading...", variant = "inline" }) {
  const Tag = variant === "inline" ? "span" : "div";

  return (
    <Tag
      className={`loading-indicator loading-${variant}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-sequence" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {label && <span className="loading-label">{label}</span>}
    </Tag>
  );
}
