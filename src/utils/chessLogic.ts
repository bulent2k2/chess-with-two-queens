import { 
  Board, ChessPiece, Position, PieceColor, BoardSize, getBoardDimensions, 
  CheckStatus, CastlingRights, MoveResult, SpecialMoveType,
  DrawStatus, PromotionPiece
} from '@/types/chess';

export const getInitialCastlingRights = (): CastlingRights => ({
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true
});



export const createInitialBoard = (boardSize: BoardSize = '9x8'): Board => {
  const { rows, cols } = getBoardDimensions(boardSize);
  const board: Board = Array(rows).fill(null).map(() => Array(cols).fill(null));
  
  // Black pieces (row 0)
  const backRow: ChessPiece[] = [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ];
  
  backRow.forEach((piece, i) => board[0][i] = piece);
  for (let i = 0; i < cols; i++) board[1][i] = { type: 'pawn', color: 'black' };
  
  // White pieces (last row)
  const lastRow = rows - 1;
  for (let i = 0; i < cols; i++) board[lastRow - 1][i] = { type: 'pawn', color: 'white' };
  backRow.forEach((piece, i) => board[lastRow][i] = { ...piece, color: 'white' });
  
  return board;
};

// Check if path is clear for sliding pieces (rook, bishop, queen)
const isPathClear = (board: Board, from: Position, to: Position): boolean => {
  const rowDir = Math.sign(to.row - from.row);
  const colDir = Math.sign(to.col - from.col);
  
  let currentRow = from.row + rowDir;
  let currentCol = from.col + colDir;
  
  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) return false;
    currentRow += rowDir;
    currentCol += colDir;
  }
  
  return true;
};

// Validate moves for each piece type (basic move validation without check consideration)
export const isValidMoveBasic = (
  board: Board, 
  from: Position, 
  to: Position,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  
  // Check bounds
  if (to.row < 0 || to.row >= rows || to.col < 0 || to.col >= cols) return false;
  
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  // Can't capture own piece
  const target = board[to.row][to.col];
  if (target && target.color === piece.color) return false;
  
  // Can't stay in place
  if (from.row === to.row && from.col === to.col) return false;
  
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  // Determine pawn start row based on board size
  const whiteStartRow = rows - 2; // Second to last row
  const blackStartRow = 1;
  
  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? whiteStartRow : blackStartRow;
      
      // Forward move
      if (colDiff === 0 && !target) {
        if (rowDiff === direction) return true;
        // Double move from start
        if (from.row === startRow && rowDiff === 2 * direction && !board[from.row + direction][from.col]) {
          return true;
        }
      }
      // Capture diagonally
      if (absColDiff === 1 && rowDiff === direction) {
        // Normal capture
        if (target) return true;
        // En passant capture
        if (enPassantTarget && to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
          return true;
        }
      }
      return false;
    }
    
    case 'knight':
      return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
    
    case 'bishop':
      if (absRowDiff !== absColDiff) return false;
      return isPathClear(board, from, to);
    
    case 'rook':
      if (rowDiff !== 0 && colDiff !== 0) return false;
      return isPathClear(board, from, to);
    
    case 'queen':
      if (absRowDiff !== absColDiff && rowDiff !== 0 && colDiff !== 0) return false;
      return isPathClear(board, from, to);
    
    case 'king': {
      // Normal king move
      if (absRowDiff <= 1 && absColDiff <= 1) return true;
      
      // Castling - king moves 2 squares horizontally
      if (castlingRights && absRowDiff === 0 && absColDiff === 2) {
        return canCastle(board, from, to, piece.color, castlingRights);
      }
      return false;
    }
    
    default:
      return false;
  }
};

