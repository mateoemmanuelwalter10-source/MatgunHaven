import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSales, deleteSale } from "../../services/salesService";

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSales() {
      const { data } = await fetchSales();
      setSales(data || []);
      setLoading(false);
    }

    loadSales();
  }, []);

  async function handleDelete(id) {
    await deleteSale(id);
    setSales((current) => current.filter((sale) => sale.id !== id));
  }

  return (
    <section className="page-section">
      <div className="page-inner">
        <div className="section-header column">
          <div>
            <p className="eyebrow">Sales history</p>
            <h1>Delivered sales</h1>
            <p>View invoices and print receipts for deliveries.</p>
          </div>
          <Link className="primary-button" to="/sales/add">
            New delivery
          </Link>
        </div>
        <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Gallons</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Loading sales...</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="5">No sales recorded yet.</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.customer?.full_name || "Unknown"}</td>
                  <td>{sale.gallons}</td>
                  <td>${sale.total_amount?.toFixed(2) || "0.00"}</td>
                  <td>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "—"}</td>
                  <td className="table-actions">
                    <Link to={`/sales/${sale.id}`}>View</Link>
                    <Link to={`/sales/${sale.id}/edit`}>Edit</Link>
                    <button onClick={() => handleDelete(sale.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}
