import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    "sidebar-link" + (isActive ? " active" : "");

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-group">
        <h3>Sales</h3>
        <NavLink to="/dashboard" className={linkClass} end>
          Dashboard
        </NavLink>
        <NavLink to="/sales" className={linkClass} end>
          All Sales
        </NavLink>
        <NavLink to="/sales/add" className={linkClass}>
          New Delivery
        </NavLink>
      </div>
      <div className="sidebar-group">
        <h3>Customers</h3>
        <NavLink to="/customers" className={linkClass} end>
          Customer List
        </NavLink>
        <NavLink to="/customers/add" className={linkClass}>
          Add Customer
        </NavLink>
      </div>
    </aside>
  );
}
