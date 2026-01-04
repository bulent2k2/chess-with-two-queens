import React from 'react';
import { ChessPiece as ChessPieceType } from '@/types/chess';

interface Props {
  piece: ChessPieceType;
  selected: boolean;
  onClick: () => void;
  isInCheck?: boolean;
}

const pieceSymbols: Record<string, Record<string, string>> = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

const ChessPiece: React.FC<Props> = ({ piece, selected, onClick, isInCheck }) => {
  return (
    <div
      onClick={onClick}
      className={`text-xl sm:text-2xl md:text-3xl cursor-pointer transition-all duration-200 hover:scale-110 select-none ${
        selected ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' : ''
      } ${isInCheck ? 'animate-bounce' : ''} ${
        piece.color === 'white' ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]' : 'text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]'
      }`}
      style={{
        filter: piece.color === 'white' 
          ? 'drop-shadow(0 0 1px rgba(0,0,0,0.9)) drop-shadow(0 0 2px rgba(0,0,0,0.7))' 
          : 'drop-shadow(0 0 1px rgba(255,255,255,0.4))'
      }}
    >
      {pieceSymbols[piece.color][piece.type]}
    </div>
  );
};

export default ChessPiece;
