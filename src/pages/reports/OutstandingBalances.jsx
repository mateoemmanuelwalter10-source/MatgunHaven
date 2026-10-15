import { Link } from "react-router-dom";

export default function OutstandingBalances() {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Report</p>
          <h1>Outstanding balances</h1>
          <p>Review customers with pending balances and overdue payments.</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link className="ghost-button" to="/reports/sales-summary">
          Back to reports
        </Link>
      </div>

      <div className="table-card">
        <p>This page provides an overview of customer balances that require follow-up.</p>
      </div>
    </section>
  );
}
