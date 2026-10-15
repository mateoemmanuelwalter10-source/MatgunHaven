import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteSale, getSale } from "../../services/salesService";
import Loader from "../../components/common/Loader";

export default function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSale() {
      const { data } = await getSale(id);
      setSale(data);
    }

    loadSale();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this delivery record? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError("");
    const { error: deleteError } = await deleteSale(id);
    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message || "Unable to delete this delivery.");
      return;
    }

    navigate("/sales");
  }

  if (!sale) {
    return (
      <section className="page-section">
        <Loader label="Loading invoice..." variant="block" />
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="sale-details-content">
        <div className="section-header">
          <div>
            <p className="eyebrow">Invoice</p>
            <h1>Sales receipt</h1>
            <p>Review the delivery details.</p>
          </div>
        </div>
        <div className="invoice-card">
          <div className="invoice-header">
            <div>
              <p className="invoice-label">Customer</p>
              <h2>{sale.customer?.full_name || "Unknown"}</h2>
            </div>
            <div>
              <p className="invoice-label">Receipt number</p>
              <p>{sale.receipt_no || "—"}</p>
            </div>
            <div>
              <p className="invoice-label">Delivery date</p>
              <p>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          <div className="invoice-grid">
            <div>
              <strong>Gallons</strong>
              <p>{sale.gallons}</p>
            </div>
            <div>
              <strong>Price / gallon</strong>
              <p>₱{sale.price_per_gallon?.toFixed(2) || "0.00"}</p>
            </div>
            <div>
              <strong>Total</strong>
              <p>₱{sale.total_amount?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
          <div className="invoice-notes">
            <strong>Notes</strong>
            <p>{sale.notes || "No extra notes."}</p>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="form-actions customer-detail-actions">
          <Link className="ghost-button customer-action-return" to="/sales">
            Return to sales
          </Link>
          <Link className="ghost-button customer-action-update" to={`/sales/${id}/edit`}>
            Edit
          </Link>
          <button
            className="ghost-button customer-action-delete"
            type="button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader label="Deleting..." /> : "Delete"}
          </button>
        </div>
      </div>
    </section>
  );
}
