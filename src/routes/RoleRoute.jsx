import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/common/Loader";

export default function RoleRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader label="Loading your session..." variant="screen" />;
  }

  if (!user || user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
