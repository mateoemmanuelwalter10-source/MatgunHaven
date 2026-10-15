import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserAccount } from "../../services/userService";
import Loader from "../../components/common/Loader";

export default function AddUser() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await createUserAccount(form);
    setLoading(false);

    if (error) {
      setError(error.message || "Unable to create user.");
      return;
    }

    setMessage("User created successfully.");
    navigate("/users");
  }

  return (
    <section className="page-section form-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Add user</p>
          <h1>Create new team member</h1>
          <p>Create a new admin or staff account for your team.</p>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader label="Creating user..." /> : "Create user"}
          </button>
        </div>
      </form>
    </section>
  );
}
