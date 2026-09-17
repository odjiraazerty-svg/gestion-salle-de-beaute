import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ServiceItem, SalonUniverse } from '../../types';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  Search,
  Edit3,
  Hash
} from 'lucide-react';
import { ServiceRegistrationModal } from './ServiceRegistrationModal';

export const ProServicesScreen: React.FC = () => {
  const { services, deleteService, salonInfo } = useSalon();

  const [selectedUniverse, setSelectedUniverse] = useState<SalonUniverse>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);

  // Filter services
  const filteredServices = services.filter((s) => {
    const matchUniverse = selectedUniverse === 'all' || s.universe === selectedUniverse || s.universe === 'mixte';
    const sName = (s.name || '').toLowerCase();
    const sCat = (s.subCategory || '').toLowerCase();
    const sDesc = (s.description || '').toLowerCase();
    const sId = (s.id || '').toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = query === '' || sName.includes(query) || sCat.includes(query) || sDesc.includes(query) || sId.includes(query);
    return matchUniverse && matchQuery;
  });

  const handleOpenCreate = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceItem) => {
    setServiceToEdit(service);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Header */}
      <div className="px-4 pt-1 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <Scissors className="w-3.5 h-3.5" />
            <span>Catalogue & Prestations</span>
          </div>
          <h2 className="text-lg font-bold text-white font-serif">
            Prestations du Salon
          </h2>
          <p className="text-xs text-slate-400">
            {services.length} prestation(s) répertoriée(s)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Répertorier</span>
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
            placeholder="Rechercher par nom, description ou ID (ex: SRV-102)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Services List */}
      <div className="px-4 space-y-3">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Aucune prestation trouvée</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Cliquez sur le bouton "Répertorier" pour ajouter vos services avec nom, description et image.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Répertorier un service</span>
            </button>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 transition-all space-y-2.5 relative group"
            >
              <div className="flex gap-3">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {service.id.startsWith('srv-') || service.id.startsWith('SRV-') ? service.id.toUpperCase() : `SRV-${service.id.slice(0, 4).toUpperCase()}`}
                    </span>
                    {service.popular && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold uppercase">
                        Populaire
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug mt-1 truncate">
                    {service.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Bottom bar: ID, Edit & Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Hash className="w-3 h-3 text-slate-600" />
                    <span>{service.id}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(service)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                    title="Modifier la prestation"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer la prestation "${service.name}" ?`)) {
                        deleteService(service.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Supprimer la prestation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dedicated Service Registration Modal */}
      <ServiceRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServiceToEdit(null);
        }}
        serviceToEdit={serviceToEdit}
      />
    </div>
  );
};
