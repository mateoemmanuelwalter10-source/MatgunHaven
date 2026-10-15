import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { updatePassword } from "../../services/authService";
import Loader from "../../components/common/Loader";

const passwordSetupSessionKey = "matgunhaven-password-setup";

function getPasswordLinkType() {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const linkType = queryParams.get("type") || hashParams.get("type");
  const hasAuthCode =
    queryParams.has("code") ||
    hashParams.has("access_token") ||
    hashParams.has("token_hash");

  return hasAuthCode && (linkType === "invite" || linkType === "recovery")
    ? linkType
    : null;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [passwordSetupReady, setPasswordSetupReady] = useState(false);
  const [linkType, setLinkType] = useState(null);

  useEffect(() => {
    let active = true;
    const authLinkType = getPasswordLinkType();
    setLinkType(authLinkType);

    function markPasswordSetupReady() {
      sessionStorage.setItem(passwordSetupSessionKey, "true");
      setPasswordSetupReady(true);
      setCheckingSession(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        markPasswordSetupReady();
      } else if (event === "SIGNED_IN" && session && authLinkType) {
        markPasswordSetupReady();
      } else if (event === "INITIAL_SESSION") {
        const isPasswordSetupSession =
          Boolean(session) &&
          (authLinkType || sessionStorage.getItem(passwordSetupSessionKey) === "true");
        setPasswordSetupReady(isPasswordSetupSession);
        setCheckingSession(false);
      } else if (!session) {
        sessionStorage.removeItem(passwordSetupSessionKey);
        setPasswordSetupReady(false);
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message || "Unable to verify the password reset link.");
        setCheckingSession(false);
        return;
      }

      const isPasswordSetupSession =
        Boolean(data.session) &&
        (authLinkType || sessionStorage.getItem(passwordSetupSessionKey) === "true");
      setPasswordSetupReady((current) => current || isPasswordSetupSession);
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

    sessionStorage.removeItem(passwordSetupSessionKey);
    setSuccess("Your password has been set. You can now sign in with your account.");
    window.setTimeout(() => navigate("/login"), 1500);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{linkType === "invite" ? "Set your password" : "Reset Password"}</h1>
        <p>
          {linkType === "invite"
            ? "Your email is confirmed. Choose a password to activate your account."
            : "Create a new password for your account."}
        </p>

        {checkingSession ? (
          <Loader label="Verifying your reset link..." variant="block" />
        ) : passwordSetupReady ? (
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
                "This invitation or password reset link is invalid or expired. Ask an administrator to send a new invitation, or request another password reset email."}
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
