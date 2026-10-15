import { Link } from "react-router-dom";

export default function SalesSummary() {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Sales summary</h1>
          <p>Admin access to sales, customer, and statement reports.</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link className="ghost-button" to="/reports/customer-summary">
          Customer summary
        </Link>
        <Link className="ghost-button" to="/reports/outstanding-balances">
          Outstanding balances
        </Link>
        <Link className="ghost-button" to="/reports/monthly-statements">
          Monthly statements
        </Link>
      </div>

      <div className="table-card">
        <p>
          Choose a report to review system performance, customer activity, and
          account balances.
        </p>
      </div>
    </section>
  );
}
