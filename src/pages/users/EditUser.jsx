import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchUser, updateUserProfile } from "../../services/userService";
import Loader from "../../components/common/Loader";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", role: "user" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await fetchUser(id);
      if (error) {
        setError(error.message || "Unable to load user.");
      } else if (data) {
        setForm({ name: data.full_name || "", role: data.role || "user" });
      }
      setLoading(false);
    }

    loadUser();
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await updateUserProfile(id, {
      full_name: form.name,
      role: form.role,
    });

    setSaving(false);
    if (error) {
      setError(error.message || "Unable to update user.");
      return;
    }

    setMessage("User updated successfully.");
  }

  if (loading) {
    return (
      <section className="page-section">
        <Loader label="Loading user..." variant="block" />
      </section>
    );
  }

  return (
    <section className="page-section form-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Edit user</p>
          <h1>User profile settings</h1>
          <p>Update the user role and account details.</p>
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
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <Loader label="Saving changes..." /> : "Save changes"}
          </button>
          <button className="ghost-button" type="button" onClick={() => navigate("/users")}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