// Check if castling is valid
const canCastle = (
  board: Board,
  from: Position,
  to: Position,
  color: PieceColor,
  castlingRights: CastlingRights
): boolean => {
  const rows = board.length;
  const kingRow = color === 'white' ? rows - 1 : 0;
  const kingCol = 4; // King starts at column 4 in 9-column board
  
  // King must be on its starting square
  if (from.row !== kingRow || from.col !== kingCol) return false;
  
  // Determine if kingside or queenside
  const isKingside = to.col > from.col;
  
  // Check castling rights
  if (color === 'white') {
    if (isKingside && !castlingRights.whiteKingside) return false;
    if (!isKingside && !castlingRights.whiteQueenside) return false;
  } else {
    if (isKingside && !castlingRights.blackKingside) return false;
    if (!isKingside && !castlingRights.blackQueenside) return false;
  }
  
  // Check if king is currently in check
  if (isKingInCheck(board, color)) return false;
  
  // Rook positions for 9-column board
  const rookCol = isKingside ? 8 : 0;
  const rook = board[kingRow][rookCol];
  
  // Verify rook is there
  if (!rook || rook.type !== 'rook' || rook.color !== color) return false;
  
  // Check path is clear between king and rook
  const startCol = Math.min(kingCol, rookCol) + 1;
  const endCol = Math.max(kingCol, rookCol);
  for (let col = startCol; col < endCol; col++) {
    if (board[kingRow][col] !== null) return false;
  }
  
  // Check that king doesn't pass through or land on attacked squares
  const opponentColor = color === 'white' ? 'black' : 'white';
  const direction = isKingside ? 1 : -1;
  
  // Check the squares the king passes through (including destination)
  for (let i = 1; i <= 2; i++) {
    const checkCol = kingCol + (direction * i);
    if (isSquareUnderAttack(board, { row: kingRow, col: checkCol }, opponentColor)) {
      return false;
    }
  }
  
  return true;
};

// Find the king's position for a given color
export const findKingPosition = (board: Board, color: PieceColor): Position | null => {
  const rows = board.length;
  const cols = board[0].length;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

// Check if a position is under attack by the opponent
export const isSquareUnderAttack = (board: Board, position: Position, attackerColor: PieceColor): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const piece = board[row][col];
      if (piece && piece.color === attackerColor) {
        // For attack checking, we don't consider castling (to avoid recursion)
        // and en passant doesn't affect king safety checks
        if (isValidMoveBasicForAttack(board, { row, col }, position)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Simplified move validation for attack checking (no castling, no en passant)
const isValidMoveBasicForAttack = (board: Board, from: Position, to: Position): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  
  if (to.row < 0 || to.row >= rows || to.col < 0 || to.col >= cols) return false;
  
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  const target = board[to.row][to.col];
  if (target && target.color === piece.color) return false;
  if (from.row === to.row && from.col === to.col) return false;
  
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  switch (piece.type) {
    case 'pawn': {
      // Pawns attack diagonally
      const direction = piece.color === 'white' ? -1 : 1;
      return absColDiff === 1 && rowDiff === direction;
    }
    case 'knight':
      return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
    case 'bishop':
      if (absRowDiff !== absColDiff) return false;
      return isPathClear(board, from, to);
    case 'rook':
      if (rowDiff !== 0 && colDiff !== 0) return false;
      return isPathClear(board, from, to);
    case 'queen':
      if (absRowDiff !== absColDiff && rowDiff !== 0 && colDiff !== 0) return false;
      return isPathClear(board, from, to);
    case 'king':
      return absRowDiff <= 1 && absColDiff <= 1;
    default:
      return false;
  }
};

// Check if a king is in check
export const isKingInCheck = (board: Board, kingColor: PieceColor): boolean => {
  const kingPos = findKingPosition(board, kingColor);
  if (!kingPos) return false;
  
  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  return isSquareUnderAttack(board, kingPos, opponentColor);
};

// Check if a move would leave the player's own king in check
export const wouldMoveLeaveKingInCheck = (
  board: Board, 
  from: Position, 
  to: Position, 
  playerColor: PieceColor,
  enPassantTarget: Position | null = null
): boolean => {
  // Simulate the move
  const newBoard = board.map(r => [...r]);
  const piece = newBoard[from.row][from.col];
  
  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;
  
  // Handle en passant capture (remove the captured pawn)
  if (piece && piece.type === 'pawn' && enPassantTarget && 
      to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
    const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    newBoard[capturedPawnRow][to.col] = null;
  }
  
  // Handle castling (move the rook too)
  if (piece && piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    const isKingside = to.col > from.col;
    const rookFromCol = isKingside ? 8 : 0;
    const rookToCol = isKingside ? to.col - 1 : to.col + 1;
    newBoard[to.row][rookToCol] = newBoard[to.row][rookFromCol];
    newBoard[to.row][rookFromCol] = null;
  }
  
  // Check if king is in check after the move
  return isKingInCheck(newBoard, playerColor);
};

// Validate move including check considerations (full legal move validation)
export const isValidMove = (
  board: Board, 
  from: Position, 
  to: Position,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): boolean => {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  // First check basic move validity
  if (!isValidMoveBasic(board, from, to, enPassantTarget, castlingRights)) return false;
  
  // Then check if the move would leave own king in check
  if (wouldMoveLeaveKingInCheck(board, from, to, piece.color, enPassantTarget)) return false;
  
  return true;
};

// Get all valid moves for a piece (considering check)
export const getValidMoves = (
  board: Board, 
  from: Position,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): Position[] => {
  const rows = board.length;
  const cols = board[0].length;
  const moves: Position[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isValidMove(board, from, { row, col }, enPassantTarget, castlingRights)) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
};

// Get all pieces of a color
export const getPiecesOfColor = (board: Board, color: PieceColor): { piece: ChessPiece; position: Position }[] => {
  const rows = board.length;
  const cols = board[0].length;
  const pieces: { piece: ChessPiece; position: Position }[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        pieces.push({ piece, position: { row, col } });
      }
    }
  }
  return pieces;
};

