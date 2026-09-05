import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { SiteLayout } from '@/pages/site/SiteLayout';
import { Home } from '@/pages/site/Home';
import { Fleet } from '@/pages/site/Fleet';
import { VehiclePage } from '@/pages/site/Vehicle';
import { Experience } from '@/pages/site/Experience';
import { Requirements } from '@/pages/site/Requirements';
import { Contact } from '@/pages/site/Contact';
import { Reserve } from '@/pages/site/Reserve';

const Sign = lazy(() => import('@/pages/site/Sign').then((m) => ({ default: m.Sign })));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const Login = lazy(() => import('@/pages/admin/Login').then((m) => ({ default: m.Login })));
const Onboarding = lazy(() => import('@/pages/admin/Onboarding').then((m) => ({ default: m.Onboarding })));
const Hub = lazy(() => import('@/pages/admin/Hub').then((m) => ({ default: m.Hub })));
const HandleRental = lazy(() => import('@/pages/admin/rental/HandleRental').then((m) => ({ default: m.HandleRental })));
const Rentals = lazy(() => import('@/pages/admin/Rentals').then((m) => ({ default: m.Rentals })));
const RentalDetail = lazy(() => import('@/pages/admin/RentalDetail').then((m) => ({ default: m.RentalDetail })));
const Inventory = lazy(() => import('@/pages/admin/Inventory').then((m) => ({ default: m.Inventory })));
const VehicleForm = lazy(() => import('@/pages/admin/VehicleForm').then((m) => ({ default: m.VehicleForm })));
const Customers = lazy(() => import('@/pages/admin/Customers').then((m) => ({ default: m.Customers })));
const CustomerDetail = lazy(() => import('@/pages/admin/Customers').then((m) => ({ default: m.CustomerDetail })));
const Contracts = lazy(() => import('@/pages/admin/Contracts').then((m) => ({ default: m.Contracts })));
const ContractEditor = lazy(() => import('@/pages/admin/Contracts').then((m) => ({ default: m.ContractEditor })));
const Payments = lazy(() => import('@/pages/admin/Payments').then((m) => ({ default: m.Payments })));
const Settings = lazy(() => import('@/pages/admin/Settings').then((m) => ({ default: m.Settings })));
const Reservations = lazy(() => import('@/pages/admin/Reservations').then((m) => ({ default: m.Reservations })));

function Fallback() {
  return <div className="min-h-[100dvh]" style={{ background: 'var(--bg)' }} aria-busy="true" />;
}

export function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="fleet/:slug" element={<VehiclePage />} />
          <Route path="experience" element={<Experience />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="contact" element={<Contact />} />
          <Route path="reserve" element={<Reserve />} />
        </Route>
        <Route path="sign/:token" element={<Sign />} />
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Hub />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="rental/new" element={<Navigate to="/admin/rental/new/vehicle" replace />} />
          <Route path="rental/new/:step" element={<HandleRental />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="rentals/:id" element={<RentalDetail />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/new" element={<VehicleForm />} />
          <Route path="inventory/:id" element={<VehicleForm />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="contracts/:id" element={<ContractEditor />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reservations" element={<Reservations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
