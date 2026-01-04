import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChessBoard from './ChessBoard';
import GameTimer from './GameTimer';
import MoveHistory from './MoveHistory';
import RulesSection from './RulesSection';
import CapturedPieces from './CapturedPieces';
import GameModeSelector from './GameModeSelector';
import SaveLoadGame from './SaveLoadGame';
import BoardSizeSelector from './BoardSizeSelector';
import WinnerAnnouncement from './WinnerAnnouncement';
import DrawAnnouncement from './DrawAnnouncement';
import OnlineLobby from './OnlineLobby';
import AuthModal from './AuthModal';
import UserProfileDropdown from './UserProfileDropdown';
import { Move, GameMode, ChessPiece, Board, GameState, BoardSize, CheckStatus, CastlingRights, Position, DrawReason, OnlineGame } from '@/types/chess';
import { createInitialBoard, getInitialCastlingRights, getBoardPositionHash } from '@/utils/chessLogic';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Globe, Wifi, WifiOff, LogIn, UserPlus } from 'lucide-react';


const AppLayout: React.FC = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>('9x8');
  const [board, setBoard] = useState<Board>(createInitialBoard('9x8'));
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [isInCheck, setIsInCheck] = useState(false);
  const [isCheckmateState, setIsCheckmateState] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  
  // Draw state
  const [drawReason, setDrawReason] = useState<DrawReason>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  
  // En passant and castling state
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null);
  const [castlingRights, setCastlingRights] = useState<CastlingRights>(getInitialCastlingRights());
  
  // Draw detection state
  const [positionHistory, setPositionHistory] = useState<string[]>([]);
  const [halfMoveClock, setHalfMoveClock] = useState(0);
  
  // Online multiplayer state
  const [showOnlineLobby, setShowOnlineLobby] = useState(false);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState<string>('Opponent');

  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const { user, isAuthenticated, isLoading: authLoading, updateStats } = useAuth();

  // Refs for latest state values (to avoid stale closures in async callbacks)
  const boardRef = useRef(board);
  const capturedByWhiteRef = useRef(capturedByWhite);
  const capturedByBlackRef = useRef(capturedByBlack);
  const enPassantTargetRef = useRef(enPassantTarget);
  const castlingRightsRef = useRef(castlingRights);
  const positionHistoryRef = useRef(positionHistory);
  const halfMoveClockRef = useRef(halfMoveClock);

  // Keep refs updated
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { capturedByWhiteRef.current = capturedByWhite; }, [capturedByWhite]);
  useEffect(() => { capturedByBlackRef.current = capturedByBlack; }, [capturedByBlack]);
  useEffect(() => { enPassantTargetRef.current = enPassantTarget; }, [enPassantTarget]);
  useEffect(() => { castlingRightsRef.current = castlingRights; }, [castlingRights]);
  useEffect(() => { positionHistoryRef.current = positionHistory; }, [positionHistory]);
  useEffect(() => { halfMoveClockRef.current = halfMoveClock; }, [halfMoveClock]);

  // Subscribe to online game updates
  useEffect(() => {
    if (!onlineGameId || gameMode !== 'online') return;
    
    const channel = supabase
      .channel(`game_updates_${onlineGameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'online_games',
          filter: `id=eq.${onlineGameId}`
        },
        (payload) => {
          const game = payload.new as OnlineGame;
          
          // Update local state from server
          setBoard(game.board_state);
          setCurrentPlayer(game.current_player);
          setMoves(game.moves);
          setCapturedByWhite(game.captured_white);
          setCapturedByBlack(game.captured_black);
          setEnPassantTarget(game.en_passant_target);
          setCastlingRights(game.castling_rights);
          setPositionHistory(game.position_history);
          setHalfMoveClock(game.half_move_clock);
          
          if (game.game_status === 'finished') {
            setGameOver(true);
            setWinner(game.winner);
            if (game.draw_reason) {
              setDrawReason(game.draw_reason);
              setShowDrawModal(true);
            } else {
              setIsCheckmateState(true);
              setShowWinnerModal(true);
            }
            
            // Update user stats if authenticated
            if (isAuthenticated && game.winner) {
              if (game.winner === 'draw') {
                updateStats('draw');
              } else if (game.winner === playerColor) {
                updateStats('win');
              } else {
                updateStats('loss');
              }
            }
          }
        }
      )
      .subscribe((status) => {
        setIsOnlineConnected(status === 'SUBSCRIBED');
      });
    
    return () => {
      channel.unsubscribe();
    };
  }, [onlineGameId, gameMode, isAuthenticated, playerColor, updateStats]);

  const handleMove = async (move: Move) => {
    const newMoves = [...moves, move];
    setMoves(newMoves);
    setGameStarted(true);
    
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    
    // Check for checkmate or stalemate after the move
    if (move.isCheckmate) {
      setGameOver(true);
      setWinner(currentPlayer);
      setIsCheckmateState(true);
      setShowWinnerModal(true);
      
      // Update stats for online games
      if (gameMode === 'online' && isAuthenticated) {
        if (currentPlayer === playerColor) {
          updateStats('win');
        } else {
          updateStats('loss');
        }
      }
    }
    
    setCurrentPlayer(nextPlayer);
    
    // Sync to server for online games - use refs to get latest state
    if (gameMode === 'online' && onlineGameId) {
      // Small delay to ensure state is updated
      setTimeout(async () => {
        try {
          await supabase
            .from('online_games')
            .update({
              board_state: boardRef.current,
              current_player: nextPlayer,
              moves: newMoves,
              captured_white: capturedByWhiteRef.current,
              captured_black: capturedByBlackRef.current,
              en_passant_target: enPassantTargetRef.current,
              castling_rights: castlingRightsRef.current,
              position_history: positionHistoryRef.current,
              half_move_clock: halfMoveClockRef.current,
              game_status: move.isCheckmate ? 'finished' : 'playing',
              winner: move.isCheckmate ? currentPlayer : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', onlineGameId);
        } catch (err) {
          console.error('Failed to sync move:', err);
        }
      }, 100);
    }
  };

  const handleCapture = (piece: ChessPiece) => {
    if (currentPlayer === 'white') {
      setCapturedByWhite(prev => [...prev, piece]);
    } else {
      setCapturedByBlack(prev => [...prev, piece]);
    }
    
    // Check if king was captured (shouldn't happen with proper checkmate detection, but as fallback)
    if (piece.type === 'king') {
      setGameOver(true);
      setWinner(currentPlayer);
      setShowWinnerModal(true);
    }
  };

  const handleCheckStatusChange = useCallback((status: CheckStatus) => {
    setIsInCheck(status.isInCheck);
    
    if (status.isCheckmate && !gameOver) {
      // The player whose turn it is has been checkmated
      // So the OTHER player wins
      const winningPlayer = currentPlayer === 'white' ? 'black' : 'white';
      setGameOver(true);
      setWinner(winningPlayer);
      setIsCheckmateState(true);
      setShowWinnerModal(true);
    }
  }, [currentPlayer, gameOver]);

  const handleDraw = useCallback(async (reason: DrawReason) => {
    if (!gameOver) {
      setGameOver(true);
      setWinner('draw');
      setDrawReason(reason);
      setShowDrawModal(true);
      
      // Update stats for online games
      if (gameMode === 'online' && isAuthenticated) {
        updateStats('draw');
      }
      
      // Sync to server for online games
      if (gameMode === 'online' && onlineGameId) {
        await supabase
          .from('online_games')
          .update({
            game_status: 'finished',
            winner: 'draw',
            draw_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', onlineGameId);
      }
    }
  }, [gameOver, gameMode, onlineGameId, isAuthenticated, updateStats]);

  const handleTimeOut = (player: 'white' | 'black') => {
    setGameOver(true);
    setWinner(player === 'white' ? 'black' : 'white');
    setShowWinnerModal(true);
  };

  const handleModeChange = (mode: GameMode) => {
    if (!gameStarted) {
      if (mode === 'online') {
        setShowOnlineLobby(true);
      } else {
        setGameMode(mode);
        setShowOnlineLobby(false);
      }
    }
  };

  const handleBoardSizeChange = (size: BoardSize) => {
    if (!gameStarted) {
      setBoardSize(size);
      setBoard(createInitialBoard(size));
      setEnPassantTarget(null);
      setCastlingRights(getInitialCastlingRights());
      setPositionHistory([]);
      setHalfMoveClock(0);
    }
  };

  const handleJoinOnlineGame = async (gameId: string, pId: string, pColor: 'white' | 'black') => {
    setOnlineGameId(gameId);
    setPlayerId(pId);
    setPlayerColor(pColor);
    setGameMode('online');
    setShowOnlineLobby(false);
    setGameStarted(true);
    
    // Fetch initial game state
    const { data: game } = await supabase
      .from('online_games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (game) {
      setBoardSize(game.board_size as BoardSize);
      setBoard(game.board_state);
      setCurrentPlayer(game.current_player);
      setMoves(game.moves);
      setCapturedByWhite(game.captured_white);
      setCapturedByBlack(game.captured_black);
      setEnPassantTarget(game.en_passant_target);
      setCastlingRights(game.castling_rights);
      setPositionHistory(game.position_history || []);
      setHalfMoveClock(game.half_move_clock || 0);
      
      // Set opponent username
      if (pColor === 'white') {
        setOpponentUsername(game.black_username || 'Opponent');
      } else {
        setOpponentUsername(game.white_username || 'Opponent');
      }
    }
  };

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard(boardSize));
    setMoves([]);
    setCurrentPlayer('white');
    setGameOver(false);
    setWinner(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setGameStarted(false);
    setIsInCheck(false);
    setIsCheckmateState(false);
    setShowWinnerModal(false);
    setEnPassantTarget(null);
    setCastlingRights(getInitialCastlingRights());
    setPositionHistory([]);
    setHalfMoveClock(0);
    setDrawReason(null);
    setShowDrawModal(false);
    
    // Reset online state
    if (gameMode === 'online') {
      setOnlineGameId(null);
      setPlayerId(null);
      setPlayerColor(null);
      setIsOnlineConnected(false);
      setOpponentUsername('Opponent');
      setGameMode('pvp');
    }
  }, [boardSize, gameMode]);

  const getCurrentGameState = (): GameState => ({
    board,
    currentPlayer,
    moves,
    capturedWhite: capturedByWhite,
    capturedBlack: capturedByBlack,
    gameMode,
    gameOver,
    winner: winner || undefined,
    boardSize,
    isInCheck,
    isCheckmate: isCheckmateState,
    enPassantTarget,
    castlingRights,
    positionHistory,
    halfMoveClock,
    drawReason: drawReason || undefined
  });

  const handleLoadGame = (state: GameState) => {
    setBoard(state.board);
    setCurrentPlayer(state.currentPlayer);
    setMoves(state.moves);
    setCapturedByWhite(state.capturedWhite);
    setCapturedByBlack(state.capturedBlack);
    setGameMode(state.gameMode === 'online' ? 'pvp' : state.gameMode); // Don't load online mode
    setGameOver(state.gameOver);
    setWinner(state.winner || null);
    setBoardSize(state.boardSize || '9x8');
    setGameStarted(state.moves.length > 0);
    setIsInCheck(state.isInCheck || false);
    setIsCheckmateState(state.isCheckmate || false);
    setShowWinnerModal(false);
    setEnPassantTarget(state.enPassantTarget || null);
    setCastlingRights(state.castlingRights || getInitialCastlingRights());
    setPositionHistory(state.positionHistory || []);
    setHalfMoveClock(state.halfMoveClock || 0);
    setDrawReason(state.drawReason || null);
    setShowDrawModal(false);
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const boardLabel = boardSize === '9x9' ? '9×9' : '9×8';
  const isMyTurn = gameMode !== 'online' || currentPlayer === playerColor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* Winner Announcement Modal */}
      {showWinnerModal && (
        <WinnerAnnouncement
          winner={winner}
          isCheckmate={isCheckmateState}
          onNewGame={resetGame}
          onClose={() => setShowWinnerModal(false)}
        />
      )}
      
      {/* Draw Announcement Modal */}
      {showDrawModal && drawReason && (
        <DrawAnnouncement
          reason={drawReason}
          onNewGame={resetGame}
          onClose={() => setShowDrawModal(false)}
        />
      )}

      {/* Header with Auth */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DQ</span>
            </div>
            <span className="text-amber-400 font-bold hidden sm:block">Dual Queens Chess</span>
          </div>
          
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
            ) : isAuthenticated ? (
              <UserProfileDropdown />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
        <img 
          src="https://d64gsuwffb70l.cloudfront.net/68e96460caba0a2532c85efe_1760126094749_cf9667a8.webp"
          alt="Chess Hero"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-amber-400 mb-2 sm:mb-4 drop-shadow-lg">
              {boardLabel} Dual Queens Chess
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-amber-100 drop-shadow-md max-w-2xl mx-auto">
              Experience chess evolved with an expanded board and double the royal power
            </p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {showOnlineLobby ? (
          <OnlineLobby
            onJoinGame={handleJoinOnlineGame}
            onBack={() => setShowOnlineLobby(false)}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-6">
            {/* Left Sidebar - Mobile: Below board */}
            <div className="order-2 xl:order-1 space-y-3 sm:space-y-4">
              <BoardSizeSelector
                size={boardSize}
                onSizeChange={handleBoardSizeChange}
                disabled={gameStarted}
              />
              <GameModeSelector 
                mode={gameMode} 
                onModeChange={handleModeChange}
                disabled={gameStarted}
              />
              
              {/* Online Play Button */}
              {!gameStarted && gameMode !== 'online' && (
                <button
                  onClick={() => setShowOnlineLobby(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Globe className="w-5 h-5" />
                  Play Online
                </button>
              )}
              
              {/* Online Status */}
              {gameMode === 'online' && (
                <div className={`bg-gray-800 rounded-lg p-3 border ${isOnlineConnected ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-center gap-2">
                    {isOnlineConnected ? (
                      <Wifi className="w-5 h-5 text-green-400" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`font-medium ${isOnlineConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isOnlineConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-400 text-sm">
                      You: <span className={`font-bold ${playerColor === 'white' ? 'text-white' : 'text-gray-300'}`}>
                        {playerColor} {user?.username ? `(${user.username})` : ''}
                      </span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Opponent: <span className={`font-bold ${playerColor === 'white' ? 'text-gray-300' : 'text-white'}`}>
                        {playerColor === 'white' ? 'black' : 'white'} ({opponentUsername})
                      </span>
                    </p>
                  </div>
                </div>
              )}
              
              <CapturedPieces 
                pieces={capturedByWhite} 
                color="black" 
                label="Captured by White"
              />
              <CapturedPieces 
                pieces={capturedByBlack} 
                color="white" 
                label="Captured by Black"
              />
              {gameMode !== 'online' && (
                <SaveLoadGame
                  currentState={getCurrentGameState()}
                  onLoadGame={handleLoadGame}
                  onNewGame={resetGame}
                />
              )}
            </div>

            {/* Chess Board */}
            <div className="order-1 xl:order-2 xl:col-span-1 flex flex-col items-center">
              <div className="w-full max-w-lg space-y-3 sm:space-y-4">
                {/* Game Status */}
                <div className={`bg-gray-800 rounded-lg p-2 sm:p-3 text-center border ${
                  isInCheck && !gameOver ? 'border-red-500 animate-pulse' : 'border-gray-700'
                }`}>
                  {gameOver ? (
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-amber-400 mb-1">
                        {isCheckmateState ? 'Checkmate!' : drawReason ? 'Draw!' : 'Game Over!'}
                      </p>
                      <p className="text-base sm:text-lg text-green-400">
                        {winner === 'draw' ? getDrawReasonText(drawReason) : `${winner?.charAt(0).toUpperCase()}${winner?.slice(1)} wins!`}
                      </p>
                      <button
                        onClick={() => winner === 'draw' ? setShowDrawModal(true) : setShowWinnerModal(true)}
                        className="mt-2 text-amber-400 hover:text-amber-300 text-sm underline"
                      >
                        View Results
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${currentPlayer === 'white' ? 'bg-white' : 'bg-gray-900 border border-gray-600'}`} />
                        <p className="text-lg sm:text-xl font-bold text-amber-400">
                          {currentPlayer === 'white' ? "White's" : "Black's"} Turn
                          {gameMode === 'ai' && currentPlayer === 'black' && ' (AI)'}
                          {gameMode === 'online' && !isMyTurn && ' (Opponent)'}
                        </p>
                      </div>
                      {isInCheck && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-semibold text-sm sm:text-base">Check!</span>
                        </div>
                      )}
                      {gameMode === 'online' && !isMyTurn && (
                        <p className="text-gray-400 text-sm mt-1">Waiting for {opponentUsername}...</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Board */}
                <ChessBoard 
                  onMove={handleMove} 
                  currentPlayer={currentPlayer}
                  gameMode={gameMode === 'online' && !isMyTurn ? 'pvp' : gameMode} // Disable moves when not your turn
                  board={board}
                  setBoard={setBoard}
                  gameOver={gameOver || (gameMode === 'online' && !isMyTurn)}
                  onCapture={handleCapture}
                  boardSize={boardSize}
                  onCheckStatusChange={handleCheckStatusChange}
                  enPassantTarget={enPassantTarget}
                  setEnPassantTarget={setEnPassantTarget}
                  castlingRights={castlingRights}
                  setCastlingRights={setCastlingRights}
                  positionHistory={positionHistory}
                  setPositionHistory={setPositionHistory}
                  halfMoveClock={halfMoveClock}
                  setHalfMoveClock={setHalfMoveClock}
                  onDraw={handleDraw}
                />
                
                {/* Special Moves Legend */}
                <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700">
                  <p className="text-xs sm:text-sm text-gray-400 font-medium mb-2">Move Indicators:</p>
                  <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-green-500/50 rounded-full" />
                      <span className="text-gray-300">Normal move</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full ring-1 ring-red-400" />
                      <span className="text-gray-300">Capture</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-blue-500/70 rounded-full ring-1 ring-blue-400" />
                      <span className="text-gray-300">Castling</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-purple-500/70 rounded-full ring-1 ring-purple-400" />
                      <span className="text-gray-300">En passant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-amber-500/70 rounded-full ring-1 ring-amber-400" />
                      <span className="text-gray-300">Promotion</span>
                    </div>
                  </div>
                </div>
                
                {/* New Game Button */}
                <button
                  onClick={resetGame}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                >
                  New Game
                </button>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="order-3 space-y-3 sm:space-y-4">
              <GameTimer 
                currentPlayer={currentPlayer} 
                onTimeOut={handleTimeOut}
                gameOver={gameOver}
                gameStarted={gameStarted}
              />
              <MoveHistory moves={moves} />
            </div>
          </div>
        )}

        {/* Rules Section */}
        <div className="mt-6 sm:mt-10">
          <RulesSection boardSize={boardSize} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-4 sm:py-6 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm sm:text-base">{boardLabel} Dual Queens Chess - A modern twist on the classic game</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Play against a friend, challenge the AI, or play online</p>
          {isAuthenticated && (
            <p className="text-amber-400/60 text-xs mt-2">
              Signed in as {user?.username}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

// Helper function to get draw reason text
const getDrawReasonText = (reason: DrawReason): string => {
  switch (reason) {
    case 'stalemate': return 'Draw by Stalemate';
    case 'threefold': return 'Draw by Threefold Repetition';
    case 'fifty-move': return 'Draw by 50-Move Rule';
    case 'insufficient': return 'Draw by Insufficient Material';
    case 'agreement': return 'Draw by Agreement';
    default: return 'Draw';
  }
};

export default AppLayout;
