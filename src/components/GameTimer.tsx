import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';

interface Props {
  currentPlayer: 'white' | 'black';
  onTimeOut: (player: 'white' | 'black') => void;
  gameOver?: boolean;
  gameStarted?: boolean;
}

const GameTimer: React.FC<Props> = ({ currentPlayer, onTimeOut, gameOver = false, gameStarted = false }) => {
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isPaused, setIsPaused] = useState(true);

  // Start timer when game starts
  useEffect(() => {
    if (gameStarted && !gameOver) {
      setIsPaused(false);
    }
  }, [gameStarted, gameOver]);

  // Stop timer when game is over
  useEffect(() => {
    if (gameOver) {
      setIsPaused(true);
    }
  }, [gameOver]);

  useEffect(() => {
    if (isPaused || gameOver || !gameStarted) return;
    
    const timer = setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTime(t => {
          if (t <= 1) { 
            onTimeOut('white'); 
            return 0; 
          }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t <= 1) { 
            onTimeOut('black'); 
            return 0; 
          }
          return t - 1;
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentPlayer, onTimeOut, isPaused, gameOver, gameStarted]);

  const format = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimers = () => {
    setWhiteTime(600);
    setBlackTime(600);
    setIsPaused(true);
  };

  const getTimeColor = (time: number) => {
    if (time <= 30) return 'text-red-400';
    if (time <= 60) return 'text-orange-400';
    return 'text-white';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <h3 className="text-amber-400 font-semibold text-sm sm:text-base">Game Clock</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsPaused(!isPaused)}
            disabled={gameOver || !gameStarted}
            className="p-1 sm:p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button
            onClick={resetTimers}
            className="p-1 sm:p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Reset timers"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-1.5 sm:space-y-2">
        {/* Black Timer */}
        <div className={`p-2 sm:p-3 rounded-lg transition-all ${
          currentPlayer === 'black' && !isPaused && gameStarted
            ? 'bg-amber-900/50 ring-2 ring-amber-500' 
            : 'bg-gray-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-900 border border-gray-600" />
              <span className="text-gray-300 text-xs sm:text-sm font-medium">Black</span>
            </div>
            <div className={`text-lg sm:text-2xl font-mono font-bold ${getTimeColor(blackTime)}`}>
              {format(blackTime)}
            </div>
          </div>
        </div>
        
        {/* White Timer */}
        <div className={`p-2 sm:p-3 rounded-lg transition-all ${
          currentPlayer === 'white' && !isPaused && gameStarted
            ? 'bg-amber-900/50 ring-2 ring-amber-500' 
            : 'bg-gray-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white" />
              <span className="text-gray-300 text-xs sm:text-sm font-medium">White</span>
            </div>
            <div className={`text-lg sm:text-2xl font-mono font-bold ${getTimeColor(whiteTime)}`}>
              {format(whiteTime)}
            </div>
          </div>
        </div>
      </div>
      
      {isPaused && gameStarted && !gameOver && (
        <div className="mt-1.5 sm:mt-2 text-center text-yellow-400 text-[10px] sm:text-xs">
          Timer paused
        </div>
      )}
      {!gameStarted && (
        <div className="mt-1.5 sm:mt-2 text-center text-gray-400 text-[10px] sm:text-xs">
          Timer starts on first move
        </div>
      )}
    </div>
  );
};

export default GameTimer;
