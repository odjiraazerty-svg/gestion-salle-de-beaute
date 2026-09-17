import React from 'react';
import { SalonUniverse } from '../../types';
import { Sparkles, Scissors, Heart, Baby, Users } from 'lucide-react';

interface Props {
  selected: SalonUniverse;
  onSelect: (u: SalonUniverse) => void;
}

export const UniverseFilter: React.FC<Props> = ({ selected, onSelect }) => {
  const categories: { id: SalonUniverse; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      id: 'all', 
      label: 'Tous', 
      icon: <Sparkles className="w-4 h-4" />,
      color: 'from-amber-500 to-yellow-600' 
    },
    { 
      id: 'homme', 
      label: 'Homme / Barber', 
      icon: <Scissors className="w-4 h-4" />,
      color: 'from-blue-600 to-indigo-700' 
    },
    { 
      id: 'femme', 
      label: 'Femme / Beauté', 
      icon: <Heart className="w-4 h-4" />,
      color: 'from-pink-500 to-rose-600' 
    },
    { 
      id: 'enfant', 
      label: 'Enfants', 
      icon: <Baby className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-600' 
    },
    { 
      id: 'mixte', 
      label: 'Mixte & Spa', 
      icon: <Users className="w-4 h-4" />,
      color: 'from-purple-500 to-violet-600' 
    },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 px-4 flex gap-2.5">
      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 transform active:scale-95 ${
              isSelected
                ? 'bg-gradient-to-r text-white shadow-md ' + cat.color
                : 'theme-bg-card theme-text-secondary border theme-border hover:opacity-80'
            }`}
          >
            <span className={isSelected ? 'text-white' : 'theme-text-muted'}>
              {cat.icon}
            </span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
