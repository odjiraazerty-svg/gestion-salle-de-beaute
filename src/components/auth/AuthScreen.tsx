import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  MapPin,
  Home,
  ShieldCheck
} from 'lucide-react';
import { useSalon } from '../../context/SalonContext';
import { SalonUniverse, UserRole } from '../../types';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    register, 
    loginAsDemo, 
    salons, 
    currentSalon, 
    theme, 
    setTheme 
  } = useSalon();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Selected space / role for authentication and registration
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register form state (Common)
  const [regName, setRegName] = useState<string>('');
  const [regCity, setRegCity] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Register form state (Client specific)
  const [regUniverse, setRegUniverse] = useState<SalonUniverse>('femme');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  // Update role tab
  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Handle Login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Veuillez renseigner votre adresse email.');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage('Veuillez renseigner votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(loginEmail, loginPassword, selectedRole);
      if (!success) {
        setErrorMessage('Identifiants incorrects. Veuillez vérifier votre saisie.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Identifiants incorrects. Veuillez vérifier votre saisie.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Common fields validation
    if (!regName.trim()) {
      setErrorMessage('Veuillez renseigner votre Nom et Prénoms.');
      return;
    }
    if (!regCity.trim()) {
      setErrorMessage('Veuillez renseigner votre Ville.');
      return;
    }
    if (!regAddress.trim()) {
      setErrorMessage('Veuillez renseigner votre Adresse.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Veuillez renseigner votre Adresse email.');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Veuillez renseigner votre Numéro de téléphone.');
      return;
    }
    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setErrorMessage('Le mot de passe doit comporter au minimum 4 caractères.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        city: regCity.trim(),
        address: regAddress.trim(),
        password: regPassword.trim(),
        role: selectedRole,
        universePreference: regUniverse
      });

      const roleLabels: Record<UserRole, string> = {
        admin: 'Console Administrateur Plateforme activée avec succès !',
        client: 'Compte Client créé avec succès ! Bienvenue sur la plateforme.',
        owner: 'Compte Propriétaire créé avec succès ! Bienvenue sur la plateforme.',
        employee: 'Compte créé avec succès !'
      };

      setSuccessMessage(roleLabels[selectedRole]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la création du compte. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotPassword(false);
      setForgotEmail('');
    }, 3000);
  };

  return (
    <div className="relative min-h-screen theme-bg-main theme-text-primary flex flex-col justify-center px-4 py-8 overflow-hidden transition-colors duration-200">
      {/* Main card container */}
      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl theme-btn-primary shadow-lg mb-2.5">
            <Sparkles className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl font-serif tracking-tight font-bold theme-text-primary uppercase">
            {currentSalon?.name || 'Élysée Beauté'}
          </h1>
          <p className="text-xs uppercase tracking-widest theme-text-accent font-semibold mt-0.5">
            Plateforme SaaS de Gestion & Réservation Beauté
          </p>
          
          {/* Quick Theme Switcher Pill */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {[
              { id: 'blanc', label: 'Blanc', icon: '⚪' },
              { id: 'bleu', label: 'Bleu', icon: '🔵' },
              { id: 'vert', label: 'Vert', icon: '🟢' },
              { id: 'rose', label: 'Rose', icon: '🌸' },
              { id: 'sombre', label: 'Sombre', icon: '⚫' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  theme === t.id
                    ? 'theme-btn-primary shadow-sm'
                    : 'theme-bg-card theme-border theme-text-secondary hover:opacity-80'
                }`}
              >
                <span>{t.icon}</span> <span className="text-[10px] hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="theme-bg-card border theme-border rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          {/* Mode Switcher Tabs (Connexion vs Création) */}
          <div className="flex theme-bg-subtle p-1 rounded-2xl border theme-border mb-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                mode === 'login'
                  ? 'theme-btn-primary font-bold shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => { 
                setMode('register'); 
                if (selectedRole === 'employee') setSelectedRole('client');
                setErrorMessage(null); 
                setSuccessMessage(null); 
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                mode === 'register'
                  ? 'theme-btn-primary font-bold shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* Role / Space Selector Tabs */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary mb-1.5 flex items-center justify-between">
              <span>{mode === 'login' ? '1. Choisissez votre Espace :' : '1. Profil du compte à créer :'}</span>
              <span className="theme-text-accent font-extrabold capitalize">
                {selectedRole === 'client' ? 'Client' :
                 selectedRole === 'owner' ? 'Propriétaire Salon' :
                 selectedRole === 'employee' ? 'Collaborateur' : 'Administrateur'}
              </span>
            </div>

            <div className={`grid gap-1 p-1 rounded-2xl bg-black/15 border theme-border ${mode === 'login' ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {/* Client */}
              <button
                type="button"
                onClick={() => handleRoleTabChange('client')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  selectedRole === 'client'
                    ? 'theme-btn-primary shadow-sm scale-[1.02]'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-black/10'
                }`}
              >
                <span className="text-base">👤</span>
                <span className="text-[10px] leading-tight">Client</span>
              </button>

              {/* Propriétaire de Salon */}
              <button
                type="button"
                onClick={() => handleRoleTabChange('owner')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  selectedRole === 'owner'
                    ? 'theme-btn-primary shadow-sm scale-[1.02]'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-black/10'
                }`}
              >
                <span className="text-base">💼</span>
                <span className="text-[10px] leading-tight">Propriétaire</span>
              </button>

              {/* Collaborateur (Uniquement en mode Connexion) */}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('employee')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedRole === 'employee'
                      ? 'theme-btn-primary shadow-sm scale-[1.02]'
                      : 'theme-text-secondary hover:theme-text-primary hover:bg-black/10'
                  }`}
                >
                  <span className="text-base">✂️</span>
                  <span className="text-[10px] leading-tight">Collaborateur</span>
                </button>
              )}

              {/* Administrateur */}
              <button
                type="button"
                onClick={() => handleRoleTabChange('admin')}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'theme-btn-primary shadow-sm scale-[1.02]'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-black/10'
                }`}
              >
                <span className="text-base">👑</span>
                <span className="text-[10px] leading-tight">Admin</span>
              </button>
            </div>
          </div>

          {/* Feedback banners */}
          {errorMessage && (
            <div className="p-3 mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1: LOGIN FORM */}
          {/* ========================================================================= */}
          {mode === 'login' && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      required
                      className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold theme-text-secondary uppercase tracking-wider">
                      Mot de passe *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[10px] theme-text-accent hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      required
                      className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-9 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-primary cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs theme-text-secondary">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Se souvenir de moi</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl theme-btn-primary font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Register Prompt */}
              <div className="mt-5 pt-3.5 border-t theme-border text-center">
                <p className="text-xs theme-text-secondary">
                  Vous n'avez pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => { 
                      setMode('register'); 
                      if (selectedRole === 'employee') setSelectedRole('client');
                      setErrorMessage(null); 
                      setSuccessMessage(null); 
                    }}
                    className="theme-text-accent font-bold hover:underline cursor-pointer ml-1"
                  >
                    Créer mon compte
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: REGISTRATION FORM ACCORDING TO SELECTED ROLE */}
          {/* ========================================================================= */}
          {mode === 'register' && (
            <div>
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* ADMINISTRATEUR SPECIFIC BADGE */}
                {selectedRole === 'admin' && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Création de Compte Administrateur Plateforme</span>
                    </div>
                    <p className="text-[11px] theme-text-secondary">
                      Ce profil donne un accès complet à la console de supervision, au catalogue global et aux statistiques SaaS.
                    </p>
                  </div>
                )}

                {/* REQUIRED FIELD 1: NOM ET PRÉNOMS */}
                <div>
                  <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                    Nom et prénoms *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={selectedRole === 'owner' ? 'Ex: Elena Rostova' : selectedRole === 'admin' ? 'Ex: Jean Dupont (Admin)' : 'Ex: Sophie Valette'}
                      required
                      className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* REQUIRED FIELDS 2 & 3: VILLE & ADRESSE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                      Ville *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="Ex: Abidjan, Paris..."
                        required
                        className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                      Adresse *
                    </label>
                    <div className="relative">
                      <Home className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Ex: Cocody Angré 8ème Tranche"
                        required
                        className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* REQUIRED FIELD 4: EMAIL */}
                <div>
                  <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      required
                      className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* REQUIRED FIELD 5: NUMÉRO DE TÉLÉPHONE */}
                <div>
                  <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1">
                    Numéro de téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00 ou +33 6 12 34 56 78"
                      required
                      className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-3 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* REQUIRED FIELD 6: MOT DE PASSE (MINIMUM 4 CARACTÈRES) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold theme-text-secondary uppercase tracking-wider">
                      Mot de passe *
                    </label>
                    <span className="text-[10px] text-amber-500 font-bold">
                      Minimum 4 caractères
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 4 caractères"
                      minLength={4}
                      required
                      className="w-full theme-bg-subtle border theme-border rounded-xl pl-9 pr-9 py-2 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-primary cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CLIENT SPECIFIC: UNIVERSE PREFERENCE */}
                {selectedRole === 'client' && (
                  <div>
                    <label className="block text-[11px] font-semibold theme-text-secondary uppercase tracking-wider mb-1.5">
                      Univers de soins favori
                    </label>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { id: 'femme', label: 'Dame 👩' },
                        { id: 'homme', label: 'Homme 👨' },
                        { id: 'enfant', label: 'Enfant 🧒' },
                        { id: 'mixte', label: 'Mixte ✨' },
                      ].map((univ) => (
                        <button
                          key={univ.id}
                          type="button"
                          onClick={() => setRegUniverse(univ.id as SalonUniverse)}
                          className={`py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                            regUniverse === univ.id
                              ? 'theme-btn-primary font-bold shadow-sm'
                              : 'theme-bg-subtle border theme-border theme-text-secondary hover:opacity-80'
                          }`}
                        >
                          {univ.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-2 rounded-xl theme-badge-accent flex items-center gap-2 text-[11px] mt-2">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 theme-text-accent" />
                      <span>🎁 <strong>100 points fidélité</strong> offerts dès votre inscription !</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 rounded-xl theme-btn-primary font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {selectedRole === 'owner' ? "Créer mon Compte Propriétaire" :
                         selectedRole === 'admin' ? "Créer mon Compte Administrateur" :
                         "Créer mon Compte Client"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs theme-text-muted mt-5">
          © {new Date().getFullYear()} {currentSalon?.name || 'Élysée Beauté'} • Plateforme Multi-Espaces SaaS
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="theme-bg-card border theme-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-scaleIn">
            <h3 className="text-base font-bold theme-text-primary mb-1">Mot de passe oublié</h3>
            <p className="text-xs theme-text-secondary mb-4">
              Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé.
            </p>

            {forgotSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Email de réinitialisation envoyé avec succès !</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  required
                  className="w-full theme-bg-subtle border theme-border rounded-xl px-3 py-2 text-xs theme-text-primary focus:outline-none focus:border-amber-500 shadow-sm"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-2 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-secondary hover:theme-text-primary cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl theme-btn-primary text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
