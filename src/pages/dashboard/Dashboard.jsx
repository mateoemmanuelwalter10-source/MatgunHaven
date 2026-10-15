import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCustomers } from "../../services/customerService";
import { fetchSales } from "../../services/salesService";
import Loader from "../../components/common/Loader";

function buildMonthLabels() {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, index) =>
    new Date(year, index, 1).toLocaleString("default", { month: "short" })
  );
}

function buildChartPath(points, width, height, lastVisibleMonth) {
  if (!points.length) return "";
  const max = Math.max(...points.slice(0, lastVisibleMonth + 1), 1);
  const step = width / 11;
  return points.slice(0, lastVisibleMonth + 1)
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 20) - 10;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function Dashboard() {
  const [summary, setSummary] = useState({
    customers: 0,
    salesThisYear: 0,
    salesThisMonth: 0,
    recentSalesByCustomer: [],
  });
  const [customerCharts, setCustomerCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [customersResult, salesResult] = await Promise.all([
          fetchCustomers(),
          fetchSales(),
        ]);
        const errors = [customersResult.error, salesResult.error].filter(Boolean);
        const customers = customersResult.data || [];
        const activeCustomers = customers.filter(
          (customer) => customer.status !== false,
        );
        const sales = salesResult.data || [];
        const recentSalesByCustomer = Array.from(
          sales.reduce((latestSales, sale) => {
            if (sale.customer_id && !latestSales.has(sale.customer_id)) {
              latestSales.set(sale.customer_id, sale);
            }
            return latestSales;
          }, new Map()).values(),
        );
        const now = new Date();
        const year = now.getFullYear();
        const currentMonth = now.getMonth();
        const salesThisYear = sales.filter((sale) => {
          if (!sale.sale_date) return false;
          return new Date(sale.sale_date).getFullYear() === year;
        });
        const salesThisMonth = salesThisYear.filter((sale) => {
          const date = new Date(sale.sale_date);
          return date.getMonth() === currentMonth;
        });

        const chartData = activeCustomers
          .map((customer) => {
            const monthly = Array.from({ length: 12 }, () => 0);
            let totalGallons = 0;
            let deliveries = 0;

            sales.forEach((sale) => {
              if (sale.customer_id !== customer.id || !sale.sale_date) return;
              const date = new Date(sale.sale_date);
              if (date.getFullYear() !== year) return;
              const monthIndex = date.getMonth();
              if (monthIndex < 0 || monthIndex > currentMonth) return;
              const gallons = Number(sale.gallons) || 0;
              monthly[monthIndex] += gallons;
              totalGallons += gallons;
              deliveries += 1;
            });

            return {
              customer,
              monthly,
              currentMonth,
              totalGallons,
              deliveries,
            };
          })
          .sort((a, b) => b.totalGallons - a.totalGallons);

        setSummary({
          customers: activeCustomers.length,
          salesThisYear: salesThisYear.length,
          salesThisMonth: salesThisMonth.length,
          recentSalesByCustomer,
        });
        setCustomerCharts(chartData);
        setError(errors.map((item) => item.message).join(" "));
      } catch (loadError) {
        setError(loadError.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const monthLabels = useMemo(buildMonthLabels, []);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Water Station Dashboard</h1>
          <p>Quick access to customers, sales, and invoices.</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link className="primary-button" to="/sales">
          Sales Table
        </Link>
        <Link className="ghost-button" to="/sales/add">
          New Delivery
        </Link>
        <Link className="ghost-button" to="/sales/print">
          Print Sales Invoice
        </Link>
        <Link className="ghost-button" to="/customers">
          Customer list
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="summary-grid">
        <article className="summary-card">
          <span>Total customers</span>
          <strong>{summary.customers}</strong>
        </article>
        <article className="summary-card">
          <span>Delivery sales this year</span>
          <strong>{summary.salesThisYear}</strong>
        </article>
        <article className="summary-card">
          <span>Delivery sales this month</span>
          <strong>{summary.salesThisMonth}</strong>
        </article>
      </div>

      <div className="chart-grid">
        {loading ? (
          <div className="chart-empty">
            <Loader label="Loading customer sales chart..." />
          </div>
        ) : customerCharts.length > 0 ? (
          customerCharts.map((entry) => {
            const averageGallons = entry.deliveries
              ? entry.totalGallons / entry.deliveries
              : 0;
            const path = entry.deliveries
              ? buildChartPath(entry.monthly, 320, 160, entry.currentMonth)
              : "";

            return (
              <article className="chart-card" key={entry.customer.id}>
                <div className="chart-header">
                  <div>
                    <h2>{entry.customer.full_name}</h2>
                    <p className="chart-meta">
                      {entry.deliveries > 0
                        ? `${entry.deliveries} deliveries · ${averageGallons.toFixed(1)} gal per delivery`
                        : "No delivery data yet"}
                    </p>
                  </div>
                  <div className="chart-total">
                    <span>Gallons bought</span>
                    <strong>{entry.totalGallons.toFixed(0)}</strong>
                  </div>
                </div>

                <div className="chart-area">
                  <svg viewBox="0 0 320 160" className="chart-svg" aria-label="Customer sales line chart">
                    <path d={path} fill="none" stroke="rgba(3, 105, 161, 0.85)" strokeWidth="3" />
                    {entry.deliveries > 0 &&
                      entry.monthly
                        .slice(0, entry.currentMonth + 1)
                        .map((value, index) => {
                          const max = Math.max(
                            ...entry.monthly.slice(0, entry.currentMonth + 1),
                            1,
                          );
                          const x = (320 / 11) * index;
                          const y = 160 - (value / max) * 140 - 10;
                          return <circle key={index} cx={x} cy={y} r="4" fill="#0369a1" />;
                        })}
                  </svg>
                  <div className="chart-labels">
                    {monthLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="chart-empty">No customer sales data available yet.</div>
        )}
      </div>

      {summary.recentSalesByCustomer.length > 0 && (
        <section className="card-block">
          <h2>Recent Invoice per Customer</h2>
          <div className="recent-invoice-table-scroll">
            <table className="recent-invoice-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Gallons</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentSalesByCustomer.map((sale) => (
                  <tr key={sale.customer_id}>
                    <td>{sale.customer?.full_name || "Unknown customer"}</td>
                    <td>₱{Number(sale.total_amount || 0).toFixed(2)}</td>
                    <td>{sale.gallons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
