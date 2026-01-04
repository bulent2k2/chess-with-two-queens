import React, { useState, useEffect } from 'react';
import { BoardSize } from '@/types/chess';
import { Globe, Users, Copy, Check, Loader2, ArrowLeft, User, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createInitialBoard, getInitialCastlingRights } from '@/utils/chessLogic';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onJoinGame: (gameId: string, playerId: string, playerColor: 'white' | 'black') => void;
  onBack: () => void;
}

const OnlineLobby: React.FC<Props> = ({ onJoinGame, onBack }) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [boardSize, setBoardSize] = useState<BoardSize>('9x8');
  const [roomCode, setRoomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  
  // Generate player ID - use user ID if authenticated, otherwise generate anonymous ID
  const [playerId] = useState(() => {
    if (user?.id) return user.id;
    return `anon_${Math.random().toString(36).substr(2, 9)}`;
  });

  // Update playerId when user changes
  const effectivePlayerId = user?.id || playerId;

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Subscribe to game updates when waiting for opponent
  useEffect(() => {
    if (!waitingForOpponent || !currentGameId) return;

    const channel = supabase
      .channel(`waiting_${currentGameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'online_games',
          filter: `id=eq.${currentGameId}`
        },
        (payload) => {
          const game = payload.new as any;
          if (game.black_player_id && game.game_status === 'playing') {
            channel.unsubscribe();
            onJoinGame(currentGameId, effectivePlayerId, 'white');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [waitingForOpponent, currentGameId, effectivePlayerId, onJoinGame]);

  const createGame = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const code = generateRoomCode();
      const initialBoard = createInitialBoard(boardSize);
      const castlingRights = getInitialCastlingRights();
      
      // Prepare the game data - ensure all JSON fields are properly formatted
      const gameData = {
        room_code: code,
        white_player_id: effectivePlayerId,
        white_username: user?.username || 'Anonymous',
        board_size: boardSize,
        board_state: JSON.stringify(initialBoard),
        current_player: 'white',
        moves: JSON.stringify([]),
        captured_white: JSON.stringify([]),
        captured_black: JSON.stringify([]),
        en_passant_target: null,
        castling_rights: JSON.stringify(castlingRights),
        position_history: JSON.stringify([]),
        half_move_clock: 0,
        game_status: 'waiting'
      };
      
      console.log('Creating game with data:', gameData);
      
      const { data, error: insertError } = await supabase
        .from('online_games')
        .insert(gameData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message || 'Failed to create game');
      }
      
      if (!data) {
        throw new Error('No data returned from game creation');
      }
      
      setGeneratedCode(code);
      setCurrentGameId(data.id);
      setWaitingForOpponent(true);
      
    } catch (err: any) {
      console.error('Create game error:', err);
      setError(err.message || 'Failed to create game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const joinGame = async () => {
    if (roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Find the game
      const { data: game, error: findError } = await supabase
        .from('online_games')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('game_status', 'waiting')
        .single();
      
      if (findError || !game) {
        throw new Error('Game not found or already started. Please check the code and try again.');
      }

      // Check if trying to join own game
      if (game.white_player_id === effectivePlayerId) {
        throw new Error('You cannot join your own game');
      }
      
      // Join as black player
      const { error: updateError } = await supabase
        .from('online_games')
        .update({
          black_player_id: effectivePlayerId,
          black_username: user?.username || 'Anonymous',
          game_status: 'playing',
          updated_at: new Date().toISOString()
        })
        .eq('id', game.id);
      
      if (updateError) {
        throw new Error(updateError.message || 'Failed to join game');
      }
      
      onJoinGame(game.id, effectivePlayerId, 'black');
      
    } catch (err: any) {
      console.error('Join game error:', err);
      setError(err.message || 'Failed to join game');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Chess Game!',
          text: `Join my Dual Queens Chess game! Use code: ${generatedCode}`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  const cancelWaiting = () => {
    // Optionally delete the game from database
    if (currentGameId) {
      supabase
        .from('online_games')
        .delete()
        .eq('id', currentGameId)
        .then(() => {});
    }
    setWaitingForOpponent(false);
    setGeneratedCode('');
    setCurrentGameId(null);
    setMode('menu');
  };

  if (waitingForOpponent) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-500/20 rounded-full p-4">
              <Users className="w-12 h-12 text-amber-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-amber-400 mb-2">Waiting for Opponent</h2>
          <p className="text-gray-400 mb-6">Share this code with your friend:</p>
          
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-white tracking-widest select-all">
                {generatedCode}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 justify-center mb-6">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              onClick={shareCode}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors text-white"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Waiting for opponent to join...</span>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            <p>Playing as: <span className="text-white font-medium">White</span></p>
            <p>Board: <span className="text-amber-400">{boardSize === '9x9' ? '9×9' : '9×8'}</span></p>
          </div>
          
          <button
            onClick={cancelWaiting}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
        <button
          onClick={() => setMode('menu')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h2 className="text-xl font-bold text-amber-400 mb-4">Create Online Game</h2>
        
        {/* Player Info */}
        <div className="bg-gray-900/50 rounded-lg p-3 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">
              {isAuthenticated ? user?.username : 'Anonymous Player'}
            </p>
            <p className="text-gray-400 text-sm">
              {isAuthenticated ? 'Signed in' : 'Playing as guest'}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Board Size</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBoardSize('9x8')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  boardSize === '9x8'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                9×8 Board
              </button>
              <button
                onClick={() => setBoardSize('9x9')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  boardSize === '9x9'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                9×9 Board
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={createGame}
            disabled={isLoading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                Create Game
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
        <button
          onClick={() => setMode('menu')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h2 className="text-xl font-bold text-amber-400 mb-4">Join Online Game</h2>
        
        {/* Player Info */}
        <div className="bg-gray-900/50 rounded-lg p-3 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">
              {isAuthenticated ? user?.username : 'Anonymous Player'}
            </p>
            <p className="text-gray-400 text-sm">
              {isAuthenticated ? 'Signed in' : 'Playing as guest'}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="Enter 6-character code"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder:text-gray-500 focus:border-amber-500 focus:outline-none"
              maxLength={6}
              autoFocus
            />
            <p className="text-gray-500 text-xs mt-2 text-center">
              Enter the code shared by your friend
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={joinGame}
            disabled={isLoading || roomCode.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Join Game
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Local Play
      </button>
      
      <div className="flex items-center justify-center gap-2 mb-6">
        <Globe className="w-8 h-8 text-amber-400" />
        <h2 className="text-2xl font-bold text-amber-400">Online Multiplayer</h2>
      </div>
      
      <p className="text-gray-400 text-center mb-6">
        Play against a friend online! Create a game and share the code, or join with a code.
      </p>

      {/* Login Prompt for Anonymous Users */}
      {!isAuthenticated && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <p className="text-amber-300 text-sm text-center">
            Sign in to track your online game stats and history!
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={() => setMode('create')}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
        >
          <Globe className="w-6 h-6" />
          <div className="text-left">
            <div>Create Game</div>
            <div className="text-sm font-normal text-amber-200">Get a code to share</div>
          </div>
        </button>
        
        <button
          onClick={() => setMode('join')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
        >
          <Users className="w-6 h-6" />
          <div className="text-left">
            <div>Join Game</div>
            <div className="text-sm font-normal text-green-200">Enter a friend's code</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OnlineLobby;
