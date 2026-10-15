import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function MobileNav() {
  const auth = useAuth() || {};
  const isAdmin = auth.user?.role === "admin";
  const linkClass = ({ isActive }) =>
    `mobile-nav-link${isActive ? " active" : ""}`;

  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      <NavLink to="/dashboard" end className={linkClass}>Home</NavLink>
      {isAdmin ? (
        <>
          <NavLink to="/users" end className={linkClass}>Users</NavLink>
          <NavLink to="/settings/system" className={linkClass}>App settings</NavLink>
          <NavLink to="/admin/sales-import" className={linkClass}>Bulk import</NavLink>
        </>
      ) : (
        <>
          <NavLink to="/sales" end className={linkClass}>Sales</NavLink>
          <NavLink to="/customers" className={linkClass}>Customers</NavLink>
        </>
      )}
    </nav>
  );
}
