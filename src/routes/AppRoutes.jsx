import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import Login from "../pages/auth/Login";
import ResetPassword from "../pages/auth/ResetPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import CustomerList from "../pages/customers/CustomerList";
import AddCustomer from "../pages/customers/AddCustomer";
import EditCustomer from "../pages/customers/EditCustomer";
import CustomerDetails from "../pages/customers/CustomerDetails";
import SalesList from "../pages/sales/SalesList";
import AddSale from "../pages/sales/AddSale";
import EditSale from "../pages/sales/EditSale";
import SaleDetails from "../pages/sales/SaleDetails";
import PrintSalesInvoice from "../pages/sales/PrintSalesInvoice";
import BulkSalesImport from "../pages/sales/BulkSalesImport";
import CompanySettings from "../pages/settings/CompanySettings";
import SystemSettings from "../pages/settings/SystemSettings";
import BackupSettings from "../pages/settings/BackupSettings";
import UserList from "../pages/users/UserList";
import AddUser from "../pages/users/AddUser";
import EditUser from "../pages/users/EditUser";
import SalesSummary from "../pages/reports/SalesSummary";
import CustomerSummary from "../pages/reports/CustomerSummary";
import OutstandingBalances from "../pages/reports/OutstandingBalances";
import MonthlyStatements from "../pages/reports/MonthlyStatements";
import MyProfile from "../pages/profile/MyProfile";
import MainLayout from "../components/layout/MainLayout";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
          path="/sales/print"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PrintSalesInvoice />
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
          path="/users"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <UserList />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/users/add"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <AddUser />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <EditUser />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <SalesSummary />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/reports/sales-summary"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <SalesSummary />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/reports/customer-summary"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <CustomerSummary />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/reports/outstanding-balances"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <OutstandingBalances />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/reports/monthly-statements"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <MonthlyStatements />
              </MainLayout>
            </RoleRoute>
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
        <Route
          path="/settings/system"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <SystemSettings />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/settings/backup"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <BackupSettings />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route
          path="/admin/sales-import"
          element={
            <RoleRoute role="admin">
              <MainLayout>
                <BulkSalesImport />
              </MainLayout>
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
