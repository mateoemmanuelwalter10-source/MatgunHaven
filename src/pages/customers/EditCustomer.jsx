import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomer, updateCustomer } from "../../services/customerService";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ full_name: "", phone: "", price_per_gallon: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      const { data } = await getCustomer(id);
      if (data) {
        setCustomer({
          full_name: data.full_name,
          phone: data.phone,
          price_per_gallon: data.price_per_gallon || "",
        });
      }
    }

    loadCustomer();
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const { error } = await updateCustomer(id, {
      full_name: customer.full_name,
      phone: customer.phone,
      price_per_gallon: Number(customer.price_per_gallon) || 0,
    });

    if (error) {
      setError("Could not update customer.");
      return;
    }

    navigate("/customers");
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Edit customer</p>
          <h1>Update customer info</h1>
          <p>Change pricing, delivery contact, or other details.</p>
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
          Update customer
        </button>
      </form>
    </section>
  );
}