// Get all legal moves for a color (considering check)
export const getAllLegalMoves = (
  board: Board, 
  color: PieceColor,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): { from: Position; to: Position; piece: ChessPiece }[] => {
  const allMoves: { from: Position; to: Position; piece: ChessPiece }[] = [];
  const pieces = getPiecesOfColor(board, color);
  
  for (const { piece, position } of pieces) {
    const validMoves = getValidMoves(board, position, enPassantTarget, castlingRights);
    for (const to of validMoves) {
      allMoves.push({ from: position, to, piece });
    }
  }
  
  return allMoves;
};

// Get all possible moves for a color (for AI - uses basic moves for performance)
export const getAllMoves = (
  board: Board, 
  color: PieceColor,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): { from: Position; to: Position; piece: ChessPiece }[] => {
  return getAllLegalMoves(board, color, enPassantTarget, castlingRights);
};

// Check if a player is in checkmate
export const isCheckmate = (
  board: Board, 
  color: PieceColor,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): boolean => {
  // First, the king must be in check
  if (!isKingInCheck(board, color)) return false;
  
  // Then, there must be no legal moves
  const legalMoves = getAllLegalMoves(board, color, enPassantTarget, castlingRights);
  return legalMoves.length === 0;
};

// Check if a player is in stalemate (not in check but no legal moves)
export const isStalemate = (
  board: Board, 
  color: PieceColor,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): boolean => {
  // King must NOT be in check
  if (isKingInCheck(board, color)) return false;
  
  // And there must be no legal moves
  const legalMoves = getAllLegalMoves(board, color, enPassantTarget, castlingRights);
  return legalMoves.length === 0;
};

// Get complete check status for a color
export const getCheckStatus = (
  board: Board, 
  color: PieceColor,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): CheckStatus => {
  const isInCheck = isKingInCheck(board, color);
  const isCheckmateStatus = isInCheck && getAllLegalMoves(board, color, enPassantTarget, castlingRights).length === 0;
  const kingPos = isInCheck ? findKingPosition(board, color) : null;
  
  return {
    isInCheck,
    isCheckmate: isCheckmateStatus,
    checkedKingPosition: kingPos
  };
};

// ============ DRAW DETECTION ============

// Generate a unique string representation of the board position
export const getBoardPositionHash = (
  board: Board,
  currentPlayer: PieceColor,
  castlingRights: CastlingRights,
  enPassantTarget: Position | null
): string => {
  let hash = '';
  
  // Board state
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      const piece = board[row][col];
      if (piece) {
        hash += `${piece.color[0]}${piece.type[0]}${row}${col}`;
      }
    }
  }
  
  // Current player
  hash += currentPlayer[0];
  
  // Castling rights
  hash += castlingRights.whiteKingside ? 'K' : '';
  hash += castlingRights.whiteQueenside ? 'Q' : '';
  hash += castlingRights.blackKingside ? 'k' : '';
  hash += castlingRights.blackQueenside ? 'q' : '';
  
  // En passant target
  if (enPassantTarget) {
    hash += `e${enPassantTarget.row}${enPassantTarget.col}`;
  }
  
  return hash;
};

