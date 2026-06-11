import { useEffect, useState } from "react";
import { fetchCustomers } from "../../services/customerService";
import { fetchSales } from "../../services/salesService";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    customers: 0,
    sales: 0,
    lastSale: null,
  });

  useEffect(() => {
    async function loadStats() {
      const customersResult = await fetchCustomers();
      const salesResult = await fetchSales();

      setSummary({
        customers: customersResult.data?.length || 0,
        sales: salesResult.data?.length || 0,
        lastSale: salesResult.data?.[0] || null,
      });
    }

    loadStats();
  }, []);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Water Station Dashboard</h1>
          <p>Quick access to customers, sales, and invoices.</p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <span>Total customers</span>
          <strong>{summary.customers}</strong>
        </article>
        <article className="summary-card">
          <span>Delivered sales</span>
          <strong>{summary.sales}</strong>
        </article>
        <article className="summary-card">
          <span>Last delivery</span>
          <strong>{summary.lastSale?.customer?.full_name || "No sales yet"}</strong>
        </article>
      </div>

      {summary.lastSale && (
        <div className="card-block">
          <h2>Recent Invoice</h2>
          <div className="info-row">
            <div>
              <strong>Customer</strong>
              <p>{summary.lastSale.customer.full_name}</p>
            </div>
            <div>
              <strong>Total</strong>
              <p>${summary.lastSale.total_amount?.toFixed(2)}</p>
            </div>
            <div>
              <strong>Gallons</strong>
              <p>{summary.lastSale.gallons}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
