import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSale } from "../../services/salesService";
import { fetchCustomers } from "../../services/customerService";

export default function AddSale() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [sale, setSale] = useState({ customer_id: "", gallons: "", sale_date: "", notes: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      const { data } = await fetchCustomers();
      setCustomers(data || []);
    }

    loadCustomers();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((item) => item.id === sale.customer_id),
    [sale.customer_id, customers]
  );

  const totalAmount = useMemo(() => {
    const gallons = Number(sale.gallons) || 0;
    return selectedCustomer ? gallons * Number(selectedCustomer.price_per_gallon || 0) : 0;
  }, [sale.gallons, selectedCustomer]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      customer_id: sale.customer_id,
      gallons: Number(sale.gallons) || 0,
      price_per_gallon: selectedCustomer?.price_per_gallon || 0,
      total_amount: totalAmount,
      sale_date: sale.sale_date || new Date().toISOString().slice(0, 10),
      notes: sale.notes,
    };

    const { error } = await createSale(payload);
    if (error) {
      setError("Could not save sale. Please check the details.");
      return;
    }

    navigate("/sales");
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Record delivery</p>
          <h1>New sale</h1>
          <p>Enter the customer, quantity, and create the invoice.</p>
        </div>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="customer">Customer</label>
          <select
            id="customer"
            value={sale.customer_id}
            onChange={(e) => setSale({ ...sale, customer_id: e.target.value })}
            required
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="gallons">Gallons delivered</label>
          <input
            id="gallons"
            type="number"
            min="0"
            step="0.1"
            value={sale.gallons}
            onChange={(e) => setSale({ ...sale, gallons: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="date">Delivery date</label>
          <input
            id="date"
            type="date"
            value={sale.sale_date}
            onChange={(e) => setSale({ ...sale, sale_date: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            rows="3"
            value={sale.notes}
            onChange={(e) => setSale({ ...sale, notes: e.target.value })}
          />
        </div>
        <div className="info-row">
          <div>
            <strong>Price / gallon</strong>
            <p>${selectedCustomer?.price_per_gallon?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <strong>Invoice total</strong>
            <p>${totalAmount.toFixed(2)}</p>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button className="primary-button" type="submit">
          Save delivery
        </button>
      </form>
    </section>
  );
}
