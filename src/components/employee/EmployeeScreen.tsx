import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Play, 
  TrendingUp, 
  DollarSign, 
  Scissors, 
  User, 
  FileText, 
  Award, 
  Sparkles, 
  Coffee, 
  ChevronRight,
  Phone,
  AlertCircle,
  Save,
  Check
} from 'lucide-react';
import { useSalon } from '../../context/SalonContext';
import { Appointment, AppointmentStatus } from '../../types';

export const EmployeeScreen: React.FC = () => {
  const { 
    currentUser, 
    currentStaff, 
    appointments, 
    updateAppointmentStatus, 
    clients, 
    updateClientNotes,
    salonInfo 
  } = useSalon();

  const [activeSubTab, setActiveSubTab] = useState<'today' | 'technical' | 'earnings'>('today');
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false);
  const [selectedAptForNotes, setSelectedAptForNotes] = useState<Appointment | null>(null);
  const [techNotesInput, setTechNotesInput] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Filter appointments assigned to this employee (strictly relative to connected user)
  const staffId = currentStaff?.id || currentUser?.staffId || currentUser?.id || '';
  const staffName = currentStaff?.name || currentUser?.name || '';

  const myAppointments = appointments.filter(a => {
    const matchId = staffId && (a.staffId === staffId || a.id_user === staffId);
    const matchName = staffName && a.staffName && a.staffName.toLowerCase() === staffName.toLowerCase();
    return matchId || matchName;
  });

  // Today's appointments for this staff
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = myAppointments.filter(a => a.date === todayStr || a.status === 'in_progress' || a.status === 'confirmed');

  // Performance calculations relative to connected staff
  const completedApts = myAppointments.filter(a => a.status === 'completed');
  const inProgressApts = myAppointments.filter(a => a.status === 'in_progress');
  const confirmedApts = myAppointments.filter(a => a.status === 'confirmed');

  const totalCAGenerated = completedApts.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const commissionRate = 0.20; // 20% commission
  const totalCommission = Math.round(totalCAGenerated * commissionRate);
  const estimatedTips = completedApts.length * 5; // e.g. 5€ average tip

  // Open note editor
  const handleOpenNotes = (apt: Appointment) => {
    setSelectedAptForNotes(apt);
    const client = clients.find(c => c.name.toLowerCase() === apt.clientName.toLowerCase());
    setTechNotesInput(client?.technicalNotes || apt.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedAptForNotes) {
      const client = clients.find(c => c.name.toLowerCase() === selectedAptForNotes.clientName.toLowerCase());
      if (client) {
        updateClientNotes(client.id, techNotesInput);
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setSelectedAptForNotes(null);
      }, 1500);
    }
  };

  return (
    <div className="pb-24 pt-2 px-3.5 max-w-md mx-auto text-slate-100 animate-fadeIn">
      {/* Staff Hero Bar */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-blue-500/20 shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={currentStaff?.avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} 
                alt="staff" 
                className="w-13 h-13 rounded-2xl object-cover border-2 border-blue-400/40 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isOnBreak ? 'bg-amber-400' : 'bg-emerald-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-400 tracking-wide uppercase flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                <span>Espace Collaborateur</span>
              </div>
              <h2 className="text-base font-bold text-white leading-tight">
                {currentStaff?.name || currentUser?.name || 'Alexandre Meyer'}
              </h2>
              <div className="text-[11px] text-slate-400">
                {currentStaff?.role || 'Master Barber & Styliste'}
              </div>
            </div>
          </div>

          {/* Break toggle button */}
          <button
            type="button"
            onClick={() => setIsOnBreak(!isOnBreak)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              isOnBreak 
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{isOnBreak ? 'En Pause' : 'Disponible'}</span>
          </button>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-800/80 text-center">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">RDV Aujourd'hui</div>
            <div className="text-base font-bold text-white">{todayApts.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Soins Terminés</div>
            <div className="text-base font-bold text-emerald-400">{completedApts.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Commissions Est.</div>
            <div className="text-base font-bold text-amber-400">{totalCommission} {salonInfo.currency}</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('today')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'today'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Mes Soins du Jour</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('technical')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'technical'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Fiches Techniques</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('earnings')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'earnings'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Mes Gains</span>
        </button>
      </div>

      {/* TAB 1: TODAY APPOINTMENTS & ACTIONS */}
      {activeSubTab === 'today' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Ordre chronologique</span>
            <span className="text-amber-400 font-semibold">{todayApts.length} rendez-vous programmés</span>
          </div>

          {todayApts.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Aucun rendez-vous aujourd'hui</p>
              <p className="text-xs text-slate-500 mt-1">Profitez-en pour préparer votre poste de travail !</p>
            </div>
          ) : (
            todayApts.map((apt) => {
              const isOngoing = apt.status === 'in_progress';
              const isDone = apt.status === 'completed';
              const isConf = apt.status === 'confirmed';

              return (
                <div 
                  key={apt.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOngoing 
                      ? 'bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border-blue-400/60 shadow-lg shadow-blue-500/10'
                      : isDone
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top line: Time & Status Pill */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.time} ({apt.duration} min)
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isOngoing 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/40 animate-pulse'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    }`}>
                      {isOngoing ? '✂️ En cours de soin' : isDone ? '✓ Réalisé' : 'À venir'}
                    </span>
                  </div>

                  {/* Client & Service Info */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {apt.clientName}
                      </h4>
                      <span className="text-xs font-semibold text-slate-300">
                        {apt.price} {salonInfo.currency}
                      </span>
                    </div>
                    <div className="text-xs text-amber-300/90 font-medium mt-0.5">
                      {apt.serviceName}
                    </div>
                    {apt.notes && (
                      <div className="text-[11px] text-slate-400 italic mt-1 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80">
                        "{apt.notes}"
                      </div>
                    )}
                  </div>

                  {/* Action Bar for Employee */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    {isConf && (
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Démarrer le Soin</span>
                      </button>
                    )}

                    {isOngoing && (
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Terminer la Prestation</span>
                      </button>
                    )}

                    {isDone && (
                      <div className="flex-1 text-center py-1.5 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Prestation validée</span>
                      </div>
                    )}

                    {/* Technical Notes Action */}
                    <button
                      type="button"
                      onClick={() => handleOpenNotes(apt)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
                      title="Fiche technique & préférences client"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Fiche</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: TECHNICAL RECORDS */}
      {activeSubTab === 'technical' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <p className="font-semibold text-amber-400 mb-0.5">Carnet de Fiches Techniques</p>
            <p className="text-[11px] text-slate-400">
              Consultez et ajustez les formules de couleur, réglages de coupe et préférences pour chaque client.
            </p>
          </div>

          <div className="space-y-2.5">
            {clients.map((client) => (
              <div 
                key={client.id}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={client.avatar} 
                      alt={client.name} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{client.name}</div>
                      <div className="text-[10px] text-slate-400">{client.phone}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-medium">
                    {client.visitsCount} visites
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 mb-2 font-mono">
                  {client.technicalNotes || 'Aucune note technique enregistrée pour ce client.'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAptForNotes({ clientName: client.name } as Appointment);
                    setTechNotesInput(client.technicalNotes || '');
                  }}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modifier la formule / note technique</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EARNINGS & COMMISSIONS */}
      {activeSubTab === 'earnings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Rémunération du jour
            </div>
            <div className="text-3xl font-extrabold text-white">
              {totalCommission + estimatedTips} {salonInfo.currency}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Commissions ({totalCommission}€) + Pourboires estimés ({estimatedTips}€)
            </div>

            {/* Progress to target */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Objectif journalier (150€)</span>
                <span className="font-bold text-amber-300">
                  {Math.min(100, Math.round(((totalCommission + estimatedTips) / 150) * 100))}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((totalCommission + estimatedTips) / 150) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white mb-2">Détail des prestations exécutées</div>
            {completedApts.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Aucune prestation validée aujourd'hui pour le moment.
              </div>
            ) : (
              completedApts.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800 last:border-0">
                  <div>
                    <div className="font-semibold text-slate-200">{apt.serviceName}</div>
                    <div className="text-[10px] text-slate-400">{apt.clientName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">+{Math.round(apt.price * commissionRate)} {salonInfo.currency}</div>
                    <div className="text-[10px] text-slate-500">CA: {apt.price}€</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {selectedAptForNotes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Fiche Technique : {selectedAptForNotes.clientName}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Indiquez la formule de couleur, numéros de sabots, temps de pose ou allergies.
            </p>

            {savedSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Fiche technique enregistrée avec succès dans PostgreSQL !</span>
              </div>
            ) : (
              <>
                <textarea
                  value={techNotesInput}
                  onChange={(e) => setTechNotesInput(e.target.value)}
                  placeholder="Ex: Formule patine 9.12 (30g) + oxydant 10V (60g). Dégradé à blanc sabot 0.5. Cire mate."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAptForNotes(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-110 flex items-center justify-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
