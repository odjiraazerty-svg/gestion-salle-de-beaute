import React, { useState, useEffect, useRef } from 'react';
import { useSalon } from '../../context/SalonContext';
import { ServiceItem, ServiceUnivers } from '../../types';
import { 
  Sparkles, 
  FileText, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Eye, 
  Camera,
  RefreshCw,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrestationRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestationToEdit?: ServiceItem | null;
  onSuccess?: (prestation: ServiceItem) => void;
}

// Preset default luxury beauty images
const DEFAULT_PRESET_IMAGES = [
  {
    title: 'Coiffure & Brushing',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&auto=format&fit=crop&q=80'
  },
  {
    title: 'Barber & Coupe Homme',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=700&auto=format&fit=crop&q=80'
  },
  {
    title: 'Coloration & Balayage',
    url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=700&auto=format&fit=crop&q=80'
  },
  {
    title: 'Nail Art & Ongles',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&auto=format&fit=crop&q=80'
  },
  {
    title: 'Soin Visage & Spa',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&auto=format&fit=crop&q=80'
  },
  {
    title: 'Massage Relaxant',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=700&auto=format&fit=crop&q=80'
  }
];

const UNIVERS_OPTIONS: { id: ServiceUnivers; label: string; icon: string; desc: string }[] = [
  { id: 'Dame', label: 'Dame', icon: '👩', desc: 'Femme & Beauté' },
  { id: 'Homme', label: 'Homme', icon: '👨', desc: 'Barber & Grooming' },
  { id: 'Enfant', label: 'Enfant', icon: '🧒', desc: 'Petits & Juniors' },
  { id: 'Adolescent', label: 'Adolescent', icon: '🧑', desc: 'Styles Tendances' },
];

