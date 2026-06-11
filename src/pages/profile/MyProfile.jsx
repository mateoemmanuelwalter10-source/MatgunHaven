import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile, updateUserEmail, resetPassword } from "../../services/userService";

export default function MyProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", email: user.email || "" });
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (form.name !== user.name) {
        const { error } = await updateProfile(user.id, { full_name: form.name });
        if (error) throw error;
      }

      if (form.email !== user.email) {
        const { error } = await updateUserEmail(form.email);
        if (error) throw error;
      }

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to update profile.");
    }

    setLoading(false);
  }

  async function handleResetPassword() {
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await resetPassword(user.email);
    if (error) {
      setError(error.message || "Unable to send reset link.");
    } else {
      setMessage("Password reset link sent to your email.");
    }

    setLoading(false);
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">My profile</p>
          <h1>Profile settings</h1>
          <p>Update your name, email, or request a password reset.</p>
        </div>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="fullname">Full name</label>
          <input
            id="fullname"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={handleResetPassword}
            disabled={loading}
          >
            Reset password
          </button>
        </div>
      </form>
    </section>
  );
}
