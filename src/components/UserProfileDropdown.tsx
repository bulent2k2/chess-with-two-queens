import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Trophy, Target, Minus, ChevronDown, Settings, Crown } from 'lucide-react';
import { useAuth, UserProfile } from '@/contexts/AuthContext';

interface Props {
  onOpenSettings?: () => void;
}

const UserProfileDropdown: React.FC<Props> = ({ onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const winRate = user.games_played > 0 
    ? Math.round((user.games_won / user.games_played) * 100) 
    : 0;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="text-white font-medium hidden sm:block">{user.username}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-amber-600/20 to-amber-700/20 p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  {user.username}
                  {user.games_won >= 10 && (
                    <Crown className="w-4 h-4 text-amber-400" title="Champion" />
                  )}
                </p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-gray-700">
            <p className="text-gray-400 text-xs uppercase font-semibold mb-3">Game Statistics</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <p className="text-lg font-bold text-white">{user.games_played}</p>
                <p className="text-xs text-gray-400">Played</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-green-400" />
                  <p className="text-lg font-bold text-green-400">{user.games_won}</p>
                </div>
                <p className="text-xs text-gray-400">Won</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1">
                  <Target className="w-3 h-3 text-red-400" />
                  <p className="text-lg font-bold text-red-400">{user.games_lost}</p>
                </div>
                <p className="text-xs text-gray-400">Lost</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <div className="flex items-center justify-center gap-1">
                  <Minus className="w-3 h-3 text-gray-400" />
                  <p className="text-lg font-bold text-gray-300">{user.games_drawn}</p>
                </div>
                <p className="text-xs text-gray-400">Draw</p>
              </div>
            </div>
            
            {/* Win Rate */}
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Win Rate</span>
                <span className="text-amber-400 font-medium">{winRate}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            {onOpenSettings && (
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Account Settings</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
