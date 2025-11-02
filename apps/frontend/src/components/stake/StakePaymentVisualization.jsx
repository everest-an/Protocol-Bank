import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

export default function StakePaymentVisualization({ 
  poolData,
  whitelist = [],
  payments = []
}) {
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState(null)
  const simulationRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])
  const isDarkMode = document.documentElement.classList.contains('dark')

  // Generate network data from pool, whitelist, and payments
  const generateNetworkData = () => {
    if (!poolData) return { nodes: [], links: [] }

    const nodes = []
    const links = []

    // VC/LP Node (source)
    nodes.push({
      id: 'staker',
      label: 'VC/LP',
      address: poolData.staker,
      type: 'staker',
      size: 50,
      color: '#3B82F6', // blue
      level: 0,
      x: 400,
      y: 200
    })

    // Company Node (middle)
    nodes.push({
      id: 'company',
      label: 'Company',
      address: poolData.company,
      type: 'company',
      size: 40,
      color: '#8B5CF6', // purple
      level: 1,
      x: 400,
      y: 400
    })

    // Link from VC/LP to Company
    links.push({
      source: 'staker',
      target: 'company',
      amount: parseFloat(poolData.totalStaked),
      type: 'stake',
      width: 4
    })

    // Supplier/Employee Nodes (targets)
    whitelist.forEach((entry, index) => {
      const nodeId = `recipient-${index}`
      
      // Calculate payments to this recipient
      const recipientPayments = payments.filter(p => p.to === entry.recipient)
      const totalPaid = recipientPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      
      nodes.push({
        id: nodeId,
        label: entry.name,
        address: entry.recipient,
        type: entry.approved ? 'approved' : 'pending',
        category: entry.category,
        size: entry.approved ? (totalPaid > 0 ? 20 + Math.min(totalPaid * 10, 20) : 15) : 12,
        color: entry.approved ? '#10B981' : '#F59E0B', // green or yellow
        level: 2,
        totalPaid: totalPaid,
        paymentCount: recipientPayments.length
      })

      // Link from Company to Recipient (only if approved and has payments)
      if (entry.approved && totalPaid > 0) {
        links.push({
          source: 'company',
          target: nodeId,
          amount: totalPaid,
          type: 'payment',
          width: Math.max(1, Math.min(totalPaid * 20, 4))
        })
      }
    })

    return { nodes, links }
  }

  const { nodes, links } = generateNetworkData()

  // Initialize D3 force simulation
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 10))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(d => {
        if (d.level === 0) return height * 0.25
        if (d.level === 1) return height * 0.5
        return height * 0.75
      }).strength(0.3))

    simulationRef.current = simulation

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Apply zoom and pan
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-width / 2, -height / 2)

      // Draw links
      links.forEach(link => {
        const source = link.source
        const target = link.target
        
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        
        if (link.type === 'stake') {
          ctx.strokeStyle = isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.8)'
        } else {
          ctx.strokeStyle = isDarkMode ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.6)'
        }
        
        ctx.lineWidth = link.width
        ctx.stroke()
      })

      // Draw animated particles
      particlesRef.current.forEach((particle, index) => {
        const link = links[particle.linkIndex]
        if (!link) return

        const source = link.source
        const target = link.target
        
        particle.progress += 0.005
        if (particle.progress > 1) {
          particle.progress = 0
        }

        const x = source.x + (target.x - source.x) * particle.progress
        const y = source.y + (target.y - source.y) * particle.progress

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fillStyle = link.type === 'stake' ? '#3B82F6' : '#10B981'
        ctx.fill()
      })

      // Draw nodes
      nodes.forEach(node => {
        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
        
        // Fill
        ctx.fillStyle = node.color
        ctx.fill()
        
        // Border
        ctx.strokeStyle = isDarkMode ? '#1f2937' : '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()

        // Label
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000'
        ctx.font = `${Math.max(10, 12 * zoom)}px Inter`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Node type label
        const typeLabel = node.type === 'staker' ? 'VC/LP' : 
                         node.type === 'company' ? 'Company' : 
                         node.label

        ctx.fillText(typeLabel, node.x, node.y - node.size - 10)
        
        // Address label (smaller)
        if (node.address) {
          ctx.font = `${Math.max(8, 10 * zoom)}px monospace`
          ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280'
          const shortAddr = `${node.address.slice(0, 6)}...${node.address.slice(-4)}`
          ctx.fillText(shortAddr, node.x, node.y + node.size + 15)
        }
      })

      ctx.restore()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Initialize particles for animation
    particlesRef.current = links.map((link, index) => ({
      linkIndex: index,
      progress: Math.random()
    }))

    return () => {
      simulation.stop()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [nodes, links, zoom, isDarkMode])

  // Handle canvas click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = node.x - x
      const dy = node.y - y
      return Math.sqrt(dx * dx + dy * dy) < node.size
    })

    setSelectedNode(clickedNode || null)
  }

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  if (!poolData) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No escrow pool selected
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        className="w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer"
      />

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleResetZoom}
          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg">
        <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Legend
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-gray-700 dark:text-gray-300">VC/LP (Staker)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Company</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Approved Recipient</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Pending Approval</span>
          </div>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedNode.label}
            </h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Type: </span>
              <span className="text-gray-900 dark:text-white capitalize">{selectedNode.type}</span>
            </div>
            {selectedNode.address && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Address: </span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {selectedNode.address.slice(0, 10)}...{selectedNode.address.slice(-8)}
                </span>
              </div>
            )}
            {selectedNode.category && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Category: </span>
                <span className="text-gray-900 dark:text-white capitalize">{selectedNode.category}</span>
              </div>
            )}
            {selectedNode.totalPaid !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Paid: </span>
                <span className="text-gray-900 dark:text-white">{selectedNode.totalPaid.toFixed(4)} ETH</span>
              </div>
            )}
            {selectedNode.paymentCount !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Payments: </span>
                <span className="text-gray-900 dark:text-white">{selectedNode.paymentCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

