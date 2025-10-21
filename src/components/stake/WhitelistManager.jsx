import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Plus, Check, Clock, Search, Filter } from 'lucide-react'

export default function WhitelistManager({ 
  poolId,
  whitelist = [], 
  userRole, 
  onAddWhitelist, 
  onApproveWhitelist,
  loading 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, pending, approved

  const filteredWhitelist = whitelist.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'approved' && entry.approved) ||
                         (filterStatus === 'pending' && !entry.approved)
    return matchesSearch && matchesFilter
  })

  const pendingCount = whitelist.filter(e => !e.approved).length
  const approvedCount = whitelist.filter(e => e.approved).length

  return (
    <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Whitelist Management
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {approvedCount} approved, {pendingCount} pending
            </p>
          </div>
          {userRole === 'company' && (
            <Button 
              onClick={onAddWhitelist}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Whitelist
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        {/* Whitelist Table */}
        <div className="overflow-x-auto">
          {filteredWhitelist.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {whitelist.length === 0 
                  ? 'No whitelist entries yet'
                  : 'No entries match your search'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Address
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                  {userRole === 'staker' && (
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredWhitelist.map((entry, index) => (
                  <tr 
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.name}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {entry.recipient.slice(0, 6)}...{entry.recipient.slice(-4)}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {entry.category}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {entry.approved ? (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-medium">Approved</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium">Pending</span>
                        </div>
                      )}
                    </td>
                    {userRole === 'staker' && (
                      <td className="py-3 px-2 text-right">
                        {!entry.approved && (
                          <Button
                            onClick={() => onApproveWhitelist(entry.recipient)}
                            size="sm"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Approve
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        {whitelist.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-light text-gray-900 dark:text-white">
                  {whitelist.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Entries
                </div>
              </div>
              <div>
                <div className="text-2xl font-light text-green-600 dark:text-green-400">
                  {approvedCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Approved
                </div>
              </div>
              <div>
                <div className="text-2xl font-light text-yellow-600 dark:text-yellow-400">
                  {pendingCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Pending
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

