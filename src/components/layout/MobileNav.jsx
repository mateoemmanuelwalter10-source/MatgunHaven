import { Link } from "react-router-dom";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <Link to="/dashboard">Home</Link>
      <Link to="/sales">Sales</Link>
      <Link to="/customers">Customers</Link>
    </nav>
  );
}
