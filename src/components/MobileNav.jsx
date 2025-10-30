import React from 'react';
import { X, Home, Send, BarChart3, Users, Settings, Wallet, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileNav = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab,
  isConnected,
  account,
  balance,
  connectWallet,
  disconnectWallet,
  isConnecting,
  theme,
  toggleTheme,
  language,
  setLanguage
}) => {
  const menuItems = [
    { id: 'payments', label: 'Payments', icon: Send },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
  ];

  const handleMenuClick = (tabId) => {
    setActiveTab(tabId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* 侧边栏 */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 md:hidden overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <img 
              src="/new-protocol-bank-logo.png" 
              alt="Protocol Bank" 
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Protocol Bank
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* 钱包信息 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          {isConnected ? (
            <div className="space-y-3">
              {/* 余额 */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Balance
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {parseFloat(balance).toFixed(4)} ETH
                </div>
              </div>

              {/* 地址 */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Connected Account
                </div>
                <div className="text-sm font-mono text-gray-900 dark:text-white">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              </div>

              {/* 断开连接按钮 */}
              <Button
                onClick={() => {
                  disconnectWallet();
                  onClose();
                }}
                variant="outline"
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                connectWallet();
                onClose();
              }}
              disabled={isConnecting}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>

        {/* 导航菜单 */}
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
            NAVIGATION
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 设置 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
            SETTINGS
          </div>

          {/* 主题切换 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* 语言选择 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Language
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm bg-transparent border-0 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            Protocol Bank v1.0.0
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
