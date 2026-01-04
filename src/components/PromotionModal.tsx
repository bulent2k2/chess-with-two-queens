import React from 'react';
import { PieceColor, PromotionPiece } from '@/types/chess';
import { Crown, Castle, ChevronUp } from 'lucide-react';

interface Props {
  color: PieceColor;
  onSelect: (piece: PromotionPiece) => void;
}

const PromotionModal: React.FC<Props> = ({ color, onSelect }) => {
  const pieces: { type: PromotionPiece; label: string; icon: React.ReactNode }[] = [
    { 
      type: 'queen', 
      label: 'Queen',
      icon: <Crown className="w-8 h-8" />
    },
    { 
      type: 'rook', 
      label: 'Rook',
      icon: <Castle className="w-8 h-8" />
    },
    { 
      type: 'bishop', 
      label: 'Bishop',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3L12 5M12 5C10 5 8 7 8 10C8 12 9 14 12 16C15 14 16 12 16 10C16 7 14 5 12 5Z" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
          <path d="M8 21H16M10 21V18H14V21" />
        </svg>
      )
    },
    { 
      type: 'knight', 
      label: 'Knight',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 20H16M10 20V17C10 17 8 15 8 12C8 9 10 7 10 7L9 5L11 4C11 4 13 3 15 5C17 7 16 10 16 10L14 12C14 12 16 14 16 17V20" />
          <circle cx="11" cy="8" r="1" fill="currentColor" />
        </svg>
      )
    }
  ];

  const bgColor = color === 'white' ? 'bg-white' : 'bg-gray-800';
  const textColor = color === 'white' ? 'text-gray-900' : 'text-white';
  const hoverBg = color === 'white' ? 'hover:bg-gray-100' : 'hover:bg-gray-700';
  const borderColor = color === 'white' ? 'border-gray-300' : 'border-gray-600';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 shadow-2xl border border-amber-500/30 max-w-md w-full">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ChevronUp className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-amber-400">Pawn Promotion</h2>
          <ChevronUp className="w-6 h-6 text-amber-400" />
        </div>
        
        <p className="text-gray-300 text-center mb-6">
          Your pawn has reached the end! Choose a piece to promote to:
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {pieces.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`${bgColor} ${textColor} ${hoverBg} ${borderColor} border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 hover:shadow-lg`}
            >
              {icon}
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </div>
        
        <p className="text-gray-500 text-xs text-center mt-4">
          The Queen is usually the best choice for its versatility
        </p>
      </div>
    </div>
  );
};

export default PromotionModal;
