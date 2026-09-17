import React, { useState, useEffect } from 'react';
import { SalonProvider, useSalon } from './context/SalonContext';
import { MobileFrame } from './components/common/MobileFrame';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { AuthScreen } from './components/auth/AuthScreen';
import { HomeScreen } from './components/client/HomeScreen';
import { ServicesCatalogScreen } from './components/client/ServicesCatalogScreen';
import { MyAppointmentsScreen } from './components/client/MyAppointmentsScreen';
import { ClientProfileScreen } from './components/client/ClientProfileScreen';
import { BookingModal } from './components/client/BookingModal';
import { ProDashboardScreen } from './components/pro/ProDashboardScreen';
import { ProScheduleScreen } from './components/pro/ProScheduleScreen';
import { ProPOSScreen } from './components/pro/ProPOSScreen';
import { ProClientsScreen } from './components/pro/ProClientsScreen';
import { ProServicesScreen } from './components/pro/ProServicesScreen';
import { ProBottomNav } from './components/pro/ProBottomNav';
import { EmployeeScreen } from './components/employee/EmployeeScreen';
import { AdminServicesScreen } from './components/admin/AdminServicesScreen';
import { ServiceItem, StaffMember } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, currentUser, activeRole } = useSalon();
  
  // Navigation tabs for Client: 'home' | 'services' | 'appointments' | 'profile'
  const [clientTab, setClientTab] = useState<string>('home');

  // Navigation tabs for Prestataire / Owner: 'dashboard' | 'schedule' | 'pos' | 'clients' | 'services'
  const [proTab, setProTab] = useState<string>('dashboard');

  // Booking wizard modal trigger (usable in both client & pro)
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [preselectedService, setPreselectedService] = useState<ServiceItem | null>(null);
  const [preselectedStaff, setPreselectedStaff] = useState<StaffMember | null>(null);

  // Reset tabs when active role changes
  useEffect(() => {
    if (activeRole === 'owner') {
      setProTab('dashboard');
    } else if (activeRole === 'client') {
      setClientTab('home');
    }
  }, [activeRole]);

  // Quick book helpers from catalog/home/empty
  const handleOpenServiceBooking = (service: ServiceItem) => {
    setPreselectedService(service);
    setPreselectedStaff(null);
    setIsBookingOpen(true);
  };

  const handleOpenStaffBooking = (staff: StaffMember) => {
    setPreselectedStaff(staff);
    setPreselectedService(null);
    setIsBookingOpen(true);
  };

  const handleOpenEmptyBooking = () => {
    setPreselectedService(null);
    setPreselectedStaff(null);
    setIsBookingOpen(true);
  };

  // If user is not logged in, display the Multi-Space Authentication Screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <MobileFrame>
      {/* Top Mobile Bar & Header with Salon Switcher & Multi-Space Switcher */}
      <Header />

      {/* Main View Body */}
      <main className="min-h-[75vh] p-1 pb-20">
        {/* ========================================================================= */}
        {/* 0. ESPACE ADMINISTRATEUR PLATEFORME (SUPER ADMIN SAAS) */}
        {/* ========================================================================= */}
        {activeRole === 'admin' && (
          <AdminServicesScreen />
        )}

        {/* ========================================================================= */}
        {/* 1. ESPACE PRESTATAIRE (OWNER / GÉRANT) */}
        {/* ========================================================================= */}
        {activeRole === 'owner' && (
          <>
            {proTab === 'dashboard' && (
              <ProDashboardScreen 
                onNavigateToSchedule={() => setProTab('schedule')}
                onNavigateToPOS={() => setProTab('pos')}
              />
            )}
            {proTab === 'schedule' && (
              <ProScheduleScreen />
            )}
            {proTab === 'pos' && (
              <ProPOSScreen />
            )}
            {proTab === 'clients' && (
              <ProClientsScreen />
            )}
            {proTab === 'services' && (
              <ProServicesScreen />
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. ESPACE COLLABORATEUR (EMPLOYEE / STAFF) */}
        {/* ========================================================================= */}
        {activeRole === 'employee' && (
          <EmployeeScreen />
        )}

        {/* ========================================================================= */}
        {/* 3. ESPACE CLIENT (CLIENT RÉSERVATION & PRIVILÈGES) */}
        {/* ========================================================================= */}
        {activeRole === 'client' && (
          <>
            {clientTab === 'home' && (
              <HomeScreen 
                onSelectService={handleOpenServiceBooking}
                onSelectStaff={handleOpenStaffBooking}
                onNavigateToServices={() => setClientTab('services')}
              />
            )}
            {clientTab === 'services' && (
              <ServicesCatalogScreen 
                onSelectService={handleOpenServiceBooking}
              />
            )}
            {clientTab === 'appointments' && (
              <MyAppointmentsScreen 
                onBookNew={handleOpenEmptyBooking}
              />
            )}
            {clientTab === 'profile' && (
              <ClientProfileScreen />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar depending on active role */}
      {activeRole === 'owner' && (
        <ProBottomNav
          activeTab={proTab}
          onTabChange={(tab) => setProTab(tab)}
        />
      )}

      {activeRole === 'client' && (
        <BottomNav
          activeTab={clientTab}
          onTabChange={(tab) => setClientTab(tab)}
          onOpenQuickBook={handleOpenEmptyBooking}
        />
      )}

      {/* Booking Wizard Modal */}
      {isBookingOpen && (
        <BookingModal
          initialService={preselectedService}
          initialStaff={preselectedStaff}
          onClose={() => setIsBookingOpen(false)}
          onBookingComplete={() => {
            if (activeRole === 'owner') {
              setProTab('schedule');
            } else if (activeRole === 'client') {
              setClientTab('appointments');
            }
          }}
        />
      )}
    </MobileFrame>
  );
};

export default function App() {
  return (
    <SalonProvider>
      <MainAppContent />
    </SalonProvider>
  );
}
