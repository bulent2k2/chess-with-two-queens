import React from 'react';
import { PieceColor } from '@/types/chess';
import { Trophy, Crown, RotateCcw, X } from 'lucide-react';

interface Props {
  winner: PieceColor | 'draw' | null;
  isCheckmate: boolean;
  onNewGame: () => void;
  onClose: () => void;
}

const WinnerAnnouncement: React.FC<Props> = ({ winner, isCheckmate, onNewGame, onClose }) => {
  if (!winner) return null;

  const isDraw = winner === 'draw';
  const winnerName = isDraw ? 'Draw' : winner.charAt(0).toUpperCase() + winner.slice(1);
  const winnerColor = winner === 'white' ? 'text-white' : winner === 'black' ? 'text-gray-900' : 'text-amber-400';
  const bgGradient = winner === 'white' 
    ? 'from-amber-600 via-amber-500 to-yellow-400' 
    : winner === 'black' 
    ? 'from-gray-800 via-gray-700 to-gray-600'
    : 'from-amber-700 via-amber-600 to-amber-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${bgGradient} p-6 text-center`}>
          <div className="flex justify-center mb-3">
            {isDraw ? (
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-4xl">🤝</span>
              </div>
            ) : (
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <Crown className="absolute -top-3 -right-3 w-8 h-8 text-yellow-300 animate-bounce" />
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-1">
            {isDraw ? 'Stalemate!' : 'Checkmate!'}
          </h2>
          <p className="text-white/80 text-lg">
            {isDraw ? 'The game ends in a draw' : 'The game is over'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {!isDraw && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full ${winner === 'white' ? 'bg-white border-2 border-gray-300' : 'bg-gray-900 border-2 border-gray-600'}`} />
                <span className="text-2xl font-bold text-amber-400">{winnerName} Wins!</span>
              </div>
              {isCheckmate && (
                <p className="text-gray-400 text-sm">
                  Victory by checkmate
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onNewGame}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Review Board
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default WinnerAnnouncement;
