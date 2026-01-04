import React from 'react';
import { GameMode } from '@/types/chess';
import { Users, Bot, Globe } from 'lucide-react';

interface Props {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  disabled?: boolean;
}

const GameModeSelector: React.FC<Props> = ({ mode, onModeChange, disabled }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-700">
      <h3 className="text-amber-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Game Mode</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onModeChange('pvp')}
          disabled={disabled}
          className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all ${
            mode === 'pvp'
              ? 'bg-amber-600 text-white ring-2 ring-amber-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm font-medium">vs Player</span>
        </button>
        <button
          onClick={() => onModeChange('ai')}
          disabled={disabled}
          className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all ${
            mode === 'ai'
              ? 'bg-amber-600 text-white ring-2 ring-amber-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm font-medium">vs AI</span>
        </button>
      </div>
      {mode === 'online' && (
        <div className="mt-2 flex items-center justify-center gap-2 text-green-400 text-xs">
          <Globe className="w-4 h-4" />
          <span>Playing Online</span>
        </div>
      )}
      {disabled && mode !== 'online' && (
        <p className="text-[10px] sm:text-xs text-gray-500 mt-2 text-center">
          Start a new game to change mode
        </p>
      )}
    </div>
  );
};

export default GameModeSelector;
