import React, { useRef, useEffect } from 'react';
import { Move } from '@/types/chess';
import { History, Swords, AlertTriangle, Crown, Castle, ArrowRightLeft, ChevronUp } from 'lucide-react';

interface Props {
  moves: Move[];
}

const pieceSymbols: Record<string, string> = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟'
};

const MoveHistory: React.FC<Props> = ({ moves }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (white, black)
  const movePairs: { moveNum: number; white?: Move; black?: Move }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNum: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1]
    });
  }

  const renderMoveCell = (move: Move | undefined, isWhite: boolean) => {
    if (!move) {
      return <div className="text-gray-600">...</div>;
    }

    const isCastling = move.specialMove === 'castleKingside' || move.specialMove === 'castleQueenside';
    const isEnPassant = move.specialMove === 'enPassant';
    const isPromotion = move.specialMove === 'promotion';

    return (
      <div className={`flex items-center gap-0.5 sm:gap-1 rounded px-1 sm:px-2 py-0.5 ${
        move.isCheckmate 
          ? 'bg-amber-600/30 ring-1 ring-amber-500' 
          : move.isCheck 
          ? 'bg-red-600/20 ring-1 ring-red-500/50' 
          : isCastling
          ? 'bg-blue-600/20 ring-1 ring-blue-500/50'
          : isEnPassant
          ? 'bg-purple-600/20 ring-1 ring-purple-500/50'
          : isPromotion
          ? 'bg-amber-600/20 ring-1 ring-amber-500/50'
          : 'bg-gray-700/30'
      }`}>
        <span className={`text-sm sm:text-base ${
          isWhite 
            ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' 
            : 'text-gray-900'
        }`}>
          {isPromotion && move.promotedTo 
            ? pieceSymbols[move.promotedTo] 
            : pieceSymbols[move.piece.type]}
        </span>
        <span className={`font-mono text-[10px] sm:text-xs truncate ${
          isWhite ? 'text-amber-100' : 'text-gray-300'
        }`}>
          {move.notation}
        </span>
        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
          {isCastling && (
            <Castle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
          )}
          {isEnPassant && (
            <ArrowRightLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
          )}
          {isPromotion && (
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
          )}
          {move.captured && !isEnPassant && (
            <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
          )}
          {isEnPassant && (
            <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
          )}
          {move.isCheckmate && (
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
          )}
          {move.isCheck && !move.isCheckmate && (
            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-700">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        <h3 className="text-amber-400 font-semibold text-sm sm:text-base">Move History</h3>
        <span className="text-gray-500 text-xs ml-auto">{moves.length} moves</span>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2 text-[10px] sm:text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Swords className="w-2.5 h-2.5 text-red-400" />
          <span>Capture</span>
        </div>
        <div className="flex items-center gap-1">
          <Castle className="w-2.5 h-2.5 text-blue-400" />
          <span>Castle</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowRightLeft className="w-2.5 h-2.5 text-purple-400" />
          <span>En passant</span>
        </div>
        <div className="flex items-center gap-1">
          <ChevronUp className="w-2.5 h-2.5 text-amber-400" />
          <span>Promotion</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
          <span>Check</span>
        </div>
        <div className="flex items-center gap-1">
          <Crown className="w-2.5 h-2.5 text-amber-400" />
          <span>Checkmate</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="space-y-0.5 sm:space-y-1 max-h-48 sm:max-h-64 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {moves.length === 0 ? (
          <div className="text-center py-4 sm:py-8">
            <p className="text-gray-500 text-xs sm:text-sm">No moves yet</p>
            <p className="text-gray-600 text-xs mt-1">Make your first move to start</p>
          </div>
        ) : (
          movePairs.map((pair) => (
            <div 
              key={pair.moveNum} 
              className="grid grid-cols-[1.5rem_1fr_1fr] sm:grid-cols-[2rem_1fr_1fr] gap-1 sm:gap-2 text-xs sm:text-sm py-0.5 sm:py-1 border-b border-gray-700/50 last:border-0"
            >
              {/* Move number */}
              <span className="text-gray-500 font-medium">{pair.moveNum}.</span>
              
              {/* White's move */}
              {renderMoveCell(pair.white, true)}
              
              {/* Black's move */}
              {renderMoveCell(pair.black, false)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
