import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/images/logo.png";

export default function Navbar() {
  const auth = useAuth() || {};
  const { user, logout = () => {} } = auth;
  const displayName = user?.name || "Account";

  return (
    <header className="topbar">
      <Link to="/dashboard" className="brand">
        <div className="brand-logo">
          <img src={logo} alt="Matgun Haven logo" />
        </div>
        <span>Matgun Haven</span>
      </Link>
      <div className="topbar-actions">
        <Link className="profile-link" to="/profile">
          {displayName}
        </Link>
        <button className="ghost-button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
