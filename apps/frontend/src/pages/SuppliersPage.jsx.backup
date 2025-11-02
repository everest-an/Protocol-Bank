import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Users, DollarSign, TrendingUp, Plus, ExternalLink } from 'lucide-react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock supplier data
  const mockSuppliers = [
    {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      name: 'Acme Corp',
      category: 'Technology',
      totalReceived: '125,000',
      paymentCount: 45,
      lastPayment: '2 days ago'
    },
    {
      address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      name: 'Global Logistics',
      category: 'Logistics',
      totalReceived: '89,500',
      paymentCount: 32,
      lastPayment: '5 days ago'
    },
    {
      address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
      name: 'Creative Studio',
      category: 'Services',
      totalReceived: '67,200',
      paymentCount: 28,
      lastPayment: '1 week ago'
    }
  ]

  useEffect(() => {
    setSuppliers(mockSuppliers)
  }, [])

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(suppliers.map(s => s.category))]

  const stats = {
    totalSuppliers: suppliers.length,
    totalPaid: suppliers.reduce((sum, s) => sum + parseFloat(s.totalReceived.replace(/,/g, '')), 0),
    totalPayments: suppliers.reduce((sum, s) => sum + s.paymentCount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Supplier Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage payment suppliers</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Register Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Suppliers</p>
                <p className="text-2xl font-semibold mt-1">{stats.totalSuppliers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-semibold mt-1">${stats.totalPaid.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-semibold mt-1">{stats.totalPayments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSuppliers.map((supplier, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {supplier.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{supplier.name}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {supplier.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span className="font-mono">{supplier.address.slice(0, 10)}...{supplier.address.slice(-8)}</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${supplier.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-semibold">${supplier.totalReceived}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Payments</p>
                    <p className="font-semibold">{supplier.paymentCount}</p>
                  </div>
                  <Button variant="outline" size="sm">Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
