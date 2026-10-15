import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/common/Loader";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader label="Loading your session..." variant="screen" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
