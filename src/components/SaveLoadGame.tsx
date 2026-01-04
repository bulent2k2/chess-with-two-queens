import React, { useState, useEffect } from 'react';
import { GameState, SavedGame } from '@/types/chess';
import { Save, FolderOpen, Trash2, Download, Upload, Database } from 'lucide-react';

interface Props {
  currentState: GameState;
  onLoadGame: (state: GameState) => void;
  onNewGame: () => void;
}

const STORAGE_KEY = 'chess9x9_saved_games';

const SaveLoadGame: React.FC<Props> = ({ currentState, onLoadGame, onNewGame }) => {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [gameName, setGameName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved games from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedGames(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load saved games:', e);
      }
    }
  }, []);

  // Save games to localStorage
  const persistGames = (games: SavedGame[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    setSavedGames(games);
  };

  const handleSave = () => {
    if (!gameName.trim()) {
      setSaveMessage('Please enter a name for your game');
      return;
    }

    const newSave: SavedGame = {
      id: Date.now().toString(),
      name: gameName.trim(),
      savedAt: new Date().toISOString(),
      state: { ...currentState, savedAt: new Date().toISOString(), gameName: gameName.trim() }
    };

    const updatedGames = [newSave, ...savedGames].slice(0, 10); // Keep max 10 saves
    persistGames(updatedGames);
    
    setSaveMessage('Game saved successfully!');
    setGameName('');
    setTimeout(() => {
      setShowSaveModal(false);
      setSaveMessage('');
    }, 1500);
  };

  const handleLoad = (game: SavedGame) => {
    onLoadGame(game.state);
    setShowLoadModal(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedGames = savedGames.filter(g => g.id !== id);
    persistGames(updatedGames);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(currentState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess9x9_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const state = JSON.parse(event.target?.result as string) as GameState;
        onLoadGame(state);
        setShowLoadModal(false);
      } catch (err) {
        alert('Invalid game file');
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 border border-gray-700">
      <h3 className="text-amber-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-1.5">
        <Database className="w-4 h-4 sm:w-5 sm:h-5" />
        Game Management
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-xs sm:text-sm"
        >
          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Save
        </button>
        <button
          onClick={() => setShowLoadModal(true)}
          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-xs sm:text-sm"
        >
          <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Load
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full border border-gray-600">
            <h2 className="text-lg sm:text-xl font-bold text-amber-400 mb-3 sm:mb-4">Save Game</h2>
            
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name..."
              className="w-full bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
              autoFocus
            />
            
            {saveMessage && (
              <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                {saveMessage}
              </p>
            )}
            
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Save Game
              </button>
              <button
                onClick={() => { setShowSaveModal(false); setSaveMessage(''); }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-lg w-full border border-gray-600 max-h-[85vh] overflow-hidden flex flex-col">
            <h2 className="text-lg sm:text-xl font-bold text-amber-400 mb-3 sm:mb-4">Load Game</h2>
            
            {/* Import/Export buttons */}
            <div className="flex gap-2 mb-3 sm:mb-4">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-xs sm:text-sm"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Export
              </button>
              <label className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-xs sm:text-sm cursor-pointer">
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Saved games list */}
            <div className="flex-1 overflow-y-auto">
              {savedGames.length === 0 ? (
                <p className="text-gray-400 text-center py-6 sm:py-8 text-sm">No saved games yet</p>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {savedGames.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleLoad(game)}
                      className="bg-gray-700 hover:bg-gray-600 rounded-lg p-2 sm:p-3 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-white font-medium text-sm sm:text-base">{game.name}</p>
                        <p className="text-gray-400 text-[10px] sm:text-xs">
                          {formatDate(game.savedAt)} • Move {game.state.moves.length} • {game.state.boardSize || '9x8'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(game.id, e)}
                        className="text-gray-500 hover:text-red-400 p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
              <button
                onClick={onNewGame}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                New Game
              </button>
              <button
                onClick={() => setShowLoadModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveLoadGame;