// Check for threefold repetition
export const isThreefoldRepetition = (positionHistory: string[], currentPosition: string): boolean => {
  const count = positionHistory.filter(pos => pos === currentPosition).length;
  return count >= 2; // Current position will be the third occurrence
};

// Check for fifty-move rule
export const isFiftyMoveRule = (halfMoveClock: number): boolean => {
  return halfMoveClock >= 100; // 50 moves = 100 half-moves
};

// Check for insufficient material
export const isInsufficientMaterial = (board: Board): boolean => {
  const pieces: { type: string; color: PieceColor; position: Position }[] = [];
  
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      const piece = board[row][col];
      if (piece) {
        pieces.push({ type: piece.type, color: piece.color, position: { row, col } });
      }
    }
  }
  
  // King vs King
  if (pieces.length === 2) {
    return pieces.every(p => p.type === 'king');
  }
  
  // King + Bishop vs King or King + Knight vs King
  if (pieces.length === 3) {
    const nonKings = pieces.filter(p => p.type !== 'king');
    if (nonKings.length === 1) {
      return nonKings[0].type === 'bishop' || nonKings[0].type === 'knight';
    }
  }
  
  // King + Bishop vs King + Bishop (same color bishops)
  if (pieces.length === 4) {
    const bishops = pieces.filter(p => p.type === 'bishop');
    if (bishops.length === 2) {
      // Check if bishops are on same color squares
      const bishopSquareColors = bishops.map(b => (b.position.row + b.position.col) % 2);
      return bishopSquareColors[0] === bishopSquareColors[1];
    }
  }
  
  return false;
};

// Get complete draw status
export const getDrawStatus = (
  board: Board,
  currentPlayer: PieceColor,
  enPassantTarget: Position | null,
  castlingRights: CastlingRights,
  positionHistory: string[],
  halfMoveClock: number
): DrawStatus => {
  // Check stalemate first
  if (isStalemate(board, currentPlayer, enPassantTarget, castlingRights)) {
    return { isDraw: true, reason: 'stalemate' };
  }
  
  // Check threefold repetition
  const currentPosition = getBoardPositionHash(board, currentPlayer, castlingRights, enPassantTarget);
  if (isThreefoldRepetition(positionHistory, currentPosition)) {
    return { isDraw: true, reason: 'threefold' };
  }
  
  // Check fifty-move rule
  if (isFiftyMoveRule(halfMoveClock)) {
    return { isDraw: true, reason: 'fifty-move' };
  }
  
  // Check insufficient material
  if (isInsufficientMaterial(board)) {
    return { isDraw: true, reason: 'insufficient' };
  }
  
  return { isDraw: false, reason: null };
};

// Determine what type of special move this is
export const getSpecialMoveType = (
  board: Board,
  from: Position,
  to: Position,
  enPassantTarget: Position | null
): SpecialMoveType => {
  const piece = board[from.row][from.col];
  if (!piece) return null;
  
  // Castling
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    return to.col > from.col ? 'castleKingside' : 'castleQueenside';
  }
  
  // En passant
  if (piece.type === 'pawn' && enPassantTarget && 
      to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
    return 'enPassant';
  }
  
  // Pawn promotion (reaching the last rank)
  const rows = board.length;
  if (piece.type === 'pawn') {
    if ((piece.color === 'white' && to.row === 0) || 
        (piece.color === 'black' && to.row === rows - 1)) {
      return 'promotion';
    }
  }
  
  return null;
};

// Check if a move is a pawn promotion
export const isPromotionMove = (board: Board, from: Position, to: Position): boolean => {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== 'pawn') return false;
  
  const rows = board.length;
  return (piece.color === 'white' && to.row === 0) || 
         (piece.color === 'black' && to.row === rows - 1);
};

