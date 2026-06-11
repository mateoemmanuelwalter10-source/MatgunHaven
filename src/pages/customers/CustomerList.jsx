import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCustomers, deleteCustomer } from "../../services/customerService";

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      const { data } = await fetchCustomers();
      setCustomers(data || []);
      setLoading(false);
    }

    loadCustomers();
  }, []);

  async function handleDelete(id) {
    await deleteCustomer(id);
    setCustomers((current) => current.filter((customer) => customer.id !== id));
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Customer management</p>
          <h1>Customers</h1>
          <p>Keep delivery prices and customer details up to date.</p>
        </div>
        <Link className="primary-button" to="/customers/add">
          Add customer
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Price / gallon</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">Loading customers...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="4">No customers yet.</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.full_name}</td>
                  <td>{customer.phone || "—"}</td>
                  <td>${customer.price_per_gallon?.toFixed(2) || "0.00"}</td>
                  <td className="table-actions">
                    <Link to={`/customers/${customer.id}`}>View</Link>
                    <Link to={`/customers/${customer.id}/edit`}>Edit</Link>
                    <button onClick={() => handleDelete(customer.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