export const PrestationRegistrationModal: React.FC<PrestationRegistrationModalProps> = ({
  isOpen,
  onClose,
  prestationToEdit,
  onSuccess
}) => {
  const { addService, updateService } = useSalon();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nom, setNom] = useState<string>('');
  const [univers, setUnivers] = useState<ServiceUnivers>('Dame');
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<string>(DEFAULT_PRESET_IMAGES[0].url);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(true);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prestationToEdit) {
        setNom(prestationToEdit.name || prestationToEdit.nom || '');
        setUnivers((prestationToEdit.univers as ServiceUnivers) || (prestationToEdit.universe === 'homme' ? 'Homme' : prestationToEdit.universe === 'enfant' ? 'Enfant' : 'Dame'));
        setDescription(prestationToEdit.description || '');
        setImage(prestationToEdit.image || prestationToEdit.image_ulistration || DEFAULT_PRESET_IMAGES[0].url);
        setFileName('');
      } else {
        setNom('');
        setUnivers('Dame');
        setDescription('');
        setImage(DEFAULT_PRESET_IMAGES[0].url);
        setFileName('');
      }
      setIsSubmitting(false);
      setIsSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, prestationToEdit]);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP...).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('La taille de l\'image ne doit pas dépasser 10 Mo.');
      return;
    }

    setErrorMessage('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim()) {
      setErrorMessage('Veuillez renseigner le nom de la prestation.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Veuillez renseigner une description pour la prestation.');
      return;
    }

    if (!image) {
      setErrorMessage('Veuillez télécharger ou sélectionner une image.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (prestationToEdit) {
        // Mise à jour de la prestation existante en place
        await updateService(prestationToEdit.id_service || prestationToEdit.id, {
          nom: nom.trim(),
          name: nom.trim(),
          univers: univers,
          universe: univers.toLowerCase(),
          description: description.trim(),
          image_ulistration: image,
          image: image
        });
      } else {
        // Enregistrement d'une nouvelle prestation (id_service généré automatiquement)
        await addService({
          nom: nom.trim(),
          name: nom.trim(),
          univers: univers,
          universe: univers.toLowerCase(),
          description: description.trim(),
          image_ulistration: image,
          image: image,
          price: 0,
          duration: 30
        });
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback
      }

      setIsSuccess(true);

      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess({
            id_service: prestationToEdit?.id_service || prestationToEdit?.id || `srv-${Date.now().toString().slice(-4)}`,
            id: prestationToEdit?.id_service || prestationToEdit?.id || `srv-${Date.now().toString().slice(-4)}`,
            nom: nom.trim(),
            name: nom.trim(),
            univers: univers,
            universe: univers.toLowerCase(),
            description: description.trim(),
            image_ulistration: image,
            image: image,
            price: 0,
            duration: 30
          });
        }
        onClose();
      }, 1200);

    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'enregistrement de la prestation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="theme-bg-card border theme-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-auto relative">
        
        {/* Modal Header */}
        <div className="relative p-5 border-b theme-border bg-gradient-to-r from-amber-500/10 via-transparent to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full theme-bg-card rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold theme-text-primary font-serif flex items-center gap-1.5">
                {prestationToEdit ? 'Modifier la Prestation' : 'Enregistrer une Prestation'}
              </h2>
              <p className="text-[11px] theme-text-secondary">
                Répertoire officiel de la plateforme (ID généré automatiquement)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full theme-bg-subtle theme-text-secondary hover:theme-text-primary flex items-center justify-center transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold theme-text-primary">Prestation Enregistrée avec Succès !</h3>
              <p className="text-xs theme-text-secondary mt-1">
                La prestation <strong className="theme-text-accent font-bold">"{nom}"</strong> ({univers}) a été enregistrée en base de données.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. NOM DE LA PRESTATION */}
            <div>
              <label className="block text-xs font-bold theme-text-primary mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 theme-text-accent" />
                <span>Nom de la prestation *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Coupe & Brushing Signature, Soin Visage Éclat, Pose Gel X..."
                className="w-full px-3.5 py-2.5 rounded-xl theme-bg-card border theme-border theme-text-primary placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-semibold shadow-inner"
              />
            </div>

            {/* 2. UNIVERS DE LA PRESTATION (Homme, Dame, Enfant, Adolescent) */}
            <div>
              <label className="block text-xs font-bold theme-text-primary mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 theme-text-accent" />
                <span>Univers * (Homme, Dame, Enfant, Adolescent)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {UNIVERS_OPTIONS.map((opt) => {
                  const isSelected = univers === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setUnivers(opt.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/40' 
                          : 'theme-border theme-bg-card hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{opt.icon}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5">
                        <div className={`text-xs font-bold ${isSelected ? 'text-amber-500' : 'theme-text-primary'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[9px] theme-text-muted leading-tight">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. DESCRIPTION DE LA PRESTATION */}
            <div>
              <label className="block text-xs font-bold theme-text-primary mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 theme-text-accent" />
                <span>Description *</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les caractéristiques de la prestation, les bienfaits, la méthode et le résultat attendu..."
                className="w-full px-3.5 py-2.5 rounded-xl theme-bg-card border theme-border theme-text-primary placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner leading-relaxed"
              />
            </div>

            {/* 3. IMAGE AVEC OPTION DE TÉLÉCHARGEMENT */}
            <div>
              <label className="block text-xs font-bold theme-text-primary mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 theme-text-accent" />
                  <span>Image de la prestation *</span>
                </div>
                <span className="text-[10px] theme-text-muted">Fichier local ou sélection</span>
              </label>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'theme-border theme-bg-card hover:border-amber-500/50 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold theme-text-primary">
                    {fileName ? `Fichier : ${fileName}` : 'Cliquez pour télécharger une image ou glissez-déposez'}
                  </p>
                  <p className="text-[10px] theme-text-secondary mt-0.5">
                    PNG, JPG, WebP ou GIF jusqu'à 10 Mo
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl theme-bg-subtle border theme-border text-xs font-semibold theme-text-accent hover:opacity-80 transition flex items-center gap-1.5 pointer-events-none"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Parcourir mes fichiers</span>
                </button>
              </div>

              {/* Presets Gallery fallback */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block">
                  Ou choisissez parmi notre sélection de photos :
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DEFAULT_PRESET_IMAGES.map((preset, idx) => {
                    const isSelected = image === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          setFileName('');
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                          isSelected 
                            ? 'border-amber-500 shadow-md ring-2 ring-amber-500/30 scale-105' 
                            : 'border-transparent opacity-75 hover:opacity-100 hover:border-amber-400/50'
                        }`}
                        title={preset.title}
                      >
                        <img 
                          src={preset.url} 
                          alt={preset.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3] drop-shadow" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-[2px] p-0.5 text-[8px] text-white text-center font-bold truncate">
                          {preset.title.split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW TOGGLE & CARD */}
            <div className="pt-2 border-t theme-border">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-between w-full text-xs font-bold theme-text-secondary hover:theme-text-primary py-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 theme-text-accent" />
                  <span>Aperçu de la fiche prestation</span>
                </div>
                <span className="text-[10px] font-normal underline">
                  {showPreview ? 'Masquer' : 'Afficher'}
                </span>
              </button>

              {showPreview && (
                <div className="mt-2.5 p-3 rounded-2xl theme-bg-subtle border theme-border flex gap-3 items-center">
                  <img
                    src={image || DEFAULT_PRESET_IMAGES[0].url}
                    alt="Aperçu"
                    className="w-16 h-16 rounded-xl object-cover border theme-border flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold theme-text-primary truncate">
                      {nom || 'Nom de la prestation'}
                    </h4>
                    <p className="text-[10px] theme-text-secondary line-clamp-2 mt-0.5">
                      {description || 'La description de la prestation apparaîtra ici...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider hover:brightness-105 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin stroke-[3]" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>
                  {isSubmitting 
                    ? 'Enregistrement en cours...' 
                    : prestationToEdit 
                      ? 'Mettre à jour la Prestation' 
                      : 'Enregistrer la Prestation'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
