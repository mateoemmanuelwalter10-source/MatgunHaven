export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <header>
          <h2>{title}</h2>
          <button onClick={onClose}>Close</button>
        </header>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
