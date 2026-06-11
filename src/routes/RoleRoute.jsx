import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RoleRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-shell">Loading...</div>;
  }

  if (!user || user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
