import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSales } from "../../services/salesService";
import Loader from "../../components/common/Loader";

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("newest");
  const [customerId, setCustomerId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadSales() {
      const { data } = await fetchSales();
      setSales(data || []);
      setLoading(false);
    }

    loadSales();
  }, []);

  const customerOptions = useMemo(() => {
    const customers = new Map();
    sales.forEach((sale) => {
      if (sale.customer_id && sale.customer?.full_name) {
        customers.set(sale.customer_id, sale.customer.full_name);
      }
    });
    return [...customers.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
    );
  }, [sales]);

  const visibleSales = useMemo(() => {
    const scopedSales = sortBy === "customer" && customerId
      ? sales.filter((sale) => String(sale.customer_id) === customerId)
      : sales;

    const sortedScopedSales = [...scopedSales].sort((a, b) => {
      const dateA = a.sale_date ? new Date(a.sale_date) : new Date(0);
      const dateB = b.sale_date ? new Date(b.sale_date) : new Date(0);
      const dateOrder = dateB - dateA;
      return sortOrder === "oldest" ? -dateOrder : dateOrder;
    });

    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedScopedSales;

    return sortedScopedSales.filter((sale) => {
      const saleDate = sale.sale_date ? new Date(sale.sale_date) : null;
      const dateText = saleDate && !Number.isNaN(saleDate.getTime())
        ? saleDate.toLocaleDateString()
        : "";
      return [
        sale.receipt_no,
        sale.customer?.full_name,
        sale.sale_date,
        dateText,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [sales, sortBy, sortOrder, customerId, searchQuery]);

  return (
    <section className="page-section">
      <div className="page-inner">
        <div className="section-header column">
          <div>
            <p className="eyebrow">Sales history</p>
            <h1>Delivered sales</h1>
            <p>View invoices and print receipts for deliveries.</p>
          </div>
        </div>

        <div className="filter-panel">
          <div className="filter-row">
            <label htmlFor="sales-sort-by">Sort by</label>
            <select
              id="sales-sort-by"
              value={sortBy}
              onChange={(event) => {
                const nextSortBy = event.target.value;
                setSortBy(nextSortBy);
                setSortOrder("newest");
                setCustomerId("");
              }}
            >
              <option value="date">Date</option>
              <option value="customer">Customer</option>
            </select>

            {sortBy === "date" ? (
              <>
                <label htmlFor="sales-sort-order">Date order</label>
                <select
                  id="sales-sort-order"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                >
                  <option value="newest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </>
            ) : (
              <>
                <label htmlFor="sales-customer">Customer</label>
                <select
                  id="sales-customer"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value);
                    setSearchQuery("");
                  }}
                >
                  <option value="">All customers</option>
                  {customerOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="filter-row">
            <label htmlFor="sales-search">Search results</label>
            <input
              id="sales-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search receipt number, customer, or date"
            />
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Receipt number</th>
                <th>Gallons</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">
                    <Loader label="Loading sales..." />
                  </td>
                </tr>
              ) : visibleSales.length === 0 ? (
                <tr>
                  <td colSpan="6">No sales match the current search.</td>
                </tr>
              ) : (
                visibleSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.customer?.full_name || "Unknown"}</td>
                    <td>{sale.receipt_no ?? "—"}</td>
                    <td>{sale.gallons}</td>
                    <td>₱{sale.total_amount?.toFixed(2) || "0.00"}</td>
                    <td>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : "—"}</td>
                    <td className="table-actions">
                      <Link to={`/sales/${sale.id}`}>View</Link>
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
