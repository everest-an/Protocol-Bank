import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, Wallet } from 'lucide-react';
import authUtils from '../utils/auth';

export default function UserMenu({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    // Load user data from localStorage
    const userData = authUtils.getCurrentUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = () => {
    authUtils.logout();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.username}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.username}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {user.email}
            </div>
            {user.balance !== undefined && (
              <div className="flex items-center space-x-1 mt-2 text-sm text-gray-700 dark:text-gray-300">
                <Wallet className="w-4 h-4" />
                <span>{user.balance} {user.currency || 'ETH'}</span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to profile page
              }}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to settings page
              }}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
