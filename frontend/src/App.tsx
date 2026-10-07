import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { BusinessPage } from './pages/BusinessPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { DashboardBusiness } from './pages/dashboard/DashboardBusiness';
import { DashboardServices } from './pages/dashboard/DashboardServices';
import { DashboardPhotos } from './pages/dashboard/DashboardPhotos';
import { DashboardHours } from './pages/dashboard/DashboardHours';
import { DashboardReviews } from './pages/dashboard/DashboardReviews';
import { DashboardAgenda } from './pages/dashboard/DashboardAgenda';
import { DashboardProviderAgenda } from './pages/dashboard/DashboardProviderAgenda';
import { DashboardTeam } from './pages/dashboard/DashboardTeam';
import { DashboardInventory } from './pages/dashboard/DashboardInventory';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        {/* Página pública do negócio, acessível por link direto */}
        <Route path="/business/:id" element={<BusinessPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="business" element={<DashboardBusiness />} />
        <Route path="services" element={<DashboardServices />} />
        <Route path="photos" element={<DashboardPhotos />} />
        <Route path="hours" element={<DashboardHours />} />
        <Route path="agenda" element={<DashboardAgenda />} />
        <Route path="provider-agenda" element={<DashboardProviderAgenda />} />
        <Route path="team" element={<DashboardTeam />} />
        <Route path="inventory" element={<DashboardInventory />} />
        <Route path="reviews" element={<DashboardReviews />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
