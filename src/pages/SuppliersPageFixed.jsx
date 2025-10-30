import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Users, DollarSign, TrendingUp, Plus, ExternalLink, X } from 'lucide-react'
import { useWeb3 } from '@/contexts/Web3Context'

export default function SuppliersPage() {
  const { account, contract } = useWeb3()
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
    loadSuppliers()
  }, [contract])

  const loadSuppliers = async () => {
    // TODO: Load from contract when connected
    setSuppliers(mockSuppliers)
  }

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

  const handleRegisterSupplier = () => {
    if (!account) {
      alert('Please connect your wallet first')
      return
    }
    setIsRegisterModalOpen(true)
  }

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Supplier Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage payment suppliers</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleRegisterSupplier}
        >
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
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {supplier.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium dark:text-white">{supplier.name}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        {supplier.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono">{supplier.address.slice(0, 10)}...{supplier.address.slice(-8)}</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${supplier.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="font-semibold dark:text-white">${supplier.totalReceived}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payments</p>
                    <p className="font-semibold dark:text-white">{supplier.paymentCount}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(supplier)}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Register Supplier Modal */}
      {isRegisterModalOpen && (
        <RegisterSupplierModal
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false)
            loadSuppliers()
          }}
        />
      )}

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <SupplierDetailsModal
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </div>
  )
}

// Register Supplier Modal Component
function RegisterSupplierModal({ onClose, onSuccess }) {
  const { account, contract } = useWeb3()
  const [formData, setFormData] = useState({
    address: '',
    name: '',
    category: 'Technology'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ['Technology', 'Logistics', 'Services', 'Marketing', 'Consulting']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!contract) {
        alert('Please connect your wallet first')
        return
      }

      // TODO: Call smart contract to register supplier
      // const tx = await contract.registerSupplier(formData.address, formData.name, formData.category)
      // await tx.wait()

      // For now, just show success message
      alert(`Supplier registered successfully!\nName: ${formData.name}\nAddress: ${formData.address}\nCategory: ${formData.category}`)
      onSuccess()
    } catch (error) {
      console.error('Error registering supplier:', error)
      alert('Failed to register supplier: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Register New Supplier</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Supplier Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Wallet Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Supplier Details Modal Component
function SupplierDetailsModal({ supplier, onClose }) {
  // Mock payment history
  const paymentHistory = [
    { date: '2025-10-28', amount: '5,000', txHash: '0x1234...5678', status: 'Completed' },
    { date: '2025-10-25', amount: '3,500', txHash: '0xabcd...ef01', status: 'Completed' },
    { date: '2025-10-20', amount: '7,200', txHash: '0x9876...5432', status: 'Completed' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Supplier Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Supplier Info */}
          <div className="border-b dark:border-gray-700 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-2xl">
                {supplier.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">{supplier.name}</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  {supplier.category}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Wallet Address</p>
                <p className="font-mono dark:text-white">{supplier.address}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Payment</p>
                <p className="dark:text-white">{supplier.lastPayment}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Received</p>
                <p className="text-2xl font-semibold dark:text-white">${supplier.totalReceived}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
                <p className="text-2xl font-semibold dark:text-white">{supplier.paymentCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Payment History</h3>
            <div className="space-y-2">
              {paymentHistory.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg dark:border-gray-700">
                  <div>
                    <p className="font-medium dark:text-white">${payment.amount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{payment.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                      {payment.status}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{payment.txHash}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(`https://sepolia.etherscan.io/address/${supplier.address}`, '_blank')}
            >
              View on Etherscan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
