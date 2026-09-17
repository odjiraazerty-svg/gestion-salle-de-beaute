import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { Appointment, PaymentMethod } from '../../types';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShoppingBag, 
  Sparkles, 
  Printer, 
  X 
} from 'lucide-react';

export const ProPOSScreen: React.FC = () => {
  const { appointments, salonInfo, processPayment } = useSalon();

  // Unpaid appointments
  const unpaidApts = appointments.filter(a => !a.paid && a.status !== 'cancelled');

  const [selectedApt, setSelectedApt] = useState<Appointment | null>(unpaidApts[0] || null);

  // Extra retail products
  const RETAIL_PRODUCTS = [
    { id: 'p1', name: 'Cire Coiffante Mate Luxe', price: 18, image: 'https://images.unsplash.com/photo-1597354984706-aec992b7d0d1?w=200&auto=format&fit=crop&q=80' },
    { id: 'p2', name: 'Huile de Barbe Bio & Argan', price: 22, image: 'https://images.unsplash.com/photo-1608248597359-5f726715f5d6?w=200&auto=format&fit=crop&q=80' },
    { id: 'p3', name: 'Sérum Kératine & Soie 100ml', price: 28, image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=200&auto=format&fit=crop&q=80' },
    { id: 'p4', name: 'Vernis Semi-Permanent Rose Nude', price: 15, image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=200&auto=format&fit=crop&q=80' }
  ];

  const [cartProducts, setCartProducts] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [tip, setTip] = useState<number>(0);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  // Add/remove product from cart
  const handleAddProduct = (p: typeof RETAIL_PRODUCTS[0]) => {
    setCartProducts(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const handleRemoveProduct = (pId: string) => {
    setCartProducts(prev => prev.filter(item => item.id !== pId));
  };

  // Calculate totals
  const baseServicePrice = selectedApt ? selectedApt.price : 0;
  const productsTotal = cartProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = baseServicePrice + productsTotal + tip;

  // Process checkout
  const handleCheckout = () => {
    if (!selectedApt && cartProducts.length === 0) {
      alert('Veuillez sélectionner un rendez-vous ou ajouter des produits.');
      return;
    }

    if (selectedApt) {
      processPayment(selectedApt.id, selectedPaymentMethod);
    }

    // Receipt details
    const receiptData = {
      receiptNumber: `TICKET-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleString('fr-FR'),
      clientName: selectedApt?.clientName || 'Client Comptoir',
      serviceName: selectedApt?.serviceName,
      servicePrice: baseServicePrice,
      products: [...cartProducts],
      tip,
      grandTotal,
      paymentMethod: selectedPaymentMethod
    };

    setCompletedReceipt(receiptData);
    setCartProducts([]);
    setTip(0);

    try {
      confetti({ particleCount: 60, spread: 60 });
    } catch {}
  };

  return (
    <div className="space-y-4 animate-slide-up pb-8">
      {/* Header */}
      <div className="px-4 pt-1">
        <h2 className="text-lg font-bold text-white font-serif">
          Caisse & Encaissement
        </h2>
        <p className="text-xs text-slate-400">
          Encaissez au fauteuil et délivrez les tickets de caisse
        </p>
      </div>

      {/* Select Appointment to pay */}
      <div className="px-4 space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          1. Sélectionner le rendez-vous à régler
        </span>

        {unpaidApts.length === 0 ? (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tous les rendez-vous sont déjà réglés ! Vente libre de produits possible ci-dessous.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {unpaidApts.map((apt) => {
              const isSelected = selectedApt?.id === apt.id;
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedApt(apt)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{apt.clientName}</h4>
                    <span className="text-[11px] text-slate-400">{apt.serviceName} ({apt.staffName})</span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-400">
                    {apt.price} {salonInfo.currency}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retail Products Add-on */}
      <div className="px-4 space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
          2. Vente de Produits Boutique (Optionnel)
        </span>

        <div className="grid grid-cols-2 gap-2">
          {RETAIL_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleAddProduct(prod)}
              className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5 cursor-pointer hover:border-amber-500/40 transition-colors active:scale-95"
            >
              <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <h5 className="text-[11px] font-bold text-white truncate">{prod.name}</h5>
                <span className="text-xs font-extrabold text-amber-400">+{prod.price} {salonInfo.currency}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Products in Cart */}
        {cartProducts.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Panier boutique :</span>
            {cartProducts.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="text-slate-300">{item.name} (x{item.qty})</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{item.price * item.qty} {salonInfo.currency}</span>
                  <button onClick={() => handleRemoveProduct(item.id)} className="text-rose-400 text-xs">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method Selector */}
      <div className="px-4 space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          3. Mode de règlement
        </span>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedPaymentMethod('card')}
            className={`py-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              selectedPaymentMethod === 'card'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Carte</span>
          </button>

          <button
            onClick={() => setSelectedPaymentMethod('cash')}
            className={`py-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              selectedPaymentMethod === 'cash'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Espèces</span>
          </button>

          <button
            onClick={() => setSelectedPaymentMethod('mobile_money')}
            className={`py-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
              selectedPaymentMethod === 'mobile_money'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Grand Total & Checkout Button */}
      <div className="px-4 pt-2">
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">Total à encaisser</span>
            <span className="text-2xl font-black text-amber-400">
              {grandTotal} {salonInfo.currency}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Valider l'encaissement</span>
          </button>
        </div>
      </div>

      {/* Completed Receipt Modal / Ticket */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-slate-950 rounded-3xl p-6 space-y-4 shadow-2xl font-mono text-xs animate-slide-up relative">
            <button
              onClick={() => setCompletedReceipt(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-serif font-black text-base text-slate-900">{salonInfo.name}</h3>
              <p className="text-[10px] text-slate-500">{salonInfo.address}, {salonInfo.city}</p>
              <p className="text-[10px] text-slate-500">Tél : {salonInfo.phone}</p>
              <p className="text-[10px] font-bold text-amber-600 mt-1">{completedReceipt.receiptNumber}</p>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{completedReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-bold">{completedReceipt.clientName}</span>
              </div>
              {completedReceipt.serviceName && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span>{completedReceipt.serviceName}</span>
                  <span className="font-bold">{completedReceipt.servicePrice} {salonInfo.currency}</span>
                </div>
              )}
              {completedReceipt.products.map((p: any) => (
                <div key={p.id} className="flex justify-between text-slate-600">
                  <span>{p.name} (x{p.qty})</span>
                  <span>{p.price * p.qty} {salonInfo.currency}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-black">
              <span>TOTAL PAYÉ :</span>
              <span>{completedReceipt.grandTotal} {salonInfo.currency}</span>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
              <p>Mode: {completedReceipt.paymentMethod.toUpperCase()}</p>
              <p className="mt-1 font-sans font-semibold">Merci de votre visite et à très bientôt !</p>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-sans text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le ticket</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
