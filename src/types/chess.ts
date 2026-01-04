export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';
export type GameMode = 'pvp' | 'ai' | 'online';
export type BoardSize = '9x8' | '9x9';
export type SpecialMoveType = 'enPassant' | 'castleKingside' | 'castleQueenside' | 'promotion' | null;
export type PromotionPiece = 'queen' | 'rook' | 'bishop' | 'knight';
export type DrawReason = 'stalemate' | 'threefold' | 'fifty-move' | 'insufficient' | 'agreement' | null;

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number;
  col: number;
}

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  captured?: ChessPiece;
  notation: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  specialMove?: SpecialMoveType;
  promotedTo?: PromotionPiece;
}

export type Board = (ChessPiece | null)[][];

export interface BoardDimensions {
  rows: number;
  cols: number;
}

export const getBoardDimensions = (size: BoardSize): BoardDimensions => {
  return size === '9x9' ? { rows: 9, cols: 9 } : { rows: 8, cols: 9 };
};

export const getInitialCastlingRights = (): CastlingRights => ({
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true
});

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  moves: Move[];
  capturedWhite: ChessPiece[];
  capturedBlack: ChessPiece[];
  gameMode: GameMode;
  gameOver: boolean;
  winner?: PieceColor | 'draw';
  savedAt?: string;
  gameName?: string;
  boardSize: BoardSize;
  isInCheck?: boolean;
  isCheckmate?: boolean;
  enPassantTarget: Position | null;
  castlingRights: CastlingRights;
  positionHistory: string[];
  halfMoveClock: number;
  drawReason?: DrawReason;
}

export interface SavedGame {
  id: string;
  name: string;
  savedAt: string;
  state: GameState;
}

export interface CheckStatus {
  isInCheck: boolean;
  isCheckmate: boolean;
  checkedKingPosition: Position | null;
}

export interface DrawStatus {
  isDraw: boolean;
  reason: DrawReason;
}

// Result of executing a move, includes board changes and any special effects
export interface MoveResult {
  newBoard: Board;
  captured: ChessPiece | null;
  newEnPassantTarget: Position | null;
  newCastlingRights: CastlingRights;
  specialMove: SpecialMoveType;
}

// Online game types
export interface OnlineGame {
  id: string;
  room_code: string;
  white_player_id: string | null;
  black_player_id: string | null;
  white_username?: string;
  black_username?: string;
  board_size: BoardSize;
  board_state: Board;
  current_player: PieceColor;
  moves: Move[];
  captured_white: ChessPiece[];
  captured_black: ChessPiece[];
  en_passant_target: Position | null;
  castling_rights: CastlingRights;
  position_history: string[];
  half_move_clock: number;
  game_status: 'waiting' | 'playing' | 'finished';
  winner: PieceColor | 'draw' | null;
  draw_reason: DrawReason;
  created_at: string;
  updated_at: string;
}

// Pending promotion state
export interface PendingPromotion {
  from: Position;
  to: Position;
  piece: ChessPiece;
  captured?: ChessPiece;
}
