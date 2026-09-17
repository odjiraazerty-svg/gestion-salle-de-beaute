import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ServiceItem, StaffMember, Appointment } from '../../types';
import confetti from 'canvas-confetti';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Check, 
  Sparkles, 
  QrCode, 
  CalendarPlus,
  Phone,
  Mail,
  FileText
} from 'lucide-react';

interface Props {
  initialService?: ServiceItem | null;
  initialStaff?: StaffMember | null;
  onClose: () => void;
  onBookingComplete?: (apt: Appointment) => void;
}

export const BookingModal: React.FC<Props> = ({
  initialService,
  initialStaff,
  onClose,
  onBookingComplete
}) => {
  const { 
    salonInfo, 
    services, 
    staff, 
    activeClient, 
    bookAppointment 
  } = useSalon();

  // Wizard state
  const [step, setStep] = useState<number>(initialService ? 2 : 1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(initialService || services[0] || null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(initialStaff || staff[0] || null);
  
  // Date generation (next 14 available days)
  const getUpcomingDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayNum = d.getDay();
      if (dayNum !== 0 && dayNum !== 1) { // Open Tue-Sat
        days.push({
          dateStr: d.toISOString().split('T')[0],
          dayName: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d),
          dayNumber: d.getDate(),
          monthName: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)
        });
      }
    }
    return days;
  };

  const availableDays = getUpcomingDays();
  const [selectedDate, setSelectedDate] = useState<string>(availableDays[0]?.dateStr || '');

  // Time slots generator
  const timeSlots = [
    '09:30', '10:15', '11:00', '11:45',
    '14:00', '14:45', '15:30', '16:15', '17:00', '18:00', '18:45'
  ];

  const [selectedTime, setSelectedTime] = useState<string>('11:00');

  // Client form
  const [clientName, setClientName] = useState<string>(activeClient?.name || '');
  const [clientPhone, setClientPhone] = useState<string>(activeClient?.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(activeClient?.email || '');
  const [notes, setNotes] = useState<string>('');

  // Confirmed appointment result
  const [confirmedApt, setConfirmedApt] = useState<Appointment | null>(null);

  // Handle finalize booking
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      alert('Veuillez remplir toutes les informations requises.');
      return;
    }

    const newApt = await bookAppointment({
      serviceId: selectedService.id,
      staffId: selectedStaff.id,
      date: selectedDate,
      time: selectedTime,
      clientName,
      clientPhone,
      clientEmail,
      notes
    });

    setConfirmedApt(newApt);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback
    }

    if (onBookingComplete) {
      onBookingComplete(newApt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md theme-bg-card border-t sm:border theme-border rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b theme-border flex items-center justify-between theme-bg-header">
          <div className="flex items-center gap-2">
            {step > 1 && !confirmedApt && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-8 h-8 rounded-full theme-bg-subtle flex items-center justify-center theme-text-primary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-bold theme-text-primary font-serif">
                {confirmedApt ? 'Réservation Confirmée !' : 'Prendre Rendez-vous'}
              </h3>
              <p className="text-[11px] theme-text-secondary">
                {salonInfo.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full theme-bg-subtle flex items-center justify-center theme-text-muted hover:theme-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard progress bar */}
        {!confirmedApt && (
          <div className="px-5 pt-3 pb-1">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className={step >= 1 ? 'theme-text-accent font-bold' : 'theme-text-muted'}>1. Prestation</span>
              <span className={step >= 2 ? 'theme-text-accent font-bold' : 'theme-text-muted'}>2. Coiffeur</span>
              <span className={step >= 3 ? 'theme-text-accent font-bold' : 'theme-text-muted'}>3. Date & Heure</span>
              <span className={step >= 4 ? 'theme-text-accent font-bold' : 'theme-text-muted'}>4. Validation</span>
            </div>
            <div className="w-full h-1.5 theme-bg-subtle rounded-full overflow-hidden">
              <div 
                className="h-full theme-btn-primary transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Scrollable Wizard Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && !confirmedApt && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider theme-text-muted">
                Sélectionnez une prestation :
              </h4>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {services.map((srv) => {
                  const isSel = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSel
                          ? 'border-2 theme-badge-accent shadow-sm'
                          : 'theme-bg-subtle border theme-border hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={srv.image} 
                          alt={srv.name} 
                          className="w-12 h-12 rounded-xl object-cover" 
                        />
                        <div>
                          <div className="text-[10px] font-semibold theme-text-accent uppercase tracking-wider">
                            {srv.subCategory}
                          </div>
                          <h5 className="text-xs font-bold theme-text-primary">
                            {srv.name}
                          </h5>
                          <div className="text-[11px] theme-text-secondary">
                            {srv.duration} min
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black theme-text-accent">
                          {srv.price} {salonInfo.currency}
                        </span>
                        {isSel && (
                          <div className="w-5 h-5 rounded-full theme-btn-primary flex items-center justify-center mt-1 ml-auto">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT STAFF */}
          {step === 2 && !confirmedApt && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider theme-text-muted">
                Choisissez votre coiffeur / praticien :
              </h4>
              <div className="space-y-2">
                {staff.map((st) => {
                  const isSel = selectedStaff?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStaff(st)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSel
                          ? 'border-2 theme-badge-accent shadow-sm'
                          : 'theme-bg-subtle border theme-border hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={st.avatar} 
                          alt={st.name} 
                          className="w-12 h-12 rounded-full object-cover border theme-border" 
                        />
                        <div>
                          <h5 className="text-xs font-bold theme-text-primary">{st.name}</h5>
                          <p className="text-[11px] theme-text-secondary">{st.role}</p>
                          <div className="text-[10px] theme-text-accent font-semibold flex items-center gap-1 mt-0.5">
                            <span>★ {st.rating}</span>
                            <span className="theme-text-muted">({st.reviewsCount} avis)</span>
                          </div>
                        </div>
                      </div>

                      {isSel && (
                        <div className="w-6 h-6 rounded-full theme-btn-primary flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME SLOTS */}
          {step === 3 && !confirmedApt && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">
                  Choisissez la date :
                </h4>
                <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
                  {availableDays.map((day) => {
                    const isSel = selectedDate === day.dateStr;
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`flex-shrink-0 w-16 py-3 rounded-2xl border text-center transition flex flex-col items-center gap-0.5 ${
                          isSel
                            ? 'theme-btn-primary font-bold shadow-md'
                            : 'theme-bg-subtle border theme-border hover:opacity-80'
                        }`}
                      >
                        <span className="text-[10px] uppercase">{day.dayName}</span>
                        <span className="text-base font-black">{day.dayNumber}</span>
                        <span className="text-[9px]">{day.monthName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">
                  Créneaux horaires disponibles :
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isSel = selectedTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          isSel
                            ? 'theme-btn-primary shadow-sm'
                            : 'theme-bg-subtle border theme-border theme-text-primary hover:opacity-80'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CLIENT DETAILS & RECAP */}
          {step === 4 && !confirmedApt && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-3.5 rounded-2xl theme-badge-accent border theme-border space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold theme-text-primary">{selectedService?.name}</span>
                  <span className="font-black theme-text-accent">{selectedService?.price} {salonInfo.currency}</span>
                </div>
                <div className="text-[11px] theme-text-secondary flex items-center gap-3">
                  <span>Avec {selectedStaff?.name}</span>
                  <span>•</span>
                  <span>{selectedDate} à {selectedTime}</span>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold theme-text-primary mb-1">
                    Votre nom et prénom *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Sophie Valette"
                    required
                    className="w-full theme-bg-card border theme-border rounded-xl px-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold theme-text-primary mb-1">
                    Numéro de téléphone portable *
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    required
                    className="w-full theme-bg-card border theme-border rounded-xl px-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold theme-text-primary mb-1">
                    Notes ou demandes particulières (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Cheveux sensibles, thé vert à l'arrivée..."
                    rows={2}
                    className="w-full theme-bg-card border theme-border rounded-xl px-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONFIRMATION SCREEN */}
          {confirmedApt && (
            <div className="text-center py-4 space-y-4 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h4 className="text-lg font-bold theme-text-primary font-serif">
                  Votre rendez-vous est confirmé !
                </h4>
                <p className="text-xs theme-text-secondary mt-1">
                  Un email et un SMS de confirmation vous ont été envoyés.
                </p>
              </div>

              {/* QR Code Pass Card */}
              <div className="p-4 rounded-3xl theme-bg-subtle border theme-border space-y-3 max-w-xs mx-auto">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border">
                  <QrCode className="w-32 h-32 text-slate-950" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold theme-text-accent">
                    {confirmedApt.qrCode}
                  </div>
                  <div className="text-xs font-bold theme-text-primary">
                    {confirmedApt.serviceName}
                  </div>
                  <div className="text-[11px] theme-text-secondary">
                    {confirmedApt.date} à {confirmedApt.time} • Avec {confirmedApt.staffName}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t theme-border theme-bg-header flex gap-2">
          {!confirmedApt ? (
            <>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="w-full py-3 rounded-xl theme-btn-primary font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Continuer</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="w-full py-3 rounded-xl theme-btn-primary font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Confirmer mon Rendez-vous</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl theme-btn-primary font-bold text-xs shadow-md"
            >
              Terminer & Voir mes RDV
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
