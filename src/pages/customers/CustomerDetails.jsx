import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomer } from "../../services/customerService";

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    async function loadCustomer() {
      const { data } = await getCustomer(id);
      setCustomer(data);
    }

    loadCustomer();
  }, [id]);

  if (!customer) {
    return <div className="page-section">Loading customer...</div>;
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
            <p>${customer.price_per_gallon?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <strong>Added</strong>
            <p>{new Date(customer.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
