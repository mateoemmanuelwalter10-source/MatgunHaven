import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { updatePassword } from "../../services/authService";
import Loader from "../../components/common/Loader";

const recoverySessionKey = "matgunhaven-password-recovery";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        sessionStorage.setItem(recoverySessionKey, "true");
        setRecoveryReady(true);
        setCheckingSession(false);
      } else if (event === "INITIAL_SESSION") {
        const isRecoverySession =
          Boolean(session) && sessionStorage.getItem(recoverySessionKey) === "true";
        setRecoveryReady(isRecoverySession);
        setCheckingSession(false);
      } else if (!session) {
        sessionStorage.removeItem(recoverySessionKey);
        setRecoveryReady(false);
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message || "Unable to verify the password reset link.");
        setCheckingSession(false);
        return;
      }

      const isRecoverySession =
        Boolean(data.session) && sessionStorage.getItem(recoverySessionKey) === "true";
      setRecoveryReady((current) => current || isRecoverySession);
      setCheckingSession(false);
    }).catch((sessionError) => {
      if (!active) return;
      setError(sessionError.message || "Unable to verify the password reset link.");
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Unable to update your password.");
      return;
    }

    sessionStorage.removeItem(recoverySessionKey);
    setSuccess("Your password has been updated.");
    window.setTimeout(() => navigate("/login"), 1500);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p>Create a new password for your account.</p>

        {checkingSession ? (
          <Loader label="Verifying your reset link..." variant="block" />
        ) : recoveryReady ? (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              New Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
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
            </label>
            <label>
              Confirm New Password
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <Loader label="Updating password..." /> : "Update password"}
            </button>
          </form>
        ) : (
          <>
            <div className="error-message">
              {error ||
                "This password reset link is invalid or expired. Request a new reset email and open its link."}
            </div>
            <div className="auth-note">
              <Link to="/login">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
