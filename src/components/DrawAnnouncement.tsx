import React from 'react';
import { DrawReason } from '@/types/chess';
import { Scale, RefreshCw, RotateCcw, Handshake, X } from 'lucide-react';

interface Props {
  reason: DrawReason;
  onNewGame: () => void;
  onClose: () => void;
}

const DrawAnnouncement: React.FC<Props> = ({ reason, onNewGame, onClose }) => {
  const getDrawInfo = () => {
    switch (reason) {
      case 'stalemate':
        return {
          title: 'Stalemate!',
          description: 'The player to move has no legal moves but is not in check.',
          icon: <Scale className="w-16 h-16 text-amber-400" />
        };
      case 'threefold':
        return {
          title: 'Threefold Repetition!',
          description: 'The same position has occurred three times.',
          icon: <RotateCcw className="w-16 h-16 text-amber-400" />
        };
      case 'fifty-move':
        return {
          title: '50-Move Rule!',
          description: '50 moves have been made without a pawn move or capture.',
          icon: <RefreshCw className="w-16 h-16 text-amber-400" />
        };
      case 'insufficient':
        return {
          title: 'Insufficient Material!',
          description: 'Neither player has enough pieces to deliver checkmate.',
          icon: <Scale className="w-16 h-16 text-amber-400" />
        };
      case 'agreement':
        return {
          title: 'Draw by Agreement!',
          description: 'Both players have agreed to a draw.',
          icon: <Handshake className="w-16 h-16 text-amber-400" />
        };
      default:
        return {
          title: 'Draw!',
          description: 'The game has ended in a draw.',
          icon: <Scale className="w-16 h-16 text-amber-400" />
        };
    }
  };

  const { title, description, icon } = getDrawInfo();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl border border-amber-500/30 max-w-md w-full relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-700/50 rounded-full p-4">
              {icon}
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-amber-400 mb-2">
            {title}
          </h2>
          
          {/* Draw label */}
          <p className="text-2xl font-bold text-center text-gray-300 mb-4">
            Game Drawn
          </p>
          
          {/* Description */}
          <p className="text-gray-400 text-center mb-8">
            {description}
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNewGame}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Play Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Review Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawAnnouncement;
