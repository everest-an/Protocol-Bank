import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function DropdownMenu({ label, items, activeItem, onItemClick, isActive }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
          isActive
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onItemClick(item.id)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                activeItem === item.id
                  ? 'bg-blue-50 dark:bg-blue-600 text-blue-600 dark:text-white font-medium'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                  {item.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

