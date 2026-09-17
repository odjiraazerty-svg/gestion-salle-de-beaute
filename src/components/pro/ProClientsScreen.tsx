import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ClientProfile } from '../../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  MessageCircle, 
  Edit3, 
  Save, 
  X, 
  Sparkles, 
  Star 
} from 'lucide-react';

export const ProClientsScreen: React.FC = () => {
  const { clients, addClient, updateClientNotes, salonInfo } = useSalon();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New client form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUniverse, setNewUniverse] = useState<'homme' | 'femme' | 'enfant' | 'mixte'>('homme');

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleSaveNotes = () => {
    if (selectedClient) {
      updateClientNotes(selectedClient.id, tempNotes);
      setSelectedClient({ ...selectedClient, technicalNotes: tempNotes });
      setIsEditingNotes(false);
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    addClient({
      name: newName,
      phone: newPhone,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80`,
      universePreference: newUniverse,
      technicalNotes: ''
    });

    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Header */}
      <div className="px-4 pt-1 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-serif">
            Fichier Clients (CRM)
          </h2>
          <p className="text-xs text-slate-400">
            {clients.length} clients enregistrés
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou numéro..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="px-4 space-y-2.5">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            Aucun client trouvé pour cette recherche.
          </div>
        ) : (
          filteredClients.map((cli) => (
            <div
              key={cli.id}
              onClick={() => {
                setSelectedClient(cli);
                setTempNotes(cli.technicalNotes || '');
                setIsEditingNotes(false);
              }}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between hover:border-amber-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-amber-500/30">
                  <img src={cli.avatar} alt={cli.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {cli.name}
                    {cli.visitsCount >= 5 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[8px] font-black uppercase">
                        VIP
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400">{cli.phone}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-amber-400 block">
                  {cli.totalSpent} {salonInfo.currency}
                </span>
                <span className="text-[10px] text-slate-500">
                  {cli.visitsCount} visites
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#12151C] border border-slate-800 rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto animate-scaleIn shadow-2xl my-auto flex flex-col">
            <div className="flex justify-between items-start pb-2 border-b border-slate-800/80 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedClient.avatar} 
                  alt={selectedClient.name} 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/40" 
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedClient.name}</h3>
                  <span className="text-[11px] text-amber-400 capitalize">{selectedClient.universePreference} • {selectedClient.loyaltyPoints} Pts</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Contact shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedClient.phone}`}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-750 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Appeler</span>
              </a>

              <a
                href={`https://wa.me/${selectedClient.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600/30 transition"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Visites</span>
                <span className="text-sm font-bold text-white">{selectedClient.visitsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Dépensé</span>
                <span className="text-sm font-bold text-amber-400">{selectedClient.totalSpent} {salonInfo.currency}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Fidélité</span>
                <span className="text-sm font-bold text-emerald-400">{selectedClient.loyaltyPoints} pts</span>
              </div>
            </div>

            {/* Technical Notes / Salon Formulas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Notes & Formules Techniques
                </span>
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold hover:underline"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Modifier</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveNotes}
                    className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold hover:underline"
                  >
                    <Save className="w-3 h-3" />
                    <span>Enregistrer</span>
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <textarea
                  rows={3}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Notez ici les formules de coloration, longueurs de sabot, allergies..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              ) : (
                <p className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 italic">
                  {selectedClient.technicalNotes || "Aucune note technique enregistrée pour le moment."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#12151C] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-scaleIn shadow-2xl my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white font-serif">Ajouter un nouveau client</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Sarah Martin"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: +33 6 12 34 56 78"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: sarah@email.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">Univers principal</label>
                <select
                  value={newUniverse}
                  onChange={(e) => setNewUniverse(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="homme">🧔 Homme / Barbershop</option>
                  <option value="femme">👩 Femme / Beauté</option>
                  <option value="enfant">🧒 Enfants / Junior</option>
                  <option value="mixte">💆 Mixte & Spa</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all mt-2 cursor-pointer uppercase tracking-wider"
              >
                Créer la fiche client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
