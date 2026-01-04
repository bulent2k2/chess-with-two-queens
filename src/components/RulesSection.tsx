import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Target, Lightbulb, Cpu, Shield, Castle, Swords, Crown, Scale, Globe, User } from 'lucide-react';
import { BoardSize } from '@/types/chess';

interface Props {
  boardSize: BoardSize;
}

const RulesSection: React.FC<Props> = ({ boardSize }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('setup');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const boardLabel = boardSize === '9x9' ? '9×9' : '9×8';
  const totalSquares = boardSize === '9x9' ? 81 : 72;
  const rows = boardSize === '9x9' ? 9 : 8;

  const sections = [
    {
      id: 'setup',
      title: 'Board Setup',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            The board is expanded to {boardLabel} squares ({totalSquares} total). Each player has two queens positioned on either side of the king, creating a symmetrical and powerful starting position.
          </p>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Black's back rank:</p>
            <p className="font-mono text-lg text-center text-amber-100">♜ ♞ ♝ ♛ ♚ ♛ ♝ ♞ ♜</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">White's back rank:</p>
            <p className="font-mono text-lg text-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">♖ ♘ ♗ ♕ ♔ ♕ ♗ ♘ ♖</p>
          </div>
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
            <p className="text-xs text-amber-300">
              <strong>Board Size Options:</strong> Choose between 9×8 (standard) or 9×9 (extended) before starting a game. The 9×8 board offers a more traditional feel while 9×9 provides extra strategic depth.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'rules',
      title: 'Key Rules',
      icon: <Target className="w-5 h-5" />,
      content: (
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1">•</span>
            <span>All standard chess piece movements apply on the expanded {boardLabel} board</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1">•</span>
            <span>Each player controls 2 queens, dramatically increasing tactical complexity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1">•</span>
            <span>Pawns can advance to the {rows}th rank for promotion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1">•</span>
            <span>Each player has 10 minutes on their clock</span>
          </li>
        </ul>
      )
    },
    {
      id: 'promotion',
      title: 'Pawn Promotion',
      icon: <Crown className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            When a pawn reaches the opposite end of the board (the {rows}th rank), it must be promoted to another piece!
          </p>
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
            <p className="text-amber-300 font-medium mb-2">Promotion Options</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800/50 rounded p-2 flex items-center gap-2">
                <span className="text-2xl">♕</span>
                <div>
                  <p className="text-amber-300 font-medium">Queen</p>
                  <p className="text-gray-400">Most powerful choice</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-2 flex items-center gap-2">
                <span className="text-2xl">♖</span>
                <div>
                  <p className="text-amber-300 font-medium">Rook</p>
                  <p className="text-gray-400">Strong in endgames</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-2 flex items-center gap-2">
                <span className="text-2xl">♗</span>
                <div>
                  <p className="text-amber-300 font-medium">Bishop</p>
                  <p className="text-gray-400">Diagonal control</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-2 flex items-center gap-2">
                <span className="text-2xl">♘</span>
                <div>
                  <p className="text-amber-300 font-medium">Knight</p>
                  <p className="text-gray-400">Useful for forks</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">
              <strong className="text-amber-400">Tip:</strong> Promotion squares are highlighted in <span className="text-amber-400">amber</span> when you select a pawn that can promote. A modal will appear to let you choose your piece.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'castling',
      title: 'Castling',
      icon: <Castle className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            Castling is a special move that allows you to move your king and rook simultaneously. It's the only move where two pieces move at once!
          </p>
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
            <p className="text-blue-300 font-medium mb-2">How to Castle</p>
            <p className="text-gray-300 mb-2">
              The king moves <strong>two squares</strong> toward a rook, and the rook jumps to the other side of the king.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800/50 rounded p-2">
                <p className="text-blue-300 font-medium">Kingside (O-O)</p>
                <p className="text-gray-400">King: e→g, Rook: i→f</p>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <p className="text-blue-300 font-medium">Queenside (O-O-O)</p>
                <p className="text-gray-400">King: e→c, Rook: a→d</p>
              </div>
            </div>
          </div>
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
            <p className="text-red-300 font-medium mb-2">Castling Requirements</p>
            <ul className="space-y-1 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400">×</span>
                <span>Neither the king nor the rook has moved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">×</span>
                <span>No pieces between the king and rook</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">×</span>
                <span>King is not currently in check</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">×</span>
                <span>King doesn't pass through or land on attacked squares</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">
              <strong className="text-blue-400">Tip:</strong> Castling squares are highlighted in <span className="text-blue-400">blue</span> when you select your king.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'enpassant',
      title: 'En Passant',
      icon: <Swords className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            En passant (French for "in passing") is a special pawn capture that can only occur under specific conditions.
          </p>
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
            <p className="text-purple-300 font-medium mb-2">When Can You Use En Passant?</p>
            <ul className="space-y-1 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">1.</span>
                <span>An opponent's pawn moves <strong>two squares</strong> forward from its starting position</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">2.</span>
                <span>Your pawn is on an adjacent file (column) and on the same rank the opponent's pawn passed through</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">3.</span>
                <span>You must capture <strong>immediately</strong> on your very next move</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 font-medium mb-2">How It Works</p>
            <p className="text-gray-300">
              Your pawn moves diagonally to the square the opponent's pawn passed through, capturing it as if it had only moved one square forward.
            </p>
          </div>
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
            <p className="text-amber-300 text-xs">
              <strong>Note:</strong> En passant squares are highlighted in <span className="text-purple-400">purple</span> when available. The opportunity disappears after one move!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'checkmate',
      title: 'Check & Checkmate',
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
            <p className="text-red-300 font-medium mb-2">Check</p>
            <p className="text-gray-300">
              When your king is under attack, you're in <strong className="text-red-400">check</strong>. The king's square will pulse red, and you must make a move that gets your king out of check. You cannot make any move that leaves your king in check.
            </p>
          </div>
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
            <p className="text-amber-300 font-medium mb-2">Checkmate</p>
            <p className="text-gray-300">
              If your king is in check and you have no legal moves to escape, it's <strong className="text-amber-400">checkmate</strong>! The game ends immediately and your opponent wins. A winner announcement will appear.
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 font-medium mb-2">Ways to escape check:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">1.</span>
                Move your king to a safe square
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">2.</span>
                Block the attack with another piece
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">3.</span>
                Capture the attacking piece
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'draws',
      title: 'Draw Conditions',
      icon: <Scale className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            A game can end in a draw (tie) under several conditions. The game automatically detects these situations.
          </p>
          <div className="space-y-2">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-amber-300 font-medium mb-1">Stalemate</p>
              <p className="text-gray-400 text-xs">
                The player to move has no legal moves but is NOT in check. This is different from checkmate!
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-amber-300 font-medium mb-1">Threefold Repetition</p>
              <p className="text-gray-400 text-xs">
                The same position occurs three times with the same player to move and same possible moves. Often happens when both players repeat moves.
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-amber-300 font-medium mb-1">50-Move Rule</p>
              <p className="text-gray-400 text-xs">
                50 consecutive moves have been made by both players without any pawn move or capture. The game becomes a draw.
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-amber-300 font-medium mb-1">Insufficient Material</p>
              <p className="text-gray-400 text-xs">
                Neither player has enough pieces to deliver checkmate. Examples: King vs King, King+Bishop vs King, King+Knight vs King.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'accounts',
      title: 'Player Accounts',
      icon: <User className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            Create an account to track your game statistics and enjoy enhanced online play features!
          </p>
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
            <p className="text-amber-300 font-medium mb-2">Account Benefits</p>
            <ul className="space-y-1 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Track your wins, losses, and draws</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>View your win rate percentage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Display your username to opponents in online games</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Earn badges for achievements (10+ wins = Champion badge)</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 font-medium mb-2">How to Sign Up</p>
            <ul className="space-y-1 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">1.</span>
                <span>Click "Sign Up" in the header</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">2.</span>
                <span>Enter your username, email, and password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">3.</span>
                <span>Start playing and your stats will be tracked automatically!</span>
              </li>
            </ul>
          </div>
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
            <p className="text-green-300 text-xs">
              <strong>Note:</strong> You can still play as a guest without an account, but your statistics won't be saved.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'online',
      title: 'Online Multiplayer',
      icon: <Globe className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            Challenge friends to online matches! Play in real-time from anywhere in the world.
          </p>
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
            <p className="text-green-300 font-medium mb-2">How to Play Online</p>
            <ul className="space-y-1 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400">1.</span>
                <span>Click "Play Online" to open the multiplayer lobby</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">2.</span>
                <span><strong>Create Game:</strong> Get a 6-character room code to share</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">3.</span>
                <span><strong>Join Game:</strong> Enter your friend's room code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">4.</span>
                <span>The game starts when both players are connected!</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">
              <strong className="text-green-400">Note:</strong> The game creator plays as White, the joiner plays as Black. Moves are synchronized in real-time. Sign in to display your username to your opponent!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'strategy',
      title: 'Strategy Tips',
      icon: <Lightbulb className="w-5 h-5" />,
      content: (
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Control the center</strong> - Even more critical on the larger board with more squares to dominate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Coordinate your queens</strong> - Two queens working together can create devastating attacks and quick checkmates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Castle early</strong> - Protect your king by castling before the middle game heats up</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Watch for en passant</strong> - Don't let opponent's pawns slip past your defenses</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Push pawns to promote</strong> - Getting a third queen can be game-winning!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Develop pieces quickly</strong> - The larger board rewards active piece play</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-1">✦</span>
            <span><strong className="text-amber-300">Watch for double checks</strong> - With two queens, you can create powerful double attacks</span>
          </li>
        </ul>
      )
    },
    {
      id: 'ai',
      title: 'AI Opponent',
      icon: <Cpu className="w-5 h-5" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            Challenge yourself against our AI opponent! The AI uses a minimax algorithm with alpha-beta pruning to calculate the best moves.
          </p>
          <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
            <p className="text-amber-300 font-medium">AI Features:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                Evaluates piece values and board position
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                Looks 2 moves ahead for strategic planning
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                Prioritizes center control and piece activity
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                Detects check and checkmate situations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                Understands castling, en passant, and promotion
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">→</span>
                Adds slight randomness for varied gameplay
              </li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 md:p-6 border border-gray-700">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-400 mb-3 sm:mb-4">How to Play</h2>
      
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 bg-gray-700/50 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-amber-400">{section.icon}</span>
                <span className="text-base sm:text-lg font-semibold text-amber-300">{section.title}</span>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === section.id && (
              <div className="p-2.5 sm:p-3 md:p-4 bg-gray-800/50">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RulesSection;
