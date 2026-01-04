import React from 'react';
import { ChessPiece } from '@/types/chess';
import { Sword } from 'lucide-react';

interface Props {
  pieces: ChessPiece[];
  color: 'white' | 'black';
  label: string;
}

const pieceSymbols: Record<string, string> = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟'
};

const CapturedPieces: React.FC<Props> = ({ pieces, color, label }) => {
  // Calculate material value
  const pieceValues: Record<string, number> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0
  };
  
  const totalValue = pieces.reduce((sum, p) => sum + pieceValues[p.type], 0);
  
  // Group pieces by type for cleaner display
  const groupedPieces = pieces.reduce((acc, piece) => {
    acc[piece.type] = (acc[piece.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <h3 className="text-amber-400 font-semibold text-xs sm:text-sm flex items-center gap-1.5">
          <Sword className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {label}
        </h3>
        <span className="text-gray-400 text-xs bg-gray-700 px-1.5 py-0.5 rounded">+{totalValue}</span>
      </div>
      <div className="flex flex-wrap gap-0.5 min-h-[24px] sm:min-h-[28px]">
        {pieces.length === 0 ? (
          <span className="text-gray-500 text-xs italic">No captures yet</span>
        ) : (
          Object.entries(groupedPieces).map(([type, count]) => (
            <div key={type} className="flex items-center">
              {Array.from({ length: count }).map((_, i) => (
                <span
                  key={`${type}-${i}`}
                  className={`text-base sm:text-lg ${
                    color === 'white' 
                      ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' 
                      : 'text-gray-900'
                  }`}
                >
                  {pieceSymbols[type]}
                </span>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CapturedPieces;
