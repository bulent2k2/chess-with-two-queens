import React, { useState, useEffect, useCallback } from 'react';
import { 
  Board, Position, Move, ChessPiece as ChessPieceType, GameMode, BoardSize, 
  getBoardDimensions, CheckStatus, CastlingRights, PendingPromotion, PromotionPiece, DrawReason
} from '@/types/chess';
import { 
  isValidMove, getValidMoves, getAIMove, getMoveNotation, getCheckStatus, 
  isKingInCheck, isCheckmate, executeMove, getSpecialMoveType, isPromotionMove,
  getDrawStatus, getBoardPositionHash
} from '@/utils/chessLogic';
import ChessPiece from './ChessPiece';
import PromotionModal from './PromotionModal';

interface Props {
  onMove: (move: Move) => void;
  currentPlayer: 'white' | 'black';
  gameMode: GameMode;
  board: Board;
  setBoard: (board: Board) => void;
  gameOver: boolean;
  onCapture: (piece: ChessPieceType) => void;
  boardSize: BoardSize;
  onCheckStatusChange?: (status: CheckStatus) => void;
  enPassantTarget: Position | null;
  setEnPassantTarget: (target: Position | null) => void;
  castlingRights: CastlingRights;
  setCastlingRights: (rights: CastlingRights) => void;
  positionHistory: string[];
  setPositionHistory: (history: string[]) => void;
  halfMoveClock: number;
  setHalfMoveClock: (clock: number) => void;
  onDraw?: (reason: DrawReason) => void;
}