// Execute a move and return the result
export const executeMove = (
  board: Board,
  from: Position,
  to: Position,
  castlingRights: CastlingRights,
  enPassantTarget: Position | null,
  promotionPiece: PromotionPiece = 'queen'
): MoveResult => {
  const newBoard = board.map(r => [...r]);
  const piece = newBoard[from.row][from.col];
  const rows = board.length;
  
  if (!piece) {
    return {
      newBoard,
      captured: null,
      newEnPassantTarget: null,
      newCastlingRights: castlingRights,
      specialMove: null
    };
  }
  
  let captured = newBoard[to.row][to.col];
  let specialMove = getSpecialMoveType(board, from, to, enPassantTarget);
  let newEnPassantTarget: Position | null = null;
  const newCastlingRights = { ...castlingRights };
  
  // Handle en passant capture
  if (specialMove === 'enPassant') {
    const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    captured = newBoard[capturedPawnRow][to.col];
    newBoard[capturedPawnRow][to.col] = null;
  }
  
  // Handle castling
  if (specialMove === 'castleKingside' || specialMove === 'castleQueenside') {
    const isKingside = specialMove === 'castleKingside';
    const rookFromCol = isKingside ? 8 : 0;
    const rookToCol = isKingside ? to.col - 1 : to.col + 1;
    newBoard[to.row][rookToCol] = newBoard[to.row][rookFromCol];
    newBoard[to.row][rookFromCol] = null;
  }
  
  // Handle pawn promotion
  if (specialMove === 'promotion') {
    newBoard[to.row][to.col] = { type: promotionPiece, color: piece.color };
  } else {
    newBoard[to.row][to.col] = piece;
  }
  newBoard[from.row][from.col] = null;
  
  // Set en passant target if pawn moved two squares
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    const epRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    newEnPassantTarget = { row: epRow, col: to.col };
  }
  
  // Update castling rights
  // King moved
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newCastlingRights.whiteKingside = false;
      newCastlingRights.whiteQueenside = false;
    } else {
      newCastlingRights.blackKingside = false;
      newCastlingRights.blackQueenside = false;
    }
  }
  
  // Rook moved or captured
  if (piece.type === 'rook') {
    if (piece.color === 'white') {
      if (from.col === 0 && from.row === rows - 1) newCastlingRights.whiteQueenside = false;
      if (from.col === 8 && from.row === rows - 1) newCastlingRights.whiteKingside = false;
    } else {
      if (from.col === 0 && from.row === 0) newCastlingRights.blackQueenside = false;
      if (from.col === 8 && from.row === 0) newCastlingRights.blackKingside = false;
    }
  }
  
  // Rook captured
  if (captured && captured.type === 'rook') {
    if (captured.color === 'white') {
      if (to.col === 0 && to.row === rows - 1) newCastlingRights.whiteQueenside = false;
      if (to.col === 8 && to.row === rows - 1) newCastlingRights.whiteKingside = false;
    } else {
      if (to.col === 0 && to.row === 0) newCastlingRights.blackQueenside = false;
      if (to.col === 8 && to.row === 0) newCastlingRights.blackKingside = false;
    }
  }
  
  return {
    newBoard,
    captured,
    newEnPassantTarget,
    newCastlingRights,
    specialMove
  };
};

// Piece values for AI evaluation
const pieceValues: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100
};

// Evaluate board position for AI
export const evaluateBoard = (
  board: Board,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights | null = null
): number => {
  const rows = board.length;
  const cols = board[0].length;
  let score = 0;
  
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);
  
  // Check for checkmate/check bonuses
  if (isCheckmate(board, 'white', enPassantTarget, castlingRights)) return 10000;
  if (isCheckmate(board, 'black', enPassantTarget, castlingRights)) return -10000;
  if (isKingInCheck(board, 'white')) score += 50;
  if (isKingInCheck(board, 'black')) score -= 50;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = pieceValues[piece.type];
        // Positive for black (AI), negative for white
        score += piece.color === 'black' ? value : -value;
        
        // Bonus for center control
        const centerBonus = (centerCol - Math.abs(centerCol - col)) * 0.1 + (centerRow - Math.abs(centerRow - row)) * 0.05;
        score += piece.color === 'black' ? centerBonus : -centerBonus;
      }
    }
  }
  
  return score;
};

