import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCustomers } from "../../services/customerService";
import { useAuth } from "../../hooks/useAuth";
import Loader from "../../components/common/Loader";

export default function CustomerList() {
  const { showDeactivatedCustomers, setShowDeactivatedCustomers } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCustomers() {
      try {
        const { data, error } = await fetchCustomers();
        if (error) {
          setError(error.message || "Unable to load customers.");
          return;
        }
        setCustomers(data || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load customers.");
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const activeCustomers = customers.filter((customer) => customer.status !== false);
  const deactivatedCustomers = customers.filter((customer) => customer.status === false);
  const visibleCustomers = showDeactivatedCustomers
    ? deactivatedCustomers
    : activeCustomers;

  function renderCustomerRows() {
    const isDeactivated = showDeactivatedCustomers;

    if (visibleCustomers.length === 0) {
      return (
        <tr>
          <td colSpan="6">
            {isDeactivated ? "No deactivated customers." : "No active customers yet."}
          </td>
        </tr>
      );
    }

    return visibleCustomers.map((customer) => (
      <tr
        key={customer.id}
        className={`clickable-row${isDeactivated ? " deactivated-row" : ""}`}
        onClick={() => navigate(`/customers/${customer.id}`)}
      >
        <td>{customer.full_name}</td>
        <td>{customer.phone || "—"}</td>
        <td>₱{Number(customer.price_per_gallon || 0).toFixed(2)}</td>
        <td>{isDeactivated ? "Deactivated" : "Active"}</td>
        <td>
          {customer.created_at
            ? new Date(customer.created_at).toLocaleDateString()
            : "—"}
        </td>
        <td className="table-actions">
          <Link
            to={`/customers/${customer.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            View
          </Link>
        </td>
      </tr>
    ));
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Customer management</p>
          <h1>Customers & Information</h1>
          <p>Customer list, details, and account actions.</p>
        </div>
        <div className="customer-list-actions">
          <button
            type="button"
            className={`ghost-button customer-status-toggle ${
              showDeactivatedCustomers ? "show-active-customers" : "show-deactivated-customers"
            }`}
            onClick={() =>
              setShowDeactivatedCustomers((current) => !current)
            }
          >
            {showDeactivatedCustomers
              ? "See active customers"
              : "See deactivated customers"}
          </button>
          <Link className="primary-button" to="/customers/add">
            Add new Customer
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Price / gallon</th>
              <th>Status</th>
              <th>Date registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">
                  <Loader label="Loading customers..." />
                </td>
              </tr>
            ) : (
              renderCustomerRows()
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
