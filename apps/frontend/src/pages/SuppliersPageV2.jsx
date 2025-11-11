import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  DollarSign,
  Activity,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { isAddress } from 'ethers';

/**
 * Enhanced Suppliers Page V2
 * 
 * Features:
 * - Complete CRUD operations
 * - Search and filter
 * - Payment history per supplier
 * - CSV import/export
 * - Category management
 * - Stats dashboard
 */
export default function SuppliersPageV2({ provider, account }) {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    category: 'Other',
    note: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Categories
  const categories = [
    'AI Services',
    'Marketing',
    'Logistics',
    'Raw Materials',
    'Software',
    'Consulting',
    'Security Services',
    'Other'
  ];

  // Load suppliers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('protocolbank_suppliers');
    if (saved) {
      try {
        setSuppliers(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      }
    }
  }, []);

  // Save suppliers to localStorage
  useEffect(() => {
    localStorage.setItem('protocolbank_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Get payment history for a supplier
  const getSupplierPayments = (supplierAddress) => {
    const streamPayments = JSON.parse(localStorage.getItem('protocolbank_stream_payments') || '[]');
    const scheduledPayments = JSON.parse(localStorage.getItem('protocolbank_scheduled_payments') || '[]');

    const payments = [
      ...streamPayments
        .filter(p => p.recipientAddress === supplierAddress)
        .map(p => ({
          id: p.id,
          type: 'stream',
          amount: parseFloat(p.amount || 0),
          token: p.token || 'ETH',
          timestamp: p.createdAt,
          status: p.status
        })),
      ...scheduledPayments
        .filter(sp => sp.recipientAddress === supplierAddress)
        .flatMap(sp =>
          (sp.history || []).map(h => ({
            id: h.id,
            type: 'scheduled',
            amount: parseFloat(h.amount || 0),
            token: h.token || 'ETH',
            timestamp: h.timestamp,
            status: h.status
          }))
        )
    ];

    return payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Calculate supplier stats
  const getSupplierStats = (supplierAddress) => {
    const payments = getSupplierPayments(supplierAddress);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const successfulPayments = payments.filter(p => p.status === 'success' || p.status === 'active').length;
    const lastPayment = payments.length > 0 ? payments[0].timestamp : null;

    return {
      totalPaid,
      paymentCount: payments.length,
      successfulPayments,
      lastPayment
    };
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.address) {
      errors.address = 'Address is required';
    } else if (!isAddress(formData.address)) {
      errors.address = 'Invalid Ethereum address';
    } else if (modalMode === 'create' && suppliers.some(s => s.address === formData.address)) {
      errors.address = 'Supplier with this address already exists';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create supplier
  const handleCreate = () => {
    if (!validateForm()) return;

    const newSupplier = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    setSuppliers([newSupplier, ...suppliers]);
    setShowModal(false);
    resetForm();
  };

  // Update supplier
  const handleUpdate = () => {
    if (!validateForm()) return;

    setSuppliers(
      suppliers.map(s =>
        s.id === selectedSupplier.id
          ? { ...s, ...formData, updatedAt: new Date().toISOString() }
          : s
      )
    );

    setShowModal(false);
    resetForm();
  };

  // Delete supplier
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      email: '',
      phone: '',
      category: 'Other',
      note: ''
    });
    setFormErrors({});
    setSelectedSupplier(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      address: supplier.address,
      email: supplier.email || '',
      phone: supplier.phone || '',
      category: supplier.category,
      note: supplier.note || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // Open view modal
  const openViewModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('view');
    setShowModal(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Address', 'Email', 'Phone', 'Category', 'Total Paid', 'Payment Count', 'Last Payment'];
    const rows = suppliers.map(supplier => {
      const stats = getSupplierStats(supplier.address);
      return [
        supplier.name,
        supplier.address,
        supplier.email || '',
        supplier.phone || '',
        supplier.category,
        stats.totalPaid.toFixed(4),
        stats.paymentCount,
        stats.lastPayment ? new Date(stats.lastPayment).toLocaleString() : 'Never'
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        const imported = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            return {
              id: Date.now().toString() + Math.random(),
              name: values[0],
              address: values[1],
              email: values[2] || '',
              phone: values[3] || '',
              category: values[4] || 'Other',
              note: '',
              createdAt: new Date().toISOString()
            };
          })
          .filter(supplier => isAddress(supplier.address));

        setSuppliers([...imported, ...suppliers]);
        alert(`Imported ${imported.length} suppliers successfully!`);
      } catch (error) {
        alert('Failed to import CSV: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = [
      ['Name', 'Address', 'Email', 'Phone', 'Category'],
      ['Example Corp', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'contact@example.com', '+1234567890', 'Software'],
      ['Another Supplier', '0x8ba1f109551bD432803012645Ac136ddd64DBA72', 'info@supplier.com', '+0987654321', 'Logistics']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate total stats
  const totalStats = {
    totalSuppliers: suppliers.length,
    totalPaid: suppliers.reduce((sum, s) => {
      const stats = getSupplierStats(s.address);
      return sum + stats.totalPaid;
    }, 0),
    totalPayments: suppliers.reduce((sum, s) => {
      const stats = getSupplierStats(s.address);
      return sum + stats.paymentCount;
    }, 0)
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Supplier Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your suppliers and track payment history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="border-gray-300 dark:border-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <label>
            <Button
              as="span"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={importFromCSV}
              className="hidden"
            />
          </label>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-gray-300 dark:border-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Suppliers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalSuppliers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalStats.totalPaid)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalPayments}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, address, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <Card className="border border-gray-200 dark:border-gray-700">
        {filteredSuppliers.length === 0 ? (
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers match your filters'}
            </p>
            {suppliers.length === 0 && (
              <Button
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Supplier
              </Button>
            )}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSuppliers.map((supplier) => {
                  const stats = getSupplierStats(supplier.address);
                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {supplier.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {supplier.address.slice(0, 6)}...{supplier.address.slice(-4)}
                          </p>
                          {supplier.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {supplier.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {supplier.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(stats.totalPaid)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                        {stats.paymentCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(stats.lastPayment)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => openViewModal(supplier)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 dark:border-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => openEditModal(supplier)}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(supplier.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'create' && 'Add New Supplier'}
                {modalMode === 'edit' && 'Edit Supplier'}
                {modalMode === 'view' && 'Supplier Details'}
              </h2>
            </div>

            {modalMode === 'view' ? (
              /* View Mode */
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedSupplier.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedSupplier.category}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                        {selectedSupplier.address}
                      </p>
                    </div>
                    {selectedSupplier.email && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                        <p className="text-gray-900 dark:text-white">{selectedSupplier.email}</p>
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                        <p className="text-gray-900 dark:text-white">{selectedSupplier.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Payment History
                  </h3>
                  {(() => {
                    const payments = getSupplierPayments(selectedSupplier.address);
                    return payments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No payment history
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.amount} {payment.token}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'success' || payment.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {payment.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(payment.timestamp).toLocaleString()} • {payment.type}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* Create/Edit Mode */
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Acme Corp"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ethereum Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="0x..."
                    disabled={modalMode === 'edit'}
                    className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.address
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white ${modalMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {formErrors.address && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@example.com"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      } text-gray-900 dark:text-white`}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Add any notes about this supplier..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {modalMode !== 'view' && (
                <Button
                  onClick={modalMode === 'create' ? handleCreate : handleUpdate}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Saving...' : modalMode === 'create' ? 'Create Supplier' : 'Update Supplier'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