// Minimax with alpha-beta pruning for AI
const minimax = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  enPassantTarget: Position | null,
  castlingRights: CastlingRights
): number => {
  if (depth === 0) {
    return evaluateBoard(board, enPassantTarget, castlingRights);
  }
  
  const color: PieceColor = isMaximizing ? 'black' : 'white';
  
  // Check for checkmate
  if (isCheckmate(board, color, enPassantTarget, castlingRights)) {
    return isMaximizing ? -10000 : 10000;
  }
  
  const moves = getAllMoves(board, color, enPassantTarget, castlingRights);
  
  if (moves.length === 0) {
    // Stalemate
    return 0;
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const result = executeMove(board, move.from, move.to, castlingRights, enPassantTarget);
      const evaluation = minimax(
        result.newBoard, 
        depth - 1, 
        alpha, 
        beta, 
        false,
        result.newEnPassantTarget,
        result.newCastlingRights
      );
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const result = executeMove(board, move.from, move.to, castlingRights, enPassantTarget);
      const evaluation = minimax(
        result.newBoard, 
        depth - 1, 
        alpha, 
        beta, 
        true,
        result.newEnPassantTarget,
        result.newCastlingRights
      );
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// AI move selection
export const getAIMove = (
  board: Board, 
  difficulty: number = 2,
  enPassantTarget: Position | null = null,
  castlingRights: CastlingRights = getInitialCastlingRights()
): { from: Position; to: Position; piece: ChessPiece } | null => {
  const moves = getAllMoves(board, 'black', enPassantTarget, castlingRights);
  
  if (moves.length === 0) return null;
  
  let bestMove = moves[0];
  let bestScore = -Infinity;
  
  for (const move of moves) {
    const result = executeMove(board, move.from, move.to, castlingRights, enPassantTarget);
    const score = minimax(
      result.newBoard, 
      difficulty, 
      -Infinity, 
      Infinity, 
      false,
      result.newEnPassantTarget,
      result.newCastlingRights
    );
    
    // Add some randomness for variety
    const randomFactor = Math.random() * 0.5;
    const adjustedScore = score + randomFactor;
    
    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestMove = move;
    }
  }
  
  return bestMove;
};

// Check if king is captured (game over)
export const isKingCaptured = (board: Board, color: PieceColor): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return false;
      }
    }
  }
  return true;
};

// Generate move notation
export const getMoveNotation = (
  from: Position, 
  to: Position, 
  piece: ChessPiece, 
  captured?: ChessPiece, 
  boardRows: number = 8,
  isCheck: boolean = false,
  isCheckmateNotation: boolean = false,
  specialMove: SpecialMoveType = null,
  promotedTo?: PromotionPiece
): string => {
  // Castling notation
  if (specialMove === 'castleKingside') {
    return 'O-O' + (isCheckmateNotation ? '#' : (isCheck ? '+' : ''));
  }
  if (specialMove === 'castleQueenside') {
    return 'O-O-O' + (isCheckmateNotation ? '#' : (isCheck ? '+' : ''));
  }
  
  const pieceSymbol = piece.type === 'pawn' ? '' : piece.type.charAt(0).toUpperCase();
  const fromSquare = `${String.fromCharCode(97 + from.col)}${boardRows - from.row}`;
  const toSquare = `${String.fromCharCode(97 + to.col)}${boardRows - to.row}`;
  const captureSymbol = captured ? 'x' : '-';
  const checkSymbol = isCheckmateNotation ? '#' : (isCheck ? '+' : '');
  const epSuffix = specialMove === 'enPassant' ? ' e.p.' : '';
  
  // Promotion notation
  let promotionSuffix = '';
  if (specialMove === 'promotion' && promotedTo) {
    const promotionSymbol = promotedTo === 'knight' ? 'N' : promotedTo.charAt(0).toUpperCase();
    promotionSuffix = `=${promotionSymbol}`;
  } else if (specialMove === 'promotion') {
    promotionSuffix = '=Q';
  }
  
  return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}${promotionSuffix}${epSuffix}${checkSymbol}`;
};
