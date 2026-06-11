import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import CustomerList from "../pages/customers/CustomerList";
import AddCustomer from "../pages/customers/AddCustomer";
import EditCustomer from "../pages/customers/EditCustomer";
import CustomerDetails from "../pages/customers/CustomerDetails";
import SalesList from "../pages/sales/SalesList";
import AddSale from "../pages/sales/AddSale";
import EditSale from "../pages/sales/EditSale";
import SaleDetails from "../pages/sales/SaleDetails";
import CompanySettings from "../pages/settings/CompanySettings";
import MyProfile from "../pages/profile/MyProfile";
import MainLayout from "../components/layout/MainLayout";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CustomerList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/add"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AddCustomer />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditCustomer />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CustomerDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SalesList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/add"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AddSale />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SaleDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EditSale />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MyProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <CompanySettings />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
