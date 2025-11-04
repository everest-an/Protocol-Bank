import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Plus, ArrowLeft, Loader2 } from 'lucide-react'
import StreamPaymentCard from '@/components/stream-payment/StreamPaymentCard.jsx'
import FlowEditor from '@/components/stream-payment/FlowEditor.jsx'
import { streamPaymentService } from '../services/backendService'
import authUtils from '../utils/auth'

export default function StreamPaymentPage() {
  const [view, setView] = useState('list') // 'list' or 'editor'
  const [streams, setStreams] = useState([])
  const [editingStream, setEditingStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载流支付列表
  useEffect(() => {
    loadStreams()
  }, [])

  const loadStreams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const user = authUtils.getCurrentUser()
      if (!user) {
        setError('Please login first')
        return
      }
      
      const response = await streamPaymentService.getList(user.account_id)
      
      if (response.status === 'success') {
        // 转换后端数据格式为前端格式
        const formattedStreams = response.data.map(stream => ({
          id: stream.stream_id,
          name: stream.stream_name || 'Unnamed Stream',
          status: stream.status,
          createdAt: new Date(stream.created_at).getTime(),
          totalPaid: parseFloat(stream.amount_withdrawn || 0),
          totalAmount: parseFloat(stream.amount),
          amountStreamed: parseFloat(stream.amount_streamed || 0),
          currency: stream.currency,
          frequency: calculateFrequency(stream.rate_per_second, stream.currency),
          recipientName: stream.recipient_username || stream.recipient_email,
          senderName: stream.sender_username || stream.sender_email,
          startTime: stream.start_time,
          endTime: stream.end_time,
          description: stream.description,
          nodes: [],
          edges: [],
        }))
        
        setStreams(formattedStreams)
      }
    } catch (err) {
      console.error('Failed to load streams:', err)
      setError(err.message || 'Failed to load stream payments')
    } finally {
      setLoading(false)
    }
  }

  // 计算频率显示
  const calculateFrequency = (ratePerSecond, currency) => {
    const rate = parseFloat(ratePerSecond)
    if (rate * 60 < 1) {
      return `${(rate * 3600).toFixed(4)} ${currency}/hour`
    } else if (rate * 3600 < 1) {
      return `${(rate * 86400).toFixed(2)} ${currency}/day`
    } else {
      return `${(rate * 2592000).toFixed(2)} ${currency}/month`
    }
  }

  const handleCreateNew = () => {
    setEditingStream({
      id: null, // null表示新建
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

  const handleToggle = async (stream) => {
    try {
      if (stream.status === 'active') {
        await streamPaymentService.pause(stream.id)
      } else if (stream.status === 'paused') {
        await streamPaymentService.resume(stream.id)
      }
      
      // 刷新列表
      await loadStreams()
    } catch (err) {
      alert('Failed to toggle stream: ' + err.message)
    }
  }

  const handleDelete = async (stream) => {
    if (confirm(`Are you sure you want to cancel stream payment "${stream.name}"?`)) {
      try {
        await streamPaymentService.cancel(stream.id)
        
        // 刷新列表
        await loadStreams()
        
        alert('Stream payment cancelled successfully')
      } catch (err) {
        alert('Failed to cancel stream: ' + err.message)
      }
    }
  }

  const handleSaveFlow = async (flowData) => {
    if (editingStream) {
      try {
        // 从flowData中提取信息
        const paymentNode = flowData.nodes.find(n => n.type === 'payment')
        const recipientNode = flowData.nodes.find(n => n.type === 'recipient')
        
        if (!paymentNode || !recipientNode) {
          alert('Please configure both payment and recipient nodes')
          return
        }

        const user = authUtils.getCurrentUser()
        
        // 创建流支付
        const streamData = {
          to_account_id: recipientNode.data.accountId, // 需要从recipientNode获取
          amount: parseFloat(paymentNode.data.amount || 0),
          currency: paymentNode.data.currency || 'USD',
          duration: calculateDuration(paymentNode.data.frequency),
          stream_name: editingStream.name,
          description: paymentNode.data.description || '',
        }

        const response = await streamPaymentService.create(streamData)
        
        if (response.status === 'success') {
          alert('Stream payment created successfully!')
          setView('list')
          setEditingStream(null)
          
          // 刷新列表
          await loadStreams()
        }
      } catch (err) {
        alert('Failed to save stream: ' + err.message)
      }
    }
  }

  // 计算持续时间(秒)
  const calculateDuration = (frequency) => {
    const freqMap = {
      'per_second': 3600, // 默认1小时
      'per_minute': 86400, // 默认1天
      'per_hour': 2592000, // 默认30天
      'per_day': 2592000, // 默认30天
    }
    return freqMap[frequency] || 86400
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Stream Payments</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-300 mt-1">
            Automated continuous payment streams
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>Create Stream</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading stream payments...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button onClick={loadStreams} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No stream payments yet</p>
          <Button onClick={handleCreateNew}>Create your first stream</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {streams.map((stream) => (
            <StreamPaymentCard
              key={stream.id}
              stream={stream}
              onEdit={() => handleEdit(stream)}
              onToggle={() => handleToggle(stream)}
              onDelete={() => handleDelete(stream)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
