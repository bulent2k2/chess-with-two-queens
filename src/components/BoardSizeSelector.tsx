import React from 'react';
import { BoardSize } from '@/types/chess';
import { Grid3X3, LayoutGrid } from 'lucide-react';

interface Props {
  size: BoardSize;
  onSizeChange: (size: BoardSize) => void;
  disabled?: boolean;
}

const BoardSizeSelector: React.FC<Props> = ({ size, onSizeChange, disabled }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
      <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
        <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
        Board Size
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSizeChange('9x8')}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg transition-all ${
            size === '9x8'
              ? 'bg-amber-600 text-white ring-2 ring-amber-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="grid grid-cols-9 gap-px mb-1.5">
            {Array.from({ length: 72 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-sm ${
                  (Math.floor(i / 9) + i % 9) % 2 === 0 ? 'bg-stone-300' : 'bg-amber-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-medium">9×8</span>
          <span className="text-[10px] sm:text-xs text-gray-400">Standard</span>
        </button>
        
        <button
          onClick={() => onSizeChange('9x9')}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg transition-all ${
            size === '9x9'
              ? 'bg-amber-600 text-white ring-2 ring-amber-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="grid grid-cols-9 gap-px mb-1.5">
            {Array.from({ length: 81 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-sm ${
                  (Math.floor(i / 9) + i % 9) % 2 === 0 ? 'bg-stone-300' : 'bg-amber-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-medium">9×9</span>
          <span className="text-[10px] sm:text-xs text-gray-400">Extended</span>
        </button>
      </div>
      
      {disabled && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Start a new game to change board size
        </p>
      )}
    </div>
  );
};

export default BoardSizeSelector;
