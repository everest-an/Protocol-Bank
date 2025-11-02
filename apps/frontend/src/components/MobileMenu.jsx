import React, { useState } from 'react';
import { Menu, X, Waves, Lock, Send, Calendar, Users, BarChart3 } from 'lucide-react';

export default function MobileMenu({ activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      category: 'Payments',
      items: [
        { id: 'payments', label: 'Flow Payment', icon: Waves },
        { id: 'stake', label: 'Flow Payment (Stake)', icon: Lock },
        { id: 'batch', label: 'Batch Payment', icon: Send },
        { id: 'schedule', label: 'Scheduled Payment', icon: Calendar },
      ]
    },
    {
      category: 'Other',
      items: [
        { id: 'suppliers', label: 'Suppliers', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    }
  ];

  const handleItemClick = (id) => {
    onTabChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto md:hidden">
            <div className="p-4 space-y-6">
              {menuItems.map((section) => (
                <div key={section.category}>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

