import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { StaffMember, Appointment, AppointmentStatus } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Clock, 
  Plus, 
  Phone, 
  Check, 
  X, 
  Play 
} from 'lucide-react';

export const ProScheduleScreen: React.FC = () => {
  const { staff, appointments, updateAppointmentStatus, salonInfo } = useSalon();
  
  // Active selected date
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedAptDetails, setSelectedAptDetails] = useState<Appointment | null>(null);

  // Date navigation helpers
  const changeDateBy = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter appointments for the day
  let dayApts = appointments.filter(a => a.date === selectedDate);
  if (selectedStaffId !== 'all') {
    dayApts = dayApts.filter(a => a.staffId === selectedStaffId);
  }

  // Format date display
  const dateFormatted = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).format(new Date(selectedDate));

  // Time grid slots
  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Header & Date Navigation */}
      <div className="px-4 pt-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-serif">
              Planning du Salon
            </h2>
            <p className="text-xs text-slate-400 capitalize">
              {dateFormatted}
            </p>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => changeDateBy(-1)}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold"
          >
            Aujourd'hui
          </button>

          <button
            onClick={() => changeDateBy(1)}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Staff Filter Tabs */}
      <div className="px-4 overflow-x-auto no-scrollbar flex gap-2">
        <button
          onClick={() => setSelectedStaffId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedStaffId === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          Tous ({staff.length})
        </button>

        {staff.map((st) => (
          <button
            key={st.id}
            onClick={() => setSelectedStaffId(st.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStaffId === st.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <img src={st.avatar} alt={st.name} className="w-4 h-4 rounded-full object-cover" />
            <span>{st.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Timeline Agenda */}
      <div className="px-4 space-y-2.5">
        {dayApts.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">Aucun rendez-vous pour ce jour.</p>
            <p className="text-[11px] text-slate-500">Les réservations effectuées par les clients apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          dayApts.map((apt) => {
            const universeColors: Record<string, string> = {
              homme: 'border-blue-500/50 bg-blue-950/20 text-blue-300',
              femme: 'border-pink-500/50 bg-pink-950/20 text-pink-300',
              enfant: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
              mixte: 'border-purple-500/50 bg-purple-950/20 text-purple-300'
            };

            return (
              <div
                key={apt.id}
                onClick={() => setSelectedAptDetails(apt)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-slate-900/90 hover:border-amber-500/40 relative overflow-hidden ${
                  apt.status === 'in_progress' ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {apt.time}
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      {apt.clientName}
                    </h4>
                  </div>

                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${universeColors[apt.universe] || 'border-slate-700'}`}>
                    {apt.universe}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
                  <span>{apt.serviceName}</span>
                  <span className="text-amber-400 font-bold">{apt.price} {salonInfo.currency}</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-400" />
                    {apt.staffName}
                  </span>
                  <span className={`font-semibold capitalize ${
                    apt.status === 'in_progress' ? 'text-amber-400' :
                    apt.status === 'confirmed' ? 'text-emerald-400' :
                    apt.status === 'completed' ? 'text-blue-400' : 'text-rose-400'
                  }`}>
                    {apt.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Appointment Detail & Status Change Modal */}
      {selectedAptDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:p-4">
          <div className="w-full max-w-md bg-[#12151C] border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl p-5 space-y-4 animate-slide-up shadow-2xl">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto"></div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase">Fiche Rendez-vous</span>
                <h3 className="text-base font-bold text-white font-serif">{selectedAptDetails.clientName}</h3>
              </div>
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Prestation :</span>
                <span className="text-white font-bold">{selectedAptDetails.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Collaborateur :</span>
                <span className="text-amber-300 font-semibold">{selectedAptDetails.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Heure :</span>
                <span className="text-white font-bold">{selectedAptDetails.date} à {selectedAptDetails.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Téléphone client :</span>
                <a href={`tel:${selectedAptDetails.clientPhone}`} className="text-amber-400 font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {selectedAptDetails.clientPhone}
                </a>
              </div>
              {selectedAptDetails.notes && (
                <div className="pt-2 border-t border-slate-800 text-slate-300">
                  <span className="text-slate-400 block">Notes :</span>
                  <p className="italic">"{selectedAptDetails.notes}"</p>
                </div>
              )}
            </div>

            {/* Quick Status Changers */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Changer le statut en 1 clic :</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAptDetails.id, 'in_progress');
                    setSelectedAptDetails(null);
                  }}
                  className="py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>En cours</span>
                </button>

                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAptDetails.id, 'completed');
                    setSelectedAptDetails(null);
                  }}
                  className="py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Terminé</span>
                </button>

                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAptDetails.id, 'cancelled');
                    setSelectedAptDetails(null);
                  }}
                  className="py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
