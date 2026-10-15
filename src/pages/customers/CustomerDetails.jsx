import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCustomer, setCustomerActive } from "../../services/customerService";
import Loader from "../../components/common/Loader";

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      const { data } = await getCustomer(id);
      setCustomer(data);
    }

    loadCustomer();
  }, [id]);

  async function handleStatusChange() {
    setError("");
    setUpdatingStatus(true);
    const { data, error: updateError } = await setCustomerActive(
      customer.id,
      customer.status === false,
    );
    setUpdatingStatus(false);

    if (updateError) {
      setError(updateError.message || "Unable to update customer status.");
      return;
    }

    setCustomer(data);
  }

  if (!customer) {
    return (
      <section className="page-section">
        <Loader label="Loading customer..." variant="block" />
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Customer details</p>
          <h1>{customer.full_name}</h1>
          <p>Delivery price per gallon and contact information.</p>
        </div>
      </div>
      <div className="card-block">
        <div className="info-row">
          <div>
            <strong>Phone</strong>
            <p>{customer.phone || "Not available"}</p>
          </div>
          <div>
            <strong>Price / gallon</strong>
            <p>₱{customer.price_per_gallon?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <strong>Added</strong>
            <p>{new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <strong>Status</strong>
            <p>{customer.status === false ? "Deactivated" : "Active"}</p>
          </div>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="form-actions customer-detail-actions">
        <Link className="ghost-button customer-action-return" to="/customers">
          Return to customers
        </Link>
        <Link className="ghost-button customer-action-update" to={`/customers/${id}/edit`}>
          Update
        </Link>
        <button
          className={`ghost-button ${
            customer.status === false
              ? "customer-action-activate"
              : "customer-action-deactivate"
          }`}
          type="button"
          onClick={handleStatusChange}
          disabled={updatingStatus}
        >
          {updatingStatus
            ? <Loader label="Updating..." />
            : customer.status === false
              ? "Activate"
              : "Deactivate"}
        </button>
      </div>
    </section>
  );
}
