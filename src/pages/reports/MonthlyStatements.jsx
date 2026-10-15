import { Link } from "react-router-dom";

export default function MonthlyStatements() {
  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Report</p>
          <h1>Monthly statements</h1>
          <p>Generate and review monthly delivery and billing statements.</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link className="ghost-button" to="/reports/sales-summary">
          Back to reports
        </Link>
      </div>

      <div className="table-card">
        <p>Use this page to access monthly sales and billing summaries.</p>
      </div>
    </section>
  );
}
