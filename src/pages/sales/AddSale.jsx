import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSale } from "../../services/salesService";
import { fetchActiveCustomers } from "../../services/customerService";
import { formatDateInput, parseDateInput } from "../../utils/formatDate";
import Loader from "../../components/common/Loader";

export default function AddSale() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [sale, setSale] = useState({
    customer_id: "",
    receipt_no: "",
    gallons: "",
    sale_date: "",
    notes: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      const { data } = await fetchActiveCustomers();
      setCustomers(data || []);
    }

    loadCustomers();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((item) => item.id === sale.customer_id),
    [sale.customer_id, customers]
  );
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      (customer.full_name || "").toLowerCase().includes(query)
    );
  }, [customerSearch, customers]);

  const totalAmount = useMemo(() => {
    const gallons = Number(sale.gallons) || 0;
    return selectedCustomer ? gallons * Number(selectedCustomer.price_per_gallon || 0) : 0;
  }, [sale.gallons, selectedCustomer]);

  function setTodayDate() {
    const today = new Date();
    const localDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    setSale((currentSale) => ({ ...currentSale, sale_date: localDate }));
    setDateInput(formatDateInput(localDate));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!sale.customer_id) {
      setError("Select a customer from the matching active customers.");
      return;
    }

    const parsedDate = dateInput ? parseDateInput(dateInput) : null;
    if (dateInput && !parsedDate) {
      setError("Enter a valid delivery date in M/d/yyyy format.");
      return;
    }

    const payload = {
      customer_id: sale.customer_id,
      receipt_no: Number(sale.receipt_no),
      gallons: Number(sale.gallons) || 0,
      price_per_gallon: selectedCustomer?.price_per_gallon || 0,
      total_amount: totalAmount,
      sale_date: parsedDate || sale.sale_date || new Date().toISOString().slice(0, 10),
      notes: sale.notes,
    };

    setSaving(true);
    const { error } = await createSale(payload);
    setSaving(false);
    if (error) {
      setError("Could not save sale. Please check the details.");
      return;
    }

    navigate("/sales");
  }

  return (
    <section className="page-section form-page">
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
          <div className="customer-picker">
            <input
              id="customer"
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={customerMenuOpen}
              aria-controls="active-customer-options"
              autoComplete="off"
              placeholder="Search customers..."
              value={customerSearch}
              onFocus={() => setCustomerMenuOpen(true)}
              onChange={(event) => {
                setCustomerSearch(event.target.value);
                setCustomerMenuOpen(true);
                if (sale.customer_id) {
                  setSale({ ...sale, customer_id: "" });
                }
              }}
              required
            />
            {customerMenuOpen && (
              <div
                className="customer-picker-options"
                id="active-customer-options"
                role="listbox"
              >
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      role="option"
                      aria-selected={sale.customer_id === customer.id}
                      onClick={() => {
                        setSale({ ...sale, customer_id: customer.id });
                        setCustomerSearch(customer.full_name);
                        setCustomerMenuOpen(false);
                      }}
                    >
                      {customer.full_name}
                    </button>
                  ))
                ) : (
                  <div className="customer-picker-empty">No matching active customers.</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="receipt-number">Delivery receipt number</label>
          <input
            id="receipt-number"
            type="number"
            min="1"
            step="1"
            value={sale.receipt_no}
            onChange={(e) => setSale({ ...sale, receipt_no: e.target.value })}
            required
          />
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
            <button
              className="ghost-button date-today-button"
              type="button"
              onClick={setTodayDate}
            >
              Today
            </button>
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
        <div className="form-actions justify-end">
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <Loader label="Saving delivery..." /> : "Save delivery"}
          </button>
        </div>
      </form>
    </section>
  );
}
