import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { X, DollarSign, Users, Activity } from 'lucide-react';

export default function EnterprisePaymentNetwork({ suppliers = [], payments = [], testMode = false, mockData = null }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const simulationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Prepare data
    const nodes = [];
    const links = [];

    // Add company node
    nodes.push({
      id: 'company',
      label: 'Your Company',
      type: 'company',
      size: 30,
      color: '#6366f1',
      x: width / 2,
      y: height / 2
    });

    // Use test data or real data
    const dataSource = testMode && mockData ? mockData.suppliers : suppliers;
    const paymentsSource = testMode && mockData ? mockData.payments : payments;

    // Add supplier nodes
    dataSource.forEach((supplier, index) => {
      const supplierPayments = paymentsSource.filter(p => 
        p.recipient === supplier.address || p.supplier === supplier.name
      );
      const totalAmount = supplierPayments.reduce((sum, p) => 
        sum + parseFloat(p.amount || 0), 0
      );

      const categoryColors = {
        'Technology': '#3b82f6',
        'Marketing': '#ef4444',
        'Cloud Services': '#8b5cf6',
        'Logistics': '#f59e0b',
        'Design': '#ec4899',
        'Consulting': '#10b981',
        'Manufacturing': '#06b6d4',
        'Professional Services': '#84cc16',
        'Legal': '#f97316',
        'Finance': '#a855f7'
      };

      nodes.push({
        id: `supplier-${index}`,
        label: supplier.name || `Supplier ${index + 1}`,
        type: 'supplier',
        size: Math.max(8, Math.min(20, Math.log10(totalAmount + 1) * 4)),
        color: categoryColors[supplier.category] || '#6b7280',
        amount: totalAmount,
        transactions: supplierPayments.length,
        category: supplier.category || 'Other',
        address: supplier.address
      });

      links.push({
        source: 'company',
        target: `supplier-${index}`,
        value: totalAmount
      });
    });

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
        if (d.source.type === 'company') return 120;
        return 60;
      }))
      .force('charge', d3.forceManyBody().strength(d => {
        if (d.type === 'company') return -800;
        return -30;
      }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 3));

    simulationRef.current = simulation;

    // Transform for zoom/pan
    let transform = d3.zoomIdentity;

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        transform = event.transform;
        draw();
      });

    d3.select(canvas).call(zoom);

    // Draw function
    function draw() {
      ctx.save();
      
      // Clear canvas with dark background
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stars background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillRect(x, y, 1, 1);
      }

      // Apply transform
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Draw links with gradient
      links.forEach(link => {
        const gradient = ctx.createLinearGradient(
          link.source.x, link.source.y,
          link.target.x, link.target.y
        );
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.6)'); // Cyan
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0.4)'); // Yellow
        
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(0.5, Math.sqrt(link.value) / 50);
        ctx.stroke();
      });

      // Draw nodes with glow
      nodes.forEach(node => {
        // Glow effect
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * 2
        );
        glowGradient.addColorStop(0, node.color);
        glowGradient.addColorStop(0.5, node.color + '40');
        glowGradient.addColorStop(1, node.color + '00');
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 2, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Solid node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Node border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw labels for important nodes
        if (node.size > 12 || node.type === 'company') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.max(10, node.size / 2)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y + node.size + 12);
        }
      });

      ctx.restore();
    }

    // Simulation tick
    simulation.on('tick', draw);

    // Initial draw
    draw();

    // Mouse interaction
    function getMousePos(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - transform.x) / transform.k,
        y: (event.clientY - rect.top - transform.y) / transform.k
      };
    }

    function findNode(pos) {
      return nodes.find(node => {
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < node.size;
      });
    }

    canvas.addEventListener('mousemove', (event) => {
      const pos = getMousePos(event);
      const node = findNode(pos);
      setHoveredNode(node || null);
      canvas.style.cursor = node ? 'pointer' : 'grab';
    });

    canvas.addEventListener('click', (event) => {
      const pos = getMousePos(event);
      const node = findNode(pos);
      if (node && node.type !== 'company') {
        setSelectedNode(node);
      }
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [suppliers, payments, testMode, mockData]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />

      {/* Hover tooltip */}
      {hoveredNode && hoveredNode.type !== 'company' && (
        <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 text-white max-w-xs shadow-xl">
          <h3 className="font-semibold text-lg mb-2 text-cyan-400">{hoveredNode.label}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Category:</span>
              <span className="text-white">{hoveredNode.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-green-400 font-semibold">
                ${hoveredNode.amount?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transactions:</span>
              <span className="text-blue-400">{hoveredNode.transactions || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected node detail panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 max-w-sm shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-cyan-400">{selectedNode.label}</h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Users size={16} className="text-cyan-400" />
              <span className="text-gray-400">Category:</span>
              <span>{selectedNode.category}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-gray-400">Total Amount:</span>
              <span className="text-green-400 font-semibold">
                ${selectedNode.amount?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Activity size={16} className="text-blue-400" />
              <span className="text-gray-400">Transactions:</span>
              <span className="text-blue-400">{selectedNode.transactions || 0}</span>
            </div>
            {selectedNode.address && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-gray-400 text-xs">Address:</span>
                <p className="text-gray-300 text-xs font-mono mt-1 break-all">
                  {selectedNode.address}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
        <p>🖱️ Drag to pan • 🔍 Scroll to zoom • 💡 Hover for details</p>
      </div>
    </div>
  );
}

