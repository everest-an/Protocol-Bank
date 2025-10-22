import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Plus, ArrowLeft } from 'lucide-react'
import StreamPaymentCard from '@/components/stream-payment/StreamPaymentCard.jsx'
import FlowEditor from '@/components/stream-payment/FlowEditor.jsx'

export default function StreamPaymentPage() {
  const [view, setView] = useState('list') // 'list' or 'editor'
  const [streams, setStreams] = useState([
    {
      id: '1',
      name: 'Employee Salary Stream',
      status: 'active',
      createdAt: Date.now() - 86400000 * 7,
      totalPaid: 25000,
      currency: 'USD',
      frequency: 'Monthly',
      recipientName: 'John Doe',
      nodes: [],
      edges: [],
    },
    {
      id: '2',
      name: 'Supplier Regular Payment',
      status: 'paused',
      createdAt: Date.now() - 86400000 * 3,
      totalPaid: 8500,
      currency: 'EUR',
      frequency: 'Weekly',
      recipientName: 'ABC Supplier',
      nodes: [],
      edges: [],
    },
  ])
  const [editingStream, setEditingStream] = useState(null)

  const handleCreateNew = () => {
    setEditingStream({
      id: `stream_${Date.now()}`,
      name: 'New Stream Payment',
      status: 'paused',
      createdAt: Date.now(),
      totalPaid: 0,
      currency: 'USD',
      frequency: 'Per Minute',
      recipientName: '',
      nodes: [],
      edges: [],
    })
    setView('editor')
  }

  const handleEdit = (stream) => {
    setEditingStream(stream)
    setView('editor')
  }

  const handleToggle = (stream) => {
    setStreams(streams.map(s => 
      s.id === stream.id 
        ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
        : s
    ))
  }

  const handleDelete = (stream) => {
    if (confirm(`Are you sure you want to delete stream payment "${stream.name}"?`)) {
      setStreams(streams.filter(s => s.id !== stream.id))
    }
  }

  const handleSaveFlow = (flowData) => {
    if (editingStream) {
      const updatedStream = {
        ...editingStream,
        nodes: flowData.nodes,
        edges: flowData.edges,
      }

      // Extract info from nodes
      const paymentNode = flowData.nodes.find(n => n.type === 'payment')
      const recipientNode = flowData.nodes.find(n => n.type === 'recipient')

      if (paymentNode) {
        updatedStream.currency = paymentNode.data.currency || 'USD'
        const freqMap = {
          per_second: 'Per Second',
          per_minute: 'Per Minute',
          per_hour: 'Per Hour',
          per_day: 'Per Day',
        }
        updatedStream.frequency = freqMap[paymentNode.data.frequency] || 'Per Minute'
      }

      if (recipientNode) {
        updatedStream.recipientName = recipientNode.data.name || 'Not Set'
      }

      // Check if it's a new stream or update
      const existingIndex = streams.findIndex(s => s.id === editingStream.id)
      if (existingIndex >= 0) {
        setStreams(streams.map(s => s.id === editingStream.id ? updatedStream : s))
      } else {
        setStreams([...streams, updatedStream])
      }

      alert('Stream payment saved successfully!')
      setView('list')
      setEditingStream(null)
    }
  }

  const handleBackToList = () => {
    if (confirm('Are you sure you want to return to the list? Unsaved changes will be lost.')) {
      setView('list')
      setEditingStream(null)
    }
  }

  if (view === 'editor') {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">
                {editingStream?.name || '新流支付'}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300">Configure stream payment rules and parameters</p>
            </div>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <FlowEditor
            initialNodes={editingStream?.nodes || []}
            initialEdges={editingStream?.edges || []}
            onSave={handleSaveFlow}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal text-gray-900 dark:text-white mb-2">Stream Payment Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">Create and manage automated continuous payment streams</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-gray-900 hover:bg-gray-800 text-white w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Stream Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-300 mb-1">Active Streams</div>
          <div className="text-2xl font-light text-gray-900">
            {streams.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Paid</div>
          <div className="text-2xl font-light text-gray-900">
            ${streams.reduce((sum, s) => sum + (s.totalPaid || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Streams</div>
          <div className="text-2xl font-light text-gray-900">{streams.length}</div>
        </div>
      </div>

      {/* Stream List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">My Stream Payments</h3>
        {streams.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <p className="text-gray-500 dark:text-gray-300 mb-4">No stream payments created yet</p>
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Stream Payment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {streams.map(stream => (
              <StreamPaymentCard
                key={stream.id}
                stream={stream}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

