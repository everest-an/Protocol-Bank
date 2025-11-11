import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, DollarSign, Users, Activity, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function EnterprisePaymentNetworkV2({ 
  suppliers = [], 
  payments = [], 
  testMode = false, 
  mockData = null,
  demoCase = 'simple', // simple, two-tier, three-tier, complex
  account = null // User's wallet address
}) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const simulationRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Generate demo data based on case
  const generateDemoData = (caseType) => {
    const nodes = [];
    const links = [];

    switch (caseType) {
      case 'simple':
        // Single company → suppliers
        nodes.push({
          id: 'hq',
          label: 'My Company HQ',
          type: 'headquarters',
          size: 40,
          color: '#6366f1',
          level: 0
        });

        // Use actual supplier count from mockData if available
        const supplierCount = mockData?.suppliers?.length || 50;
        for (let i = 0; i < supplierCount; i++) {
          const supplierId = `supplier-${i}`;
          nodes.push({
            id: supplierId,
            label: `Supplier ${i + 1}`,
            type: 'supplier',
            size: 15,
            color: '#10b981',
            level: 1
          });

          links.push({
            source: 'hq',
            target: supplierId,
            amount: Math.random() * 100000 + 10000,
            width: Math.random() * 3 + 1
          });
        }
        break;

      case 'two-tier':
        // HQ → Subsidiaries → Suppliers
        nodes.push({
          id: 'hq',
          label: 'Headquarters',
          type: 'headquarters',
          size: 50,
          color: '#6366f1',
          level: 0
        });

        // 5 subsidiaries
        for (let i = 0; i < 5; i++) {
          const subId = `sub-${i}`;
          nodes.push({
            id: subId,
            label: `Subsidiary ${i + 1}`,
            type: 'subsidiary',
            size: 30,
            color: '#8b5cf6',
            level: 1
          });

          links.push({
            source: 'hq',
            target: subId,
            amount: Math.random() * 500000 + 100000,
            width: 4
          });

          // Each subsidiary has 10 suppliers
          for (let j = 0; j < 10; j++) {
            const supplierId = `supplier-${i}-${j}`;
            nodes.push({
              id: supplierId,
              label: `Supplier ${i + 1}-${j + 1}`,
              type: 'supplier',
              size: 15,
              color: '#10b981',
              level: 2
            });

            links.push({
              source: subId,
              target: supplierId,
              amount: Math.random() * 50000 + 5000,
              width: Math.random() * 2 + 1
            });
          }
        }
        break;

      case 'three-tier':
        // HQ → Regional → Branches → Suppliers
        nodes.push({
          id: 'hq',
          label: 'Global HQ',
          type: 'headquarters',
          size: 60,
          color: '#6366f1',
          level: 0
        });

        // 3 regional offices
        for (let i = 0; i < 3; i++) {
          const regionalId = `regional-${i}`;
          nodes.push({
            id: regionalId,
            label: `Regional Office ${i + 1}`,
            type: 'regional',
            size: 40,
            color: '#8b5cf6',
            level: 1
          });

          links.push({
            source: 'hq',
            target: regionalId,
            amount: Math.random() * 1000000 + 200000,
            width: 5
          });

          // Each regional has 3 branches
          for (let j = 0; j < 3; j++) {
            const branchId = `branch-${i}-${j}`;
            nodes.push({
              id: branchId,
              label: `Branch ${i + 1}-${j + 1}`,
              type: 'branch',
              size: 25,
              color: '#a78bfa',
              level: 2
            });

            links.push({
              source: regionalId,
              target: branchId,
              amount: Math.random() * 200000 + 50000,
              width: 3
            });

            // Each branch has 5 suppliers
            for (let k = 0; k < 5; k++) {
              const supplierId = `supplier-${i}-${j}-${k}`;
              nodes.push({
                id: supplierId,
                label: `Supplier ${i + 1}-${j + 1}-${k + 1}`,
                type: 'supplier',
                size: 12,
                color: '#10b981',
                level: 3
              });

              links.push({
                source: branchId,
                target: supplierId,
                amount: Math.random() * 30000 + 3000,
                width: Math.random() * 2 + 0.5
              });
            }
          }
        }
        break;

      case 'complex':
        // Multiple companies with cross-payments
        const companies = ['Company A', 'Company B', 'Company C', 'Company D'];
        companies.forEach((company, i) => {
          nodes.push({
            id: `company-${i}`,
            label: company,
            type: 'company',
            size: 35,
            color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'][i],
            level: 0
          });

          // Each company has suppliers
          for (let j = 0; j < 15; j++) {
            const supplierId = `supplier-${i}-${j}`;
            nodes.push({
              id: supplierId,
              label: `Supplier ${i + 1}-${j + 1}`,
              type: 'supplier',
              size: 12,
              color: '#10b981',
              level: 1
            });

            links.push({
              source: `company-${i}`,
              target: supplierId,
              amount: Math.random() * 50000 + 5000,
              width: Math.random() * 2 + 1
            });
          }
        });

        // Add cross-company payments
        for (let i = 0; i < companies.length; i++) {
          for (let j = i + 1; j < companies.length; j++) {
            if (Math.random() > 0.5) {
              links.push({
                source: `company-${i}`,
                target: `company-${j}`,
                amount: Math.random() * 200000 + 50000,
                width: 3
              });
            }
          }
        }
        break;
    }

    return { nodes, links };
  };

  // Initialize particles for flow animation
  const initializeParticles = (links) => {
    const particles = [];
    links.forEach((link, linkIndex) => {
      const particleCount = Math.ceil(link.amount / 20000); // More particles for larger amounts
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          linkIndex,
          progress: Math.random(), // Random starting position
          speed: 0.001 + Math.random() * 0.002, // Random speed
          size: 2 + Math.random() * 2
        });
      }
    });
    return particles;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Generate demo data or use real data
    let nodesData, linksData;
    if (testMode) {
      const demoData = generateDemoData(demoCase);
      nodesData = demoData.nodes;
      linksData = demoData.links;
    } else {
      // Use real data from blockchain
      nodesData = [];
      linksData = [];
      
      // Center node: User's wallet
      if (account) {
        nodesData.push({
          id: account,
          label: 'My Wallet',
          address: account,
          type: 'headquarters',
          size: 40,
          color: '#6366f1',
          level: 0
        });
        
        // Supplier nodes
        suppliers.forEach(supplier => {
          // Determine color based on status
          let nodeColor = '#10b981'; // Default green (success)
          if (supplier.status === 'failed') {
            nodeColor = '#ef4444'; // Red for failed
          } else if (supplier.status === 'stopped' || supplier.status === 'paused') {
            nodeColor = '#9ca3af'; // Gray for stopped
          }
          
          nodesData.push({
            id: supplier.address,
            label: supplier.name || `Supplier ${supplier.address.slice(0, 6)}`,
            address: supplier.address,
            type: 'supplier',
            size: 15,
            color: nodeColor,
            level: 1,
            category: supplier.category,
            status: supplier.status
          });
        });
        
        // Payment links
        payments.forEach(payment => {
          const recipient = payment.recipient || payment.to;
          if (recipient) {
            linksData.push({
              source: account,
              target: recipient,
              amount: parseFloat(payment.amount || 0),
              width: Math.max(1, Math.log(parseFloat(payment.amount || 1) + 1) * 0.5),
              txHash: payment.txHash,
              timestamp: payment.timestamp
            });
          }
        });
      } else {
        // Fallback if no account
        nodesData.push({ 
          id: 'company', 
          label: 'Connect Wallet', 
          type: 'company', 
          size: 40, 
          color: '#6366f1', 
          level: 0 
        });
      }
    }

    // Initialize particles
    particlesRef.current = initializeParticles(linksData);

    // Create force simulation
    const simulation = d3.forceSimulation(nodesData)
      .force('link', d3.forceLink(linksData).id(d => d.id).distance(d => {
        // Distance based on node levels
        const source = nodesData.find(n => n.id === d.source.id || n.id === d.source);
        const target = nodesData.find(n => n.id === d.target.id || n.id === d.target);
        return (target.level - source.level) * 150 + 100;
      }))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size * zoom + 10));

    simulationRef.current = simulation;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply zoom and pan
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Theme colors
      const bgColor = isDarkMode ? '#0a0e27' : '#ffffff';
      const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
      const linkColor = isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)';

      // Draw background
      ctx.fillStyle = bgColor;
      ctx.fillRect(-pan.x / zoom, -pan.y / zoom, width / zoom, height / zoom);

      // Draw links
      linksData.forEach((link) => {
        const source = link.source;
        const target = link.target;

        const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
        gradient.addColorStop(0, isDarkMode ? '#06b6d4' : '#0891b2');
        gradient.addColorStop(1, isDarkMode ? '#fbbf24' : '#f59e0b');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = link.width * (0.5 + zoom * 0.5);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw animated particles on links (orange dots representing transactions)
      particlesRef.current.forEach((particle) => {
        const link = linksData[particle.linkIndex];
        if (!link) return;

        const source = link.source;
        const target = link.target;

        // Update particle position
        particle.progress += particle.speed;
        if (particle.progress > 1) particle.progress = 0;

        // Calculate particle position
        const x = source.x + (target.x - source.x) * particle.progress;
        const y = source.y + (target.y - source.y) * particle.progress;

        // Draw particle as orange dot (representing each transaction)
        ctx.fillStyle = '#fb923c'; // Orange color for transaction particles
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, particle.size * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw nodes
      nodesData.forEach((node) => {
        // Node circle
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * zoom);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + '80');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * zoom, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = isDarkMode ? '#ffffff40' : '#00000020';
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Node label (only for larger nodes or when zoomed in)
        if (node.size > 20 || zoom > 1.5) {
          ctx.fillStyle = textColor;
          ctx.font = `${12 * zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y + node.size * zoom + 15 * zoom);
        }
      });

      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      simulation.stop();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [testMode, demoCase, zoom, pan, isDarkMode]);

  // Helper function to get node at mouse position
  const getNodeAtPosition = (x, y, nodesData) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Transform mouse coordinates to canvas space
    const canvasX = (x - pan.x) / zoom;
    const canvasY = (y - pan.y) / zoom;

    // Find node at position
    for (let i = nodesData.length - 1; i >= 0; i--) {
      const node = nodesData[i];
      const dx = canvasX - node.x;
      const dy = canvasY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.size) {
        return node;
      }
    }
    return null;
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !simulationRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodesData = simulationRef.current.nodes();
    const node = getNodeAtPosition(x, y, nodesData);

    if (node) {
      // Start dragging node
      setIsDragging(true);
      setDraggedNode(node);
      node.fx = node.x;
      node.fy = node.y;
      simulationRef.current.alphaTarget(0.3).restart();
    } else {
      // Start panning
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !simulationRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && draggedNode) {
      // Drag node
      const canvasX = (x - pan.x) / zoom;
      const canvasY = (y - pan.y) / zoom;
      draggedNode.fx = canvasX;
      draggedNode.fy = canvasY;
      simulationRef.current.alpha(0.3).restart();
    } else if (isPanning) {
      // Pan canvas
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      // Update hovered node
      const nodesData = simulationRef.current.nodes();
      const node = getNodeAtPosition(x, y, nodesData);
      setHoveredNode(node);
      
      // Update cursor
      canvas.style.cursor = node ? 'pointer' : 'move';
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging && draggedNode) {
      // Stop dragging
      draggedNode.fx = null;
      draggedNode.fy = null;
      simulationRef.current.alphaTarget(0);
      setIsDragging(false);
      setDraggedNode(null);
    } else if (isPanning) {
      // Stop panning
      setIsPanning(false);
    }
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !simulationRef.current) return;

    // Don't trigger click if we were dragging
    if (isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodesData = simulationRef.current.nodes();
    const node = getNodeAtPosition(x, y, nodesData);

    if (node) {
      setSelectedNode(node);
    } else {
      setSelectedNode(null);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(4, prev * delta)));
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        style={{ background: isDarkMode ? '#0a0e27' : '#ffffff' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {(zoom * 100).toFixed(0)}%
        </span>
      </div>

      {/* Controls Hint */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 Drag nodes to move • Drag canvas to pan • Scroll to zoom • Click nodes for details
        </p>
      </div>

      {/* Node Details Modal */}
      {selectedNode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 min-w-[400px] max-w-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Node Details
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Node Type */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full" 
                  style={{ backgroundColor: selectedNode.color }}
                />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {selectedNode.type}
                  </p>
                </div>
              </div>

              {/* Label */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedNode.label}
                </p>
              </div>

              {/* Address */}
              {selectedNode.address && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {selectedNode.address}
                  </p>
                </div>
              )}

              {/* Category */}
              {selectedNode.category && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedNode.category}
                  </p>
                </div>
              )}

              {/* Status */}
              {selectedNode.status && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    selectedNode.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    selectedNode.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    selectedNode.status === 'stopped' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedNode.status}
                  </span>
                </div>
              )}

              {/* Level */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedNode.level === 0 ? 'Headquarters' : 
                   selectedNode.level === 1 ? 'Direct Connection' : 
                   `Level ${selectedNode.level}`}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay when modal is open */}
      {selectedNode && (
        <div 
          className="absolute inset-0 bg-black/50 z-40"
          onClick={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

