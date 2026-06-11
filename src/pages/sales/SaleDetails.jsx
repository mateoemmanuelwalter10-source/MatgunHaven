import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSale } from "../../services/salesService";

export default function SaleDetails() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);

  useEffect(() => {
    async function loadSale() {
      const { data } = await getSale(id);
      setSale(data);
    }

    loadSale();
  }, [id]);

  if (!sale) {
    return <div className="page-section">Loading invoice...</div>;
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Invoice</p>
          <h1>Sales receipt</h1>
          <p>Review the final sale details before printing.</p>
        </div>
      </div>
      <div className="invoice-card">
        <div className="invoice-header">
          <div>
            <p className="invoice-label">Customer</p>
            <h2>{sale.customer?.full_name || "Unknown"}</h2>
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
            <p>${sale.price_per_gallon?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <strong>Total</strong>
            <p>${sale.total_amount?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
        <div className="invoice-notes">
          <strong>Notes</strong>
          <p>{sale.notes || "No extra notes."}</p>
        </div>
        <button className="primary-button" onClick={() => window.print()}>
          Print receipt
        </button>
      </div>
    </section>
  );
}
