import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function MobileNav() {
  const auth = useAuth() || {};
  const isAdmin = auth.user?.role === "admin";

  return (
    <nav className="mobile-nav">
      <Link to="/dashboard">Home</Link>
      {isAdmin ? (
        <>
          <Link to="/users">Users</Link>
          <Link to="/settings/system">App settings</Link>
          <Link to="/admin/sales-import">Bulk import</Link>
        </>
      ) : (
        <>
          <Link to="/sales">Sales</Link>
          <Link to="/customers">Customers</Link>
        </>
      )}
    </nav>
  );
}
