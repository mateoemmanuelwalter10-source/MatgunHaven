import { Link } from "react-router-dom";

export default function CustomerSummary() {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Customer report</p>
          <h1>Customer summary</h1>
          <p>Review customer activity, account balances, and service status.</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link className="ghost-button" to="/reports/sales-summary">
          Back to reports
        </Link>
      </div>

      <div className="table-card">
        <p>Use this page to access customer summaries and follow up on overdue accounts.</p>
      </div>
    </section>
  );
}
