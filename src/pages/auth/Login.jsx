import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { resetPassword } from "../../services/authService";
import Loader from "../../components/common/Loader";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await login(form);
    setLoading(false);

    if (error) {
      setError(error.message || "Unable to login at this time.");
      return;
    }

    navigate("/dashboard");
  }

  async function handleForgotPassword() {
    const email = form.email.trim();

    if (!email) {
      setError("Enter your email address to reset your password.");
      setSuccess("");
      return;
    }

    setResetLoading(true);
    setError("");
    setSuccess("");

    const { error } = await resetPassword(email);
    setResetLoading(false);

    if (error) {
      setError(error.message || "Unable to send password reset email.");
      return;
    }

    setSuccess("Password reset instructions have been sent to your email.");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <p>Secure access for admin and staff.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="auth-note auth-inline-link">
              <Link to="#" onClick={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}>
                {resetLoading ? (
                  <Loader label="Sending..." />
                ) : (
                  "Forgot password?"
                )}
              </Link>
            </div>
          </label>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader label="Signing in..." /> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
