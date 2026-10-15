import { useEffect, useMemo, useState } from "react";
import { fetchActiveCustomers } from "../../services/customerService";
import { fetchSales } from "../../services/salesService";
import { useAuth } from "../../hooks/useAuth";
import Loader from "../../components/common/Loader";
import defaultLogo from "../../assets/images/logo.png";
import { logSystemError, logSystemEvent } from "../../services/systemLogService";
import "./PrintSalesInvoice.css";

function getLocalMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatSaleDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(value) {
  return `₱${(Number(value) || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PrintSalesInvoice() {
  const { businessSettings } = useAuth() || {};
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [statementMonth, setStatementMonth] = useState(getLocalMonthValue);
  const [statementDay, setStatementDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [customersResult, salesResult] = await Promise.all([
        fetchActiveCustomers(),
        fetchSales(),
      ]);

      if (!isMounted) return;

      if (customersResult.error || salesResult.error) {
        setError(
          customersResult.error?.message ||
            salesResult.error?.message ||
            "Could not load statement data.",
        );
      } else {
        setCustomers(customersResult.data || []);
        setSales(salesResult.data || []);
      }
      setLoading(false);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const [year, month] = statementMonth.split("-").map(Number);
    setStatementDay(String(getDaysInMonth(year, month)));
  }, [statementMonth]);

  const [monthYear, monthNumber] = statementMonth.split("-").map(Number);
  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === customerId,
  );
  const daysInSelectedMonth = getDaysInMonth(
    monthYear,
    monthNumber,
  );
  const monthLabel = statementMonth
    ? new Date(monthYear, monthNumber - 1, 1).toLocaleDateString("en-PH", {
        month: "long",
      })
    : "";
  const printedDate =
    statementDay
      ? `${monthLabel} ${statementDay}, ${monthYear}`
      : "";

  const statementSales = useMemo(
    () =>
      sales
        .filter((sale) => {
          if (String(sale.customer_id) !== customerId || !sale.sale_date) return false;
          return sale.sale_date.slice(0, 7) === statementMonth;
        })
        .sort((first, second) =>
          String(first.sale_date).localeCompare(String(second.sale_date)),
        ),
    [sales, customerId, statementMonth],
  );
  const statementTotal = statementSales.reduce(
    (total, sale) => total + (Number(sale.total_amount) || 0),
    0,
  );
  const businessName = businessSettings?.business_name || "Matgun Haven";
  const businessTagline =
    businessSettings?.business_tagline || "Purified Drinking Station";
  const businessLogo = businessSettings?.logo_url || defaultLogo;

  function changeStatementDay(value) {
    if (value === "") {
      setStatementDay("");
      return;
    }
    const day = Number(value);
    if (Number.isInteger(day) && day >= 1 && day <= daysInSelectedMonth) {
      setStatementDay(value);
    }
  }

  async function handleDownloadPdf() {
    setDownloadError("");
    setDownloading(true);
    try {
      const { generateMonthlyStatementPdf } = await import(
        "../../utils/generateMonthlyStatementPdf"
      );
      await generateMonthlyStatementPdf({
        businessName,
        businessTagline,
        logoUrl: businessLogo,
        customerName: selectedCustomer.full_name,
        statementMonth,
        printedDate,
        sales: statementSales,
        total: statementTotal,
      });
      await logSystemEvent({
        eventType: "print",
        message: "Monthly statement PDF downloaded",
        entityType: "customer_statement",
        entityId: customerId,
        details: {
          statement_month: statementMonth,
          delivery_count: statementSales.length,
          total_amount: statementTotal,
        },
      });
    } catch (downloadFailure) {
      await logSystemError("download_statement_pdf", downloadFailure, {
        entityType: "customer_statement",
        entityId: customerId,
        details: { statement_month: statementMonth },
      });
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : "Could not generate the statement PDF.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="page-section print-statement-page">
      <div className="section-header statement-screen-only">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Download monthly statement</h1>
          <p>Select a customer and month, then download a Letter-size PDF ready to print.</p>
        </div>
      </div>

      <div className="statement-controls statement-screen-only">
        {loading ? (
          <Loader label="Loading customers and sales..." variant="block" />
        ) : error ? (
          <p className="error-message" role="alert">{error}</p>
        ) : (
          <div className="statement-control-grid">
            <div className="form-field">
              <label htmlFor="statement-customer">Customer</label>
              <select
                id="statement-customer"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="statement-month">Month to print</label>
              <input
                id="statement-month"
                type="month"
                value={statementMonth}
                onChange={(event) => {
                  if (event.target.value) setStatementMonth(event.target.value);
                }}
              />
            </div>

            <fieldset className="statement-date-field">
              <legend>Date printed on the statement</legend>
              <div className="statement-date-controls">
                <label>
                  <span>Day</span>
                  <input
                    aria-label="Statement date day"
                    type="number"
                    min="1"
                    max={daysInSelectedMonth}
                    step="1"
                    value={statementDay}
                    onChange={(event) => changeStatementDay(event.target.value)}
                  />
                </label>
                <span className="statement-date-month" aria-label="Selected month">
                  {monthLabel} {monthYear}
                </span>
              </div>
              <small>The month and year follow the selected statement month.</small>
            </fieldset>
          </div>
        )}
      </div>

      <div className="statement-preview-wrap">
        <p className="statement-preview-label">Statement format preview</p>
        <article className="statement-paper" aria-label="Monthly statement format preview">
          <header className="statement-paper-header">
            <div className="statement-business-brand">
              <img src={businessLogo} alt={`${businessName} logo`} />
              <div>
                <h2>{businessName}</h2>
                {businessTagline && <p>{businessTagline}</p>}
              </div>
            </div>
          </header>

          <div className="statement-paper-title">
            <h1>STATEMENT OF ACCOUNTS</h1>
            <p>{monthLabel} {monthYear}</p>
          </div>

          <div className="statement-paper-meta">
            <p><strong>Date:</strong> {printedDate || "—"}</p>
            <p><strong>Customer:</strong> {selectedCustomer?.full_name || "________________________"}</p>
          </div>

          <table className="statement-paper-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Delivery Receipt No.</th>
                <th>Quantity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {statementSales.length ? (
                statementSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{formatSaleDate(sale.sale_date)}</td>
                    <td>{sale.receipt_no ?? "—"}</td>
                    <td>{sale.gallons ?? 0}</td>
                    <td>{formatMoney(sale.total_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="statement-empty-row">
                    {customerId
                      ? "No deliveries recorded for this customer and month."
                      : "Select a customer to show monthly deliveries."}
                  </td>
                </tr>
              )}
              <tr className="statement-total-row">
                <td colSpan="3">TOTAL</td>
                <td>{formatMoney(statementTotal)}</td>
              </tr>
            </tbody>
          </table>
        </article>
      </div>

      <div className="statement-print-actions statement-screen-only">
        {downloadError && (
          <p className="error-message" role="alert">{downloadError}</p>
        )}
        <button
          className="primary-button"
          type="button"
          onClick={handleDownloadPdf}
          disabled={loading || Boolean(error) || !selectedCustomer || !printedDate || downloading}
        >
          {downloading ? "Generating PDF..." : "Download statement PDF"}
        </button>
      </div>
    </section>
  );
}
