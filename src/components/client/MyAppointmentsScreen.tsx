import React, { useState, useMemo } from 'react';
import { useSalon } from '../../context/SalonContext';
import { Appointment } from '../../types';
import { 
  Calendar, 
  Clock, 
  User, 
  QrCode, 
  MapPin, 
  Store,
  X, 
  CheckCircle2, 
  CalendarPlus,
  Phone,
  AlertCircle
} from 'lucide-react';

interface Props {
  onBookNew: () => void;
}

export const MyAppointmentsScreen: React.FC<Props> = ({ onBookNew }) => {
  const { appointments, cancelAppointment, salonInfo, salons, currentUser } = useSalon();
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past'>('upcoming');
  const [activeQrModal, setActiveQrModal] = useState<Appointment | null>(null);

  // Filter appointments specifically for the connected client
  const clientAppointments = useMemo(() => {
    if (!currentUser) return appointments;
    return appointments.filter(a => {
      const matchId = a.id_user && a.id_user === currentUser.id;
      const matchPhone = currentUser.phone && a.clientPhone && a.clientPhone.replace(/\s+/g, '') === currentUser.phone.replace(/\s+/g, '');
      const matchEmail = currentUser.email && a.clientEmail && a.clientEmail.toLowerCase() === currentUser.email.toLowerCase();
      const matchName = currentUser.name && a.clientName && a.clientName.toLowerCase() === currentUser.name.toLowerCase();
      return matchId || matchPhone || matchEmail || matchName;
    });
  }, [appointments, currentUser]);

  const upcomingApts = useMemo(() => {
    return clientAppointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');
  }, [clientAppointments]);

  const pastApts = useMemo(() => {
    return clientAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled');
  }, [clientAppointments]);

  const displayedList = filterTab === 'upcoming' ? upcomingApts : pastApts;

  const handleAddToCalendar = (apt: Appointment) => {
    const aptSalon = salons.find(s => s.id === apt.salonId);
    const salonName = apt.salonName || aptSalon?.name || salonInfo.name;
    const salonLocation = [apt.salonAddress || aptSalon?.address, apt.salonCity || aptSalon?.city].filter(Boolean).join(', ') || salonInfo.address;

    const title = encodeURIComponent(`${apt.serviceName} - ${salonName}`);
    const details = encodeURIComponent(`Praticien: ${apt.staffName}\nCode Pass: ${apt.qrCode}\nSalon: ${salonName}\nLieu: ${salonLocation}`);
    const location = encodeURIComponent(salonLocation);
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Title */}
      <div className="px-4 pt-1 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold theme-text-primary font-serif">
            Mes Rendez-vous
          </h2>
          <p className="text-xs theme-text-secondary">
            {currentUser ? `Réservations de ${currentUser.name}` : 'Gérez vos réservations et présentez vos Pass'}
          </p>
        </div>
        <button
          onClick={onBookNew}
          className="px-3 py-1.5 rounded-xl theme-badge-accent text-xs font-bold hover:theme-btn-primary transition-all shadow-sm"
        >
          + Réserver
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="px-4">
        <div className="grid grid-cols-2 p-1 rounded-2xl theme-bg-card border theme-border shadow-sm">
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              filterTab === 'upcoming'
                ? 'theme-btn-primary font-bold shadow-sm'
                : 'theme-text-muted hover:theme-text-primary'
            }`}
          >
            À venir ({upcomingApts.length})
          </button>
          <button
            onClick={() => setFilterTab('past')}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              filterTab === 'past'
                ? 'theme-btn-primary font-bold shadow-sm'
                : 'theme-text-muted hover:theme-text-primary'
            }`}
          >
            Historique ({pastApts.length})
          </button>
        </div>
      </div>

      {/* Appointment Cards */}
      <div className="px-4 space-y-3">
        {displayedList.length === 0 ? (
          <div className="text-center py-16 space-y-3 theme-bg-card rounded-3xl border border-dashed theme-border p-6 shadow-sm">
            <Calendar className="w-10 h-10 theme-text-muted mx-auto opacity-50" />
            <p className="text-xs theme-text-secondary font-medium">
              {filterTab === 'upcoming'
                ? "Vous n'avez aucun rendez-vous à venir pour le moment."
                : "Aucun historique de rendez-vous."}
            </p>
            {filterTab === 'upcoming' && (
              <button
                onClick={onBookNew}
                className="px-4 py-2 rounded-xl theme-btn-primary text-xs font-bold shadow-md inline-flex items-center gap-1.5"
              >
                <span>Prendre rendez-vous maintenant</span>
              </button>
            )}
          </div>
        ) : (
          displayedList.map((apt) => {
            const isToday = apt.date === new Date().toISOString().split('T')[0];
            const aptSalon = salons.find(s => s.id === apt.salonId);
            const salonName = apt.salonName || aptSalon?.name || salonInfo.name;
            const salonCity = apt.salonCity || aptSalon?.city;
            const salonAddress = apt.salonAddress || aptSalon?.address;
            const currencyVal = apt.salonCurrency || aptSalon?.currency || salonInfo.currency || 'FCFA';

            return (
              <div
                key={apt.id}
                className="rounded-3xl border theme-border theme-bg-card p-4 space-y-3 transition-all relative overflow-hidden shadow-sm"
              >
                {/* Salon Tag & Pass */}
                <div className="flex items-center justify-between pb-2 border-b theme-border text-[11px]">
                  <div className="flex items-center gap-1.5 theme-text-primary font-bold">
                    <Store className="w-3.5 h-3.5 theme-text-accent" />
                    <span className="truncate max-w-[170px]">{salonName}</span>
                  </div>
                  {(salonCity || salonAddress) && (
                    <div className="flex items-center gap-1 text-[10px] theme-text-secondary">
                      <MapPin className="w-3 h-3 theme-text-muted" />
                      <span className="truncate max-w-[130px]">{salonCity || salonAddress}</span>
                    </div>
                  )}
                </div>

                {/* Status & Pass code */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {apt.status === 'in_progress' && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        apt.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
                          : apt.status === 'confirmed'
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : apt.status === 'completed'
                          ? 'bg-blue-500/15 text-blue-600'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {apt.status === 'in_progress' ? 'En cours au salon' : 
                       apt.status === 'confirmed' ? (isToday ? "Aujourd'hui" : 'Confirmé') : 
                       apt.status === 'completed' ? 'Terminé' : 'Annulé'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono theme-text-muted font-bold">
                    {apt.qrCode}
                  </span>
                </div>

                {/* Service & Staff */}
                <div>
                  <h4 className="text-sm font-bold theme-text-primary font-serif">
                    {apt.serviceName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs theme-text-secondary mt-1">
                    <span className="theme-text-accent font-semibold flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {apt.staffName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 theme-text-muted" />
                      {apt.time} ({apt.duration} min)
                    </span>
                  </div>
                </div>

                {/* Details banner */}
                <div className="p-2.5 rounded-2xl theme-bg-subtle border theme-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 theme-text-primary">
                    <Calendar className="w-4 h-4 theme-text-accent" />
                    <span className="font-semibold">{apt.date}</span>
                  </div>
                  <span className="font-extrabold theme-text-accent text-sm">
                    {apt.price.toLocaleString()} {currencyVal}
                  </span>
                </div>

                {/* Action Buttons for active appointments */}
                {apt.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 pt-1">
                    {/* View QR Pass */}
                    <button
                      onClick={() => setActiveQrModal(apt)}
                      className="flex-1 py-2 rounded-xl theme-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pass Salon</span>
                    </button>

                    {/* Add to Calendar */}
                    <button
                      onClick={() => handleAddToCalendar(apt)}
                      className="p-2 rounded-xl theme-bg-subtle theme-text-secondary hover:theme-text-primary border theme-border"
                      title="Ajouter à l'agenda"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </button>

                    {/* Cancel appointment */}
                    {(apt.status === 'confirmed' || apt.status === 'in_progress') && (
                      <button
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
                            cancelAppointment(apt.id);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-semibold hover:bg-rose-500 hover:text-white transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QR Code Pass Modal */}
      {activeQrModal && (() => {
        const modalSalon = salons.find(s => s.id === activeQrModal.salonId);
        const modalSalonName = activeQrModal.salonName || modalSalon?.name || salonInfo.name;
        const modalSalonLocation = [activeQrModal.salonAddress || modalSalon?.address, activeQrModal.salonCity || modalSalon?.city].filter(Boolean).join(', ') || salonInfo.address;

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm theme-bg-card border theme-border rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-scaleIn relative">
              <button
                onClick={() => setActiveQrModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full theme-bg-subtle flex items-center justify-center theme-text-muted hover:theme-text-primary"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] font-bold theme-text-accent uppercase tracking-widest">
                  E-Billet d'entrée • Pass Salon
                </span>
                <h3 className="text-base font-bold theme-text-primary font-serif mt-0.5">
                  {modalSalonName}
                </h3>
                {modalSalonLocation && (
                  <p className="text-[11px] theme-text-secondary mt-0.5">
                    📍 {modalSalonLocation}
                  </p>
                )}
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block shadow-md border">
                <QrCode className="w-40 h-40 text-slate-950" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-mono font-bold theme-text-accent">
                  {activeQrModal.qrCode}
                </p>
                <p className="text-xs font-bold theme-text-primary">
                  {activeQrModal.serviceName}
                </p>
                <p className="text-[11px] theme-text-secondary">
                  {activeQrModal.date} à {activeQrModal.time} • Avec {activeQrModal.staffName}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveQrModal(null)}
                  className="w-full py-2.5 rounded-xl theme-btn-primary text-xs font-bold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
