import React, { useState, useEffect, useRef } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ServiceItem, ServiceUnivers } from '../../types';
import { api } from '../../services/api';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  Camera, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Coins, 
  Store,
  Layers,
  CheckCircle2,
  X,
  Upload,
  Scissors,
  Search,
  CheckSquare,
  Square,
  Sliders,
  DollarSign,
  Plus,
  Loader2,
  Trash2,
  ListPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SalonRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSalonId: string) => void;
}

// Preset luxury covers
const PRESET_COVERS = [
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&auto=format&fit=crop&q=80',
    title: 'Salon Chic & Lumineux'
  },
  {
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1000&auto=format&fit=crop&q=80',
    title: 'Lounge Moderne & Glamour'
  },
  {
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80',
    title: 'Barber Club Vintage'
  },
  {
    url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1000&auto=format&fit=crop&q=80',
    title: 'Spa & Zen Sanctuary'
  }
];

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80'
];

interface SelectedPrestationState {
  selected: boolean;
  cout: number;
  duree: number;
}

export const SalonRegistrationModal: React.FC<SalonRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addSalon, selectSalon, currentUser } = useSalon();
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successCreated, setSuccessCreated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [coverFileName, setCoverFileName] = useState<string>('');

  // Step 4: Prestations catalog loaded directly from API
  const [availableCatalogServices, setAvailableCatalogServices] = useState<ServiceItem[]>([]);
  const [isLoadingCatalogServices, setIsLoadingCatalogServices] = useState<boolean>(false);
  const [selectedServicesMap, setSelectedServicesMap] = useState<Record<string, SelectedPrestationState>>({});
  const [serviceUniverseFilter, setServiceUniverseFilter] = useState<string>('all');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');

  // Inline custom service creation
  const [isCreatingCustomService, setIsCreatingCustomService] = useState<boolean>(false);
  const [isSavingCustomService, setIsSavingCustomService] = useState<boolean>(false);
  const [newServiceForm, setNewServiceForm] = useState({
    nom: '',
    univers: 'Dame',
    description: '',
    cout: 5000,
    duree: 30
  });

  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState<string>('');
  const [prestationFeedback, setPrestationFeedback] = useState<string>('');

  // Initial Form State
  const initialFormData = {
    name: '',
    tagline: '',
    universeType: 'mixte',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    currency: 'FCFA',
    openingDays: 'Mardi au Samedi',
    openingHours: '09:00 - 19:30',
    logo: PRESET_LOGOS[0],
    coverImage: PRESET_COVERS[0].url
  };

  const [formData, setFormData] = useState(initialFormData);

  // Initialize and Reset form whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSubmitting(false);
      setSuccessCreated(false);
      setErrorMsg('');
      setPrestationFeedback('');
      setCoverFileName('');
      setFormData(initialFormData);
      setServiceUniverseFilter('all');
      setServiceSearchQuery('');
      setIsCreatingCustomService(false);

      // Load all global predefined services from platform database
      setIsLoadingCatalogServices(true);
      api.getServices()
        .then((catServices) => {
          setAvailableCatalogServices(catServices);
          // Start with empty prestations for the new salon so owner adds them one by one
          setSelectedServicesMap({});
          if (catServices.length > 0) {
            setSelectedCatalogServiceId(catServices[0].id);
            setNewServiceForm({
              nom: catServices[0].nom || catServices[0].name,
              univers: catServices[0].univers || catServices[0].universe || 'Dame',
              description: catServices[0].description || '',
              cout: catServices[0].price || 5000,
              duree: catServices[0].duration || 30
            });
          }
        })
        .catch((err) => {
          console.error('Erreur chargement catalogue prestations:', err);
        })
        .finally(() => {
          setIsLoadingCatalogServices(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleFileUpload = (file: File, field: 'coverImage' | 'logo') => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP...).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('La taille de l\'image ne doit pas dépasser 10 Mo.');
      return;
    }
    setErrorMsg('');
    if (field === 'coverImage') {
      setCoverFileName(file.name);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, [field]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleServiceSelection = (serviceId: string, defaultPrice?: number, defaultDuration?: number) => {
    setSelectedServicesMap(prev => {
      const current = prev[serviceId];
      if (current) {
        return {
          ...prev,
          [serviceId]: {
            ...current,
            selected: !current.selected
          }
        };
      }
      return {
        ...prev,
        [serviceId]: {
          selected: true,
          cout: defaultPrice || 5000,
          duree: defaultDuration || 30
        }
      };
    });
  };

  const removePrestationFromSalon = (serviceId: string) => {
    setSelectedServicesMap(prev => {
      const nextMap = { ...prev };
      delete nextMap[serviceId];
      return nextMap;
    });
    const srv = availableCatalogServices.find(s => s.id === serviceId);
    setPrestationFeedback(`Prestation "${srv?.nom || srv?.name || 'Service'}" retirée du salon.`);
    setTimeout(() => setPrestationFeedback(''), 2500);
  };

  const updateServiceCout = (serviceId: string, cout: number) => {
    setSelectedServicesMap(prev => ({
      ...prev,
      [serviceId]: {
        selected: prev[serviceId]?.selected ?? true,
        duree: prev[serviceId]?.duree ?? 30,
        cout
      }
    }));
  };

  const updateServiceDuree = (serviceId: string, duree: number) => {
    setSelectedServicesMap(prev => ({
      ...prev,
      [serviceId]: {
        selected: prev[serviceId]?.selected ?? true,
        cout: prev[serviceId]?.cout ?? 5000,
        duree
      }
    }));
  };

  const handleSelectAllServices = (selectAll: boolean) => {
    if (!selectAll) {
      setSelectedServicesMap({});
      return;
    }
    setSelectedServicesMap(prev => {
      const nextMap: Record<string, SelectedPrestationState> = {};
      availableCatalogServices.forEach(s => {
        nextMap[s.id] = {
          selected: true,
          cout: prev[s.id]?.cout || s.price || 5000,
          duree: prev[s.id]?.duree || s.duration || 30
        };
      });
      return nextMap;
    });
  };

  const handleSaveCustomService = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!newServiceForm.nom.trim()) {
      setErrorMsg('Veuillez renseigner le nom de la prestation.');
      return;
    }

    try {
      setIsSavingCustomService(true);
      const created = await api.createService({
        nom: newServiceForm.nom.trim(),
        name: newServiceForm.nom.trim(),
        univers: newServiceForm.univers,
        universe: newServiceForm.univers,
        description: newServiceForm.description.trim() || 'Prestation personnalisée ajoutée au catalogue',
        price: newServiceForm.cout,
        duration: newServiceForm.duree,
        subCategory: 'Prestation'
      });

      setAvailableCatalogServices(prev => [created, ...prev]);
      setSelectedCatalogServiceId(created.id);
      setSelectedServicesMap(prev => ({
        ...prev,
        [created.id]: {
          selected: true,
          cout: newServiceForm.cout,
          duree: newServiceForm.duree
        }
      }));

      setIsCreatingCustomService(false);
      setPrestationFeedback(`✓ Prestation "${created.nom || created.name}" enregistrée et ajoutée au salon !`);
      setTimeout(() => setPrestationFeedback(''), 3000);
      setNewServiceForm({
        nom: '',
        univers: 'Dame',
        description: '',
        cout: 5000,
        duree: 30
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création de la prestation.');
    } finally {
      setIsSavingCustomService(false);
    }
  };

  const handleApplyCurrentPrestation = () => {
    if (isCreatingCustomService) {
      handleSaveCustomService();
      return;
    }

    const targetId = selectedCatalogServiceId || availableCatalogServices[0]?.id;
    if (!targetId) return;

    setSelectedServicesMap(prev => ({
      ...prev,
      [targetId]: {
        selected: true,
        cout: newServiceForm.cout,
        duree: newServiceForm.duree
      }
    }));

    const srv = availableCatalogServices.find(s => s.id === targetId);
    setPrestationFeedback(`✓ Prestation "${srv?.nom || srv?.name}" configurée (${newServiceForm.cout.toLocaleString()} ${formData.currency}, ${newServiceForm.duree} min) !`);
    setTimeout(() => setPrestationFeedback(''), 3000);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setErrorMsg('Veuillez renseigner le nom de votre salon');
        return;
      }
    }
    if (step === 2) {
      if (!formData.address.trim() || !formData.city.trim()) {
        setErrorMsg('Veuillez renseigner au moins l\'adresse et la ville');
        return;
      }
    }
    if (step === 4) {
      if (selectedCount === 0) {
        setErrorMsg('Veuillez activer au moins une prestation pour ce salon avant de continuer.');
        return;
      }
    }
    setErrorMsg('');
    setStep(prev => prev + 1);
  };

  const selectedCount = Object.values(selectedServicesMap).filter(v => v.selected).length;

  // Filter predefined services for step 4
  const filteredServices = availableCatalogServices.filter((srv) => {
    const sName = (srv.nom || srv.name || '').toLowerCase();
    const sCat = (srv.subCategory || '').toLowerCase();
    const sUniv = (srv.univers || srv.universe || '').toLowerCase();
    const query = serviceSearchQuery.trim().toLowerCase();

    const matchesQuery = query === '' || sName.includes(query) || sCat.includes(query);
    const matchesUniverse = serviceUniverseFilter === 'all' || 
      sUniv === serviceUniverseFilter.toLowerCase() || 
      sUniv === 'mixte';

    return matchesQuery && matchesUniverse;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Collect configured prestations for this salon
    const prestations = Object.entries(selectedServicesMap)
      .filter(([_, state]) => state.selected)
      .map(([serviceId, state]) => {
        const srv = availableCatalogServices.find(s => s.id === serviceId);
        return {
          serviceId,
          cout: state.cout,
          duree: state.duree,
          nom: srv?.nom || srv?.name || '',
          univers: srv?.univers || srv?.universe || '',
          description: srv?.description || '',
          image: srv?.image || srv?.image_ulistration || ''
        };
      });

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const effectiveOwnerUserId = currentUser?.id || currentUser?.id_user;
      const created = await addSalon({
        name: formData.name.trim(),
        tagline: formData.tagline.trim() || 'Salon de Beauté & Bien-être',
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        phone: formData.phone.trim() || '+225 01 00 00 00 00',
        email: formData.email.trim() || 'contact@salon.com',
        currency: formData.currency,
        universe: formData.universeType,
        univers: formData.universeType,
        universeType: formData.universeType,
        logo: formData.logo,
        coverImage: formData.coverImage,
        openingDays: formData.openingDays,
        openingHours: formData.openingHours,
        ownerId: effectiveOwnerUserId,
        id_user: effectiveOwnerUserId,
        prestations
      });

      // Automatically switch to the newly created salon
      if (created && created.id) {
        selectSalon(created.id);
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }

      setSuccessCreated(true);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess && created) onSuccess(created.id);
        onClose();
      }, 1400);

    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'enregistrement du salon');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="theme-bg-card border theme-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-auto relative flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="relative p-4 sm:p-5 border-b theme-border bg-gradient-to-r from-amber-500/10 via-transparent to-transparent flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full theme-bg-subtle theme-text-secondary hover:theme-text-primary flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full theme-bg-card rounded-[14px] flex items-center justify-center">
                <Store className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold theme-text-primary font-serif flex items-center gap-1.5">
                Répertorier un Salon de Beauté
              </h2>
              <p className="text-[11px] theme-text-secondary">
                Établissement & Prestations offertes
              </p>
            </div>
          </div>

          {/* Stepper indicator (5 STEPS) */}
          <div className="flex items-center justify-between mt-3.5 px-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-1 sm:gap-1.5">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s 
                      ? 'theme-btn-primary text-white scale-110 shadow-sm' 
                      : step > s 
                        ? 'bg-emerald-500 text-white' 
                        : 'theme-bg-subtle theme-text-muted border theme-border'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-semibold hidden xs:inline ${
                  step === s ? 'theme-text-primary font-bold' : 'theme-text-muted'
                }`}>
                  {s === 1 ? 'Identité' : s === 2 ? 'Contact' : s === 3 ? 'Visuels' : s === 4 ? 'Prestations' : 'Récapitulatif'}
                </span>
                {s < 5 && <ChevronRight className="w-3 h-3 theme-text-muted opacity-40" />}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        {successCreated ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold theme-text-primary">Salon Répertorié avec Succès !</h3>
              <p className="text-xs theme-text-secondary mt-1">
                Bienvenue à <strong className="theme-text-accent font-bold">"{formData.name}"</strong> sur la plateforme.
              </p>
              <p className="text-[11px] text-emerald-400 mt-2 font-semibold">
                ✓ {selectedCount} prestation(s) configurée(s) et liées à votre établissement.
              </p>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit} 
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { 
                e.preventDefault(); 
              } 
            }}
            className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
          >
            
            {/* Error message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-shake">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: IDENTITÉ DU SALON */}
            {step === 1 && (
              <div className="space-y-3.5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold theme-text-primary mb-1">
                    Nom de l'établissement *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-3 theme-text-muted" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ex: L'Atelier Beauté & Spa, Barber Lounge..."
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold theme-text-primary mb-1">
                    Slogan ou signature
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Soins haute couture & Coiffure premium"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Devise monétaire
                    </label>
                    <div className="relative">
                      <Coins className="w-4 h-4 absolute left-3 top-3 theme-text-muted" />
                      <select
                        value={formData.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                      >
                        <option value="FCFA">FCFA (XOF / XAF)</option>
                        <option value="€">EUR (€)</option>
                        <option value="$">USD ($)</option>
                        <option value="CHF">CHF</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Univers principal
                    </label>
                    <select
                      value={formData.universeType}
                      onChange={(e) => handleChange('universeType', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                    >
                      <option value="mixte">Mixte (Dame & Homme)</option>
                      <option value="femme">Dame (Beauté & Soins)</option>
                      <option value="homme">Homme (Barber & Coiffure)</option>
                      <option value="enfant">Enfant & Adolescent</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCALISATION & COORDONNÉES */}
            {step === 2 && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Ville *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 theme-text-muted" />
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Ex: Abidjan, Paris..."
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Code Postal / Quartier
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cocody, Plateau..."
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold theme-text-primary mb-1">
                    Adresse physique complète *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rue des Jardins, Immeuble Horizon, RDC"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Téléphone de contact
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 theme-text-muted" />
                      <input
                        type="tel"
                        placeholder="Ex: +225 07 00 00 00"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 theme-text-muted" />
                      <input
                        type="email"
                        placeholder="contact@salon.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Jours d'ouverture
                    </label>
                    <input
                      type="text"
                      placeholder="Mardi au Samedi"
                      value={formData.openingDays}
                      onChange={(e) => handleChange('openingDays', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold theme-text-primary mb-1">
                      Horaires d'ouverture
                    </label>
                    <input
                      type="text"
                      placeholder="09:00 - 19:30"
                      value={formData.openingHours}
                      onChange={(e) => handleChange('openingHours', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: VISUELS & PHOTOS */}
            {step === 3 && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Photo de couverture */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold theme-text-primary">
                      Photo de couverture
                    </label>
                    <span className="text-[10px] theme-text-muted">
                      {coverFileName ? coverFileName : 'Fichier local ou choix'}
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={coverFileInputRef}
                    onChange={(e) => {
                      const f = e.target.files;
                      if (f && f.length > 0) handleFileUpload(f[0], 'coverImage');
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Upload button */}
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="w-full mb-2.5 p-2.5 rounded-2xl border-2 border-dashed theme-border hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs font-semibold theme-text-secondary hover:theme-text-primary transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>{coverFileName ? `Changer l'image (${coverFileName})` : 'Télécharger une photo de mon salon'}</span>
                  </button>

                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {PRESET_COVERS.map((cov, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleChange('coverImage', cov.url);
                          setCoverFileName('');
                        }}
                        className={`relative h-14 rounded-xl overflow-hidden border transition cursor-pointer ${
                          formData.coverImage === cov.url
                            ? 'ring-2 ring-amber-500 scale-95'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={cov.url} alt={cov.title} className="w-full h-full object-cover" />
                        {formData.coverImage === cov.url && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo du salon */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold theme-text-primary">
                      Logo du salon
                    </label>
                  </div>

                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={(e) => {
                      const f = e.target.files;
                      if (f && f.length > 0) handleFileUpload(f[0], 'logo');
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border theme-border relative group flex-shrink-0">
                      <img src={formData.logo} alt="logo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold"
                      >
                        Changer
                      </button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {PRESET_LOGOS.map((lg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChange('logo', lg)}
                          className={`w-10 h-10 rounded-xl overflow-hidden border transition cursor-pointer ${
                            formData.logo === lg ? 'ring-2 ring-amber-500' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={lg} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="p-3 rounded-2xl theme-bg-subtle border theme-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider theme-text-accent mb-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Aperçu de la carte
                  </div>
                  <div className="relative rounded-xl overflow-hidden border theme-border h-20">
                    <img src={formData.coverImage} alt="cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 flex flex-col justify-end">
                      <div className="flex items-center gap-2">
                        <img src={formData.logo} alt="logo" className="w-6 h-6 rounded-lg object-cover border border-white/50" />
                        <div>
                          <div className="text-white text-xs font-bold truncate">{formData.name || 'Nom de votre Salon'}</div>
                          <div className="text-white/80 text-[10px] truncate">{formData.city || 'Ville'} • {formData.currency}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: FORMULAIRE DES PRESTATIONS DU SALON */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Intro Card */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs theme-text-primary space-y-1">
                  <div className="flex items-center gap-1.5 font-bold theme-text-accent">
                    <Scissors className="w-4 h-4" />
                    <span>Renseignez les prestations proposées par votre salon</span>
                  </div>
                  <p className="text-[11px] theme-text-secondary leading-relaxed">
                    Sélectionnez les prestations dans le catalogue ou créez-en de nouvelles, puis précisez le <strong>coût ({formData.currency})</strong> et la <strong>durée</strong> pratiqués chez vous.
                  </p>
                </div>

                {/* Formulaire d'ajout / saisie d'une prestation */}
                <div className="p-3.5 rounded-2xl theme-bg-card border theme-border shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b theme-border pb-2">
                    <span className="text-xs font-bold theme-text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sélectionner et ajouter une prestation</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllServices(true)}
                      className="text-[10px] font-bold theme-text-accent hover:underline cursor-pointer"
                    >
                      ⚡ Tout importer du catalogue ({availableCatalogServices.length})
                    </button>
                  </div>

                  {prestationFeedback && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn font-semibold">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{prestationFeedback}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {/* 1. Choix du service dans la table services */}
                    <div>
                      <label className="block text-[11px] font-bold theme-text-primary mb-1">
                        Prestation (issu du catalogue des services) *
                      </label>
                      <select
                        value={isCreatingCustomService ? '__custom__' : selectedCatalogServiceId || availableCatalogServices[0]?.id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsCreatingCustomService(true);
                          } else {
                            setIsCreatingCustomService(false);
                            setSelectedCatalogServiceId(val);
                            const found = availableCatalogServices.find(s => s.id === val);
                            if (found) {
                              setNewServiceForm(prev => ({
                                ...prev,
                                nom: found.nom || found.name,
                                univers: found.univers || found.universe || 'Dame',
                                description: found.description || '',
                                cout: selectedServicesMap[found.id]?.cout || found.price || 5000,
                                duree: selectedServicesMap[found.id]?.duree || found.duration || 30
                              }));
                            }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                      >
                        <optgroup label="✨ Prestations du Catalogue">
                          {availableCatalogServices.map(srv => (
                            <option key={srv.id} value={srv.id}>
                              {srv.nom || srv.name} — {srv.univers || srv.universe || 'Mixte'} {selectedServicesMap[srv.id]?.selected ? '✓ (Déjà ajouté)' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="➕ Personnalisée">
                          <option value="__custom__">+ Saisir une nouvelle prestation sur-mesure...</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Formulaire spécifique si nouvelle prestation sur-mesure */}
                    {isCreatingCustomService && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 animate-fadeIn">
                        <div>
                          <label className="block text-[10px] font-bold theme-text-primary mb-1">
                            Nom de la nouvelle prestation *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Tissage Brésilien, Soin Barbe Royal..."
                            value={newServiceForm.nom}
                            onChange={(e) => setNewServiceForm(prev => ({ ...prev, nom: e.target.value }))}
                            className="w-full px-3 py-1.5 rounded-xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold theme-text-primary mb-1">
                              Univers
                            </label>
                            <select
                              value={newServiceForm.univers}
                              onChange={(e) => setNewServiceForm(prev => ({ ...prev, univers: e.target.value }))}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                            >
                              <option value="Dame">Dame (Femme)</option>
                              <option value="Homme">Homme</option>
                              <option value="Enfant">Enfant</option>
                              <option value="Adolescent">Adolescent</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold theme-text-primary mb-1">
                              Description courte
                            </label>
                            <input
                              type="text"
                              placeholder="Description..."
                              value={newServiceForm.description}
                              onChange={(e) => setNewServiceForm(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            disabled={isSavingCustomService}
                            onClick={handleSaveCustomService}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {isSavingCustomService ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                            <span>Créer et ajouter au catalogue</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Saisie Coût et Durée */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold theme-text-primary mb-1 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 theme-text-accent" />
                          <span>Tarif ({formData.currency}) *</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          placeholder="Ex: 5000"
                          value={newServiceForm.cout}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setNewServiceForm(prev => ({ ...prev, cout: val }));
                            const activeId = selectedCatalogServiceId || availableCatalogServices[0]?.id;
                            if (activeId && !isCreatingCustomService && selectedServicesMap[activeId]?.selected) {
                              updateServiceCout(activeId, val);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold theme-text-primary mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 theme-text-accent" />
                          <span>Durée (minutes) *</span>
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          placeholder="Ex: 30"
                          value={newServiceForm.duree}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 30;
                            setNewServiceForm(prev => ({ ...prev, duree: val }));
                            const activeId = selectedCatalogServiceId || availableCatalogServices[0]?.id;
                            if (activeId && !isCreatingCustomService && selectedServicesMap[activeId]?.selected) {
                              updateServiceDuree(activeId, val);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                        />
                      </div>
                    </div>

                    {/* Quick duration presets */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] theme-text-muted">Raccourcis :</span>
                      {[15, 30, 45, 60, 90, 120].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setNewServiceForm(prev => ({ ...prev, duree: m }));
                            const activeId = selectedCatalogServiceId || availableCatalogServices[0]?.id;
                            if (activeId && !isCreatingCustomService && selectedServicesMap[activeId]?.selected) {
                              updateServiceDuree(activeId, m);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            newServiceForm.duree === m
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'theme-bg-subtle theme-text-secondary border-transparent hover:border-amber-500/30'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>

                    {/* Bouton d'ajout / mise à jour un par un */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleApplyCurrentPrestation}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>
                          {selectedServicesMap[selectedCatalogServiceId || '']?.selected
                            ? 'Mettre à jour cette prestation dans le tableau'
                            : 'Ajouter cette prestation au salon'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* TABLEAU DES PRESTATIONS AJOUTÉES AU SALON */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold theme-text-primary flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 theme-text-accent" />
                        <span>Tableau des prestations du salon</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">
                        {selectedCount} ajoutée(s)
                      </span>
                    </div>

                    {selectedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectAllServices(false)}
                        className="text-[10px] text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Vider la liste
                      </button>
                    )}
                  </div>

                  {/* Empty state or Prestations Table */}
                  {selectedCount === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed theme-border text-center space-y-2 theme-bg-subtle/30">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                        <Scissors className="w-5 h-5 opacity-60" />
                      </div>
                      <div>
                        <p className="text-xs font-bold theme-text-primary">
                          Aucune prestation ajoutée pour le moment
                        </p>
                        <p className="text-[11px] theme-text-secondary mt-0.5 max-w-xs mx-auto">
                          Sélectionnez une prestation dans le menu ci-dessus, ajustez le tarif et la durée, puis cliquez sur <strong>"Ajouter cette prestation au salon"</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border theme-border overflow-hidden theme-bg-card shadow-sm max-h-[35vh] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="theme-bg-subtle border-b theme-border text-[10px] uppercase font-bold theme-text-secondary sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3">Prestation</th>
                            <th className="py-2.5 px-2 text-center">Univers</th>
                            <th className="py-2.5 px-2 text-right">Tarif ({formData.currency})</th>
                            <th className="py-2.5 px-2 text-right">Durée</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y theme-border">
                          {Object.entries(selectedServicesMap)
                            .filter(([_, state]) => state.selected)
                            .map(([serviceId, state]) => {
                              const srv = availableCatalogServices.find(s => s.id === serviceId);
                              return (
                                <tr key={serviceId} className="hover:bg-amber-500/5 transition">
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold theme-text-primary">
                                      {srv?.nom || srv?.name || 'Prestation'}
                                    </div>
                                    {srv?.description && (
                                      <div className="text-[10px] theme-text-secondary truncate max-w-[140px]">
                                        {srv.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                      {srv?.univers || srv?.universe || 'Mixte'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={state.cout}
                                        onChange={(e) => updateServiceCout(serviceId, parseFloat(e.target.value) || 0)}
                                        className="w-16 px-1.5 py-1 rounded-lg text-xs font-bold text-right theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <input
                                        type="number"
                                        min="5"
                                        step="5"
                                        value={state.duree}
                                        onChange={(e) => updateServiceDuree(serviceId, parseInt(e.target.value, 10) || 30)}
                                        className="w-12 px-1.5 py-1 rounded-lg text-xs font-bold text-right theme-bg-subtle border theme-border theme-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      />
                                      <span className="text-[10px] theme-text-muted">m</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removePrestationFromSalon(serviceId)}
                                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition cursor-pointer inline-flex items-center justify-center"
                                      title="Retirer cette prestation"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: RÉCAPITULATIF & VALIDATION FINALE */}
            {step === 5 && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs theme-text-primary space-y-1">
                  <div className="flex items-center gap-1.5 font-bold theme-text-accent">
                    <Sparkles className="w-4 h-4" />
                    <span>Vérifiez les informations avant l'enregistrement final</span>
                  </div>
                  <p className="text-[11px] theme-text-secondary leading-relaxed">
                    Assurez-vous que l'identité, les coordonnées, les horaires et les prestations configurées correspondent bien à votre établissement.
                  </p>
                </div>

                {/* Salon Card Preview */}
                <div className="rounded-2xl border theme-border overflow-hidden theme-bg-card shadow-sm">
                  <div className="relative h-28 w-full bg-slate-900">
                    <img
                      src={formData.coverImage}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white/80 shadow-md flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-white">
                        <h3 className="font-bold text-sm truncate">{formData.name || 'Nom du Salon'}</h3>
                        <p className="text-[11px] text-white/80 truncate">{formData.tagline || 'Salon de Beauté'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] uppercase flex-shrink-0">
                        {formData.universeType}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px] theme-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 theme-text-accent flex-shrink-0" />
                        <span className="truncate">{formData.address}, {formData.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 theme-text-accent flex-shrink-0" />
                        <span className="truncate">{formData.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 theme-text-accent flex-shrink-0" />
                        <span className="truncate">{formData.email || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 theme-text-accent flex-shrink-0" />
                        <span className="truncate">{formData.openingDays} ({formData.openingHours})</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t theme-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold theme-text-primary">
                        <span className="flex items-center gap-1">
                          <Scissors className="w-3.5 h-3.5 theme-text-accent" />
                          Prestations configurées ({selectedCount})
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="text-[10px] text-amber-500 hover:underline font-semibold cursor-pointer"
                        >
                          Modifier
                        </button>
                      </div>

                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {Object.entries(selectedServicesMap)
                          .filter(([_, state]) => state.selected)
                          .map(([serviceId, state]) => {
                            const srv = availableCatalogServices.find(s => s.id === serviceId);
                            return (
                              <div
                                key={serviceId}
                                className="flex items-center justify-between p-2 rounded-xl theme-bg-subtle text-[11px]"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="font-bold theme-text-primary truncate block">
                                    {srv?.nom || srv?.name || 'Prestation'}
                                  </span>
                                  <span className="text-[10px] theme-text-secondary">
                                    {srv?.univers || srv?.universe || 'Mixte'}
                                  </span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-extrabold theme-text-accent">
                                    {state.cout.toLocaleString()} {formData.currency}
                                  </div>
                                  <div className="text-[10px] theme-text-muted">
                                    {state.duree} min
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2 border-t theme-border flex-shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold theme-text-secondary hover:theme-text-primary transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
              ) : <div />}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-2xl theme-btn-primary font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider hover:brightness-105 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>Confirmer et Créer le Salon ({selectedCount} prest.)</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
