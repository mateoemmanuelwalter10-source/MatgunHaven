import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/images/logo.png";

export default function Navbar() {
  const auth = useAuth() || {};
  const {
    user,
    businessSettings,
    logout = () => {},
  } = auth;
  const displayName = user?.name || "Account";
  const businessName = businessSettings?.business_name || "Matgun Haven";
  const businessTagline =
    businessSettings?.business_tagline || "Purified Drinking Station";
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const adminRoutes = ["/users", "/reports", "/settings", "/admin"];
  const isAdminRoute = adminRoutes.some((path) =>
    location.pathname.startsWith(path)
  );
  const [adminView, setAdminView] = useState(isAdminRoute);

  useEffect(() => {
    if (!isAdmin) {
      setAdminView(false);
      return;
    }

    setAdminView(isAdminRoute);
  }, [isAdmin, isAdminRoute]);

  function handleViewToggle(showAdmin) {
    if (!isAdmin) return;
    setAdminView(showAdmin);
    navigate(showAdmin ? "/users" : "/dashboard");
  }

  const userLinks = [
    { to: "/dashboard", label: "Dashboard", end: true },
    { to: "/sales", label: "Sales & Delivery", end: true },
    { to: "/customers", label: "Customers & Information", end: true },
  ];

  const adminLinks = [
    { to: "/users", label: "User management", end: true },
    { to: "/settings/system", label: "App settings", end: false },
    { to: "/admin/sales-import", label: "Bulk sales import", end: true },
  ];

  const activeLinks = adminView ? adminLinks : userLinks;

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <header className="topbar">
      <div className="topbar-row">
        <Link to="/dashboard" className="brand">
          <div className="brand-logo">
            <img
              src={businessSettings?.logo_url || logo}
              alt={`${businessName} logo`}
            />
          </div>
          <span className="brand-copy">
            <span className="brand-name">{businessName}</span>
            {businessTagline && (
              <span className="brand-tagline">{businessTagline}</span>
            )}
          </span>
        </Link>

        {isAdmin && (
          <div className="nav-toggle-group" role="group" aria-label="View toggle">
            <button
              type="button"
              className={`nav-toggle${!adminView ? " active" : ""}`}
              onClick={() => handleViewToggle(false)}
            >
              User pages
            </button>
            <button
              type="button"
              className={`nav-toggle${adminView ? " active" : ""}`}
              onClick={() => handleViewToggle(true)}
            >
              Admin pages
            </button>
          </div>
        )}

        <nav className="main-nav" aria-label="Main navigation">
          {activeLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              end={link.end}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <Link className="profile-link" to="/profile">
            {displayName}
          </Link>
          <button className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {location.pathname.startsWith("/sales") && (
        <nav className="sub-nav" aria-label="Sales section navigation">
          <NavLink to="/sales" className={linkClass} end>
            Sales Table
          </NavLink>
          <NavLink to="/sales/add" className={linkClass}>
            New Delivery
          </NavLink>
          <NavLink to="/sales/print" className={linkClass}>
            Print Sales Invoice
          </NavLink>
        </nav>
      )}
    </header>
  );
}
