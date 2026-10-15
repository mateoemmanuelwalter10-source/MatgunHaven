import { AuthProvider } from "./context/AuthContext";
import DatabaseConnectionBoundary from "./components/common/DatabaseConnectionBoundary";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <DatabaseConnectionBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </DatabaseConnectionBoundary>
  );
}
