import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCustomers } from "../../services/customerService";
import { getSale, updateSale } from "../../services/salesService";
import { formatDateInput, parseDateInput } from "../../utils/formatDate";
import Loader from "../../components/common/Loader";

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [sale, setSale] = useState({ customer_id: "", gallons: "", sale_date: "", notes: "" });
  const [dateInput, setDateInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const customersResult = await fetchCustomers();
      setCustomers(customersResult.data || []);
      const saleResult = await getSale(id);
      if (saleResult.data) {
        const saleDate = saleResult.data.sale_date?.slice(0, 10) || "";
        setSale({
          customer_id: saleResult.data.customer_id,
          gallons: saleResult.data.gallons || "",
          sale_date: saleDate,
          notes: saleResult.data.notes || "",
        });
        setDateInput(formatDateInput(saleDate));
      }
      setLoading(false);
    }

    loadData();
  }, [id]);

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

    const parsedDate = dateInput ? parseDateInput(dateInput) : null;
    if (dateInput && !parsedDate) {
      setError("Enter a valid delivery date in M/d/yyyy format.");
      return;
    }

    setSaving(true);
    const { error } = await updateSale(id, {
      customer_id: sale.customer_id,
      gallons: Number(sale.gallons) || 0,
      price_per_gallon: selectedCustomer?.price_per_gallon || 0,
      total_amount: totalAmount,
      sale_date: parsedDate || sale.sale_date || null,
      notes: sale.notes,
    });
    setSaving(false);

    if (error) {
      setError("Could not update sale.");
      return;
    }

    navigate(`/sales/${id}`);
  }

  if (loading) {
    return (
      <section className="page-section">
        <Loader label="Loading delivery..." variant="block" />
      </section>
    );
  }

  return (
    <section className="page-section form-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Edit sale</p>
          <h1>Update invoice</h1>
          <p>Adjust delivery details before printing or saving.</p>
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
          <div className="date-entry-controls">
            <input
              id="date"
              type="text"
              inputMode="numeric"
              placeholder="MM/dd/yyyy"
              aria-label="Delivery date in MM/dd/yyyy format"
              value={dateInput}
              onChange={(event) => {
                setDateInput(event.target.value);
                const parsed = parseDateInput(event.target.value);
                setSale({ ...sale, sale_date: parsed || "" });
              }}
            />
            <input
              type="date"
              aria-label="Choose delivery date from calendar"
              value={sale.sale_date}
              onChange={(event) => {
                setSale({ ...sale, sale_date: event.target.value });
                setDateInput(formatDateInput(event.target.value));
              }}
            />
          </div>
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
            <p>₱{selectedCustomer?.price_per_gallon?.toFixed(2) || "0.00"}</p>
          </div>
          <div>
            <strong>Invoice total</strong>
            <p>₱{totalAmount.toFixed(2)}</p>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="form-actions edit-sale-actions">
          <Link className="ghost-button" to={`/sales/${id}`}>
            Cancel
          </Link>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <Loader label="Saving changes..." /> : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
