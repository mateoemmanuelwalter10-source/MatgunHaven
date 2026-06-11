import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer } from "../../services/customerService";

export default function AddCustomer() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ full_name: "", phone: "", price_per_gallon: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      full_name: customer.full_name,
      phone: customer.phone,
      price_per_gallon: Number(customer.price_per_gallon) || 0,
    };

    const { error } = await createCustomer(payload);
    if (error) {
      setError("Could not save customer. Please check the values.");
      return;
    }

    navigate("/customers");
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Add new customer</p>
          <h1>New customer</h1>
          <p>Enter customer details and price per gallon.</p>
        </div>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Customer name</label>
          <input
            id="name"
            type="text"
            value={customer.full_name}
            onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="text"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="price">Price per gallon</label>
          <input
            id="price"
            type="number"
            step="0.01"
            value={customer.price_per_gallon}
            onChange={(e) => setCustomer({ ...customer, price_per_gallon: e.target.value })}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button className="primary-button" type="submit">
          Save customer
        </button>
      </form>
    </section>
  );
}