const ChessBoard: React.FC<Props> = ({ 
  onMove, 
  currentPlayer, 
  gameMode, 
  board, 
  setBoard, 
  gameOver,
  onCapture,
  boardSize,
  onCheckStatusChange,
  enPassantTarget,
  setEnPassantTarget,
  castlingRights,
  setCastlingRights,
  positionHistory,
  setPositionHistory,
  halfMoveClock,
  setHalfMoveClock,
  onDraw
}) => {
  const [selected, setSelected] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>({ isInCheck: false, isCheckmate: false, checkedKingPosition: null });
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  
  const { rows, cols } = getBoardDimensions(boardSize);

  // Check for check/checkmate/draw status whenever board changes
  useEffect(() => {
    const status = getCheckStatus(board, currentPlayer, enPassantTarget, castlingRights);
    setCheckStatus(status);
    onCheckStatusChange?.(status);
    
    // Check for draw conditions
    if (!status.isCheckmate && !gameOver) {
      const drawStatus = getDrawStatus(
        board, 
        currentPlayer, 
        enPassantTarget, 
        castlingRights, 
        positionHistory, 
        halfMoveClock
      );
      if (drawStatus.isDraw && onDraw) {
        onDraw(drawStatus.reason);
      }
    }
  }, [board, currentPlayer, onCheckStatusChange, enPassantTarget, castlingRights, positionHistory, halfMoveClock, gameOver, onDraw]);

  // Update valid moves when selection changes
  useEffect(() => {
    if (selected) {
      setValidMoves(getValidMoves(board, selected, enPassantTarget, castlingRights));
    } else {
      setValidMoves([]);
    }
  }, [selected, board, enPassantTarget, castlingRights]);

  // Clear selection when board changes
  useEffect(() => {
    setSelected(null);
    setValidMoves([]);
  }, [boardSize]);

  // Complete a move after promotion selection (or for non-promotion moves)
  const completeMove = useCallback((
    from: Position,
    to: Position,
    movingPiece: ChessPieceType,
    promotionPiece: PromotionPiece = 'queen'
  ) => {
    const result = executeMove(board, from, to, castlingRights, enPassantTarget, promotionPiece);
    const specialMove = getSpecialMoveType(board, from, to, enPassantTarget);
    
    // Check if this move puts opponent in check/checkmate
    const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
    const opponentInCheck = isKingInCheck(result.newBoard, opponentColor);
    const opponentInCheckmate = opponentInCheck && isCheckmate(result.newBoard, opponentColor, result.newEnPassantTarget, result.newCastlingRights);
    
    setBoard(result.newBoard);
    setEnPassantTarget(result.newEnPassantTarget);
    setCastlingRights(result.newCastlingRights);
    
    // Update position history for threefold repetition
    const newPositionHash = getBoardPositionHash(result.newBoard, opponentColor, result.newCastlingRights, result.newEnPassantTarget);
    setPositionHistory([...positionHistory, newPositionHash]);
    
    // Update half-move clock for fifty-move rule
    const isPawnMove = movingPiece.type === 'pawn';
    const isCapture = result.captured !== null;
    setHalfMoveClock(isPawnMove || isCapture ? 0 : halfMoveClock + 1);
    
    if (result.captured) {
      onCapture(result.captured);
    }
    
    onMove({
      from,
      to,
      piece: movingPiece,
      captured: result.captured || undefined,
      notation: getMoveNotation(from, to, movingPiece, result.captured || undefined, rows, opponentInCheck, opponentInCheckmate, specialMove, specialMove === 'promotion' ? promotionPiece : undefined),
      isCheck: opponentInCheck,
      isCheckmate: opponentInCheckmate,
      specialMove,
      promotedTo: specialMove === 'promotion' ? promotionPiece : undefined
    });
  }, [board, castlingRights, enPassantTarget, currentPlayer, onCapture, onMove, rows, setBoard, setCastlingRights, setEnPassantTarget, positionHistory, setPositionHistory, halfMoveClock, setHalfMoveClock]);

  // Handle promotion selection
  const handlePromotionSelect = useCallback((piece: PromotionPiece) => {
    if (pendingPromotion) {
      completeMove(pendingPromotion.from, pendingPromotion.to, pendingPromotion.piece, piece);
      setPendingPromotion(null);
    }
  }, [pendingPromotion, completeMove]);

  // AI move logic
  const makeAIMove = useCallback(() => {
    if (gameMode !== 'ai' || currentPlayer !== 'black' || gameOver) return;
    
    setIsAIThinking(true);
    
    // Add delay to make AI feel more natural
    setTimeout(() => {
      const aiMove = getAIMove(board, 2, enPassantTarget, castlingRights);
      
      if (aiMove) {
        // Check if AI move is a promotion
        if (isPromotionMove(board, aiMove.from, aiMove.to)) {
          // AI always promotes to queen
          completeMove(aiMove.from, aiMove.to, aiMove.piece, 'queen');
        } else {
          completeMove(aiMove.from, aiMove.to, aiMove.piece);
        }
      }
      
      setIsAIThinking(false);
    }, 500);
  }, [board, currentPlayer, gameMode, gameOver, enPassantTarget, castlingRights, completeMove]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'black' && !gameOver && !isAIThinking && !pendingPromotion) {
      makeAIMove();
    }
  }, [currentPlayer, gameMode, gameOver, isAIThinking, makeAIMove, pendingPromotion]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || pendingPromotion) return;
    if (gameMode === 'ai' && currentPlayer === 'black') return; // Prevent clicks during AI turn
    
    const piece = board[row][col];
    
    if (selected) {
      // Clicking on same square deselects
      if (selected.row === row && selected.col === col) {
        setSelected(null);
        return;
      }
      
      // Try to make a move
      if (isValidMove(board, selected, { row, col }, enPassantTarget, castlingRights)) {
        const movingPiece = board[selected.row][selected.col];
        if (movingPiece && movingPiece.color === currentPlayer) {
          // Check if this is a promotion move
          if (isPromotionMove(board, selected, { row, col })) {
            // Store pending promotion and show modal
            const captured = board[row][col] || undefined;
            setPendingPromotion({
              from: selected,
              to: { row, col },
              piece: movingPiece,
              captured
            });
            setSelected(null);
            return;
          }
          
          // Regular move
          completeMove(selected, { row, col }, movingPiece);
        }
      } else if (piece && piece.color === currentPlayer) {
        // Select a different piece
        setSelected({ row, col });
        return;
      }
      setSelected(null);
    } else if (piece && piece.color === currentPlayer) {
      setSelected({ row, col });
    }
  };

  const isValidMoveSquare = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  const isKingInCheckSquare = (row: number, col: number) => {
    if (!checkStatus.isInCheck || !checkStatus.checkedKingPosition) return false;
    return checkStatus.checkedKingPosition.row === row && checkStatus.checkedKingPosition.col === col;
  };

  // Check if a square is a castling destination
  const isCastlingSquare = (row: number, col: number) => {
    if (!selected) return false;
    const piece = board[selected.row][selected.col];
    if (!piece || piece.type !== 'king') return false;
    
    const isValid = validMoves.some(m => m.row === row && m.col === col);
    if (!isValid) return false;
    
    return Math.abs(col - selected.col) === 2;
  };

  // Check if a square is an en passant target
  const isEnPassantSquare = (row: number, col: number) => {
    if (!selected) return false;
    const piece = board[selected.row][selected.col];
    if (!piece || piece.type !== 'pawn') return false;
    
    return enPassantTarget && enPassantTarget.row === row && enPassantTarget.col === col && 
           validMoves.some(m => m.row === row && m.col === col);
  };

  // Check if a square is a promotion square
  const isPromotionSquare = (row: number, col: number) => {
    if (!selected) return false;
    const piece = board[selected.row][selected.col];
    if (!piece || piece.type !== 'pawn') return false;
    
    const isValid = validMoves.some(m => m.row === row && m.col === col);
    if (!isValid) return false;
    
    return (piece.color === 'white' && row === 0) || (piece.color === 'black' && row === rows - 1);
  };

  // Generate column labels (a-i)
  const colLabels = Array.from({ length: cols }, (_, i) => String.fromCharCode(97 + i));
  // Generate row labels (based on board size)
  const rowLabels = Array.from({ length: rows }, (_, i) => rows - i);

  return (
    <div className="relative">
      {/* Promotion Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.piece.color}
          onSelect={handlePromotionSelect}
        />
      )}
      
      {/* AI thinking overlay */}
      {isAIThinking && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-gray-800 px-3 py-2 rounded-lg flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-amber-400 font-medium text-sm">AI is thinking...</span>
          </div>
        </div>
      )}
      
      <div className="inline-block bg-gray-900 p-1.5 sm:p-3 rounded-lg shadow-2xl w-full max-w-[100vw] sm:max-w-lg mx-auto">
        {/* Column labels */}
        <div 
          className="grid gap-0 mb-0.5 pl-4 sm:pl-5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {colLabels.map((col) => (
            <div key={col} className="text-center text-amber-400 text-[10px] sm:text-xs font-medium">
              {col}
            </div>
          ))}
        </div>
        
        <div className="flex">
          {/* Row labels */}
          <div className="flex flex-col justify-around mr-0.5 sm:mr-1">
            {rowLabels.map((num) => (
              <div key={num} className="text-amber-400 text-[10px] sm:text-xs font-medium w-3 sm:w-4 text-right">
                {num}
              </div>
            ))}
          </div>
          
          {/* Board */}
          <div 
            className="grid gap-0 flex-1"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              aspectRatio: `${cols}/${rows}`
            }}
          >
            {board.map((row, rowIdx) =>
              row.map((piece, colIdx) => {
                const isSelected = selected?.row === rowIdx && selected?.col === colIdx;
                const isValid = isValidMoveSquare(rowIdx, colIdx);
                const hasEnemy = isValid && piece !== null;
                const isKingChecked = isKingInCheckSquare(rowIdx, colIdx);
                const isCastling = isCastlingSquare(rowIdx, colIdx);
                const isEnPassant = isEnPassantSquare(rowIdx, colIdx);
                const isPromotion = isPromotionSquare(rowIdx, colIdx);
                
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleSquareClick(rowIdx, colIdx)}
                    className={`relative flex items-center justify-center cursor-pointer transition-all aspect-square ${
                      (rowIdx + colIdx) % 2 === 0 ? 'bg-stone-300' : 'bg-amber-900'
                    } ${isSelected ? 'ring-2 sm:ring-3 ring-yellow-400 ring-inset' : ''} ${
                      isValid && !hasEnemy && !isCastling && !isEnPassant && !isPromotion ? 'after:absolute after:w-2 after:h-2 sm:after:w-2.5 sm:after:h-2.5 after:bg-green-500/50 after:rounded-full' : ''
                    } ${hasEnemy ? 'ring-2 ring-red-500 ring-inset' : ''} ${
                      isKingChecked ? 'bg-red-500 animate-pulse ring-2 ring-red-600' : ''
                    } ${isCastling ? 'after:absolute after:w-2 after:h-2 sm:after:w-2.5 sm:after:h-2.5 after:bg-blue-500/70 after:rounded-full ring-2 ring-blue-400 ring-inset' : ''} ${
                      isEnPassant ? 'after:absolute after:w-2 after:h-2 sm:after:w-2.5 sm:after:h-2.5 after:bg-purple-500/70 after:rounded-full ring-2 ring-purple-400 ring-inset' : ''
                    } ${isPromotion && !hasEnemy ? 'after:absolute after:w-2 after:h-2 sm:after:w-2.5 sm:after:h-2.5 after:bg-amber-500/70 after:rounded-full ring-2 ring-amber-400 ring-inset' : ''}`}
                  >
                    {piece && (
                      <ChessPiece 
                        piece={piece} 
                        selected={isSelected}
                        isInCheck={isKingChecked}
                        onClick={() => {}} 
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
