import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, DollarSign, Users, Activity, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function EnterprisePaymentNetworkV2({ 
  suppliers = [], 
  payments = [], 
  testMode = false, 
  mockData = null,
  demoCase = 'simple' // simple, two-tier, three-tier, complex
}) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
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

        for (let i = 0; i < 50; i++) {
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
      // Use real data (simplified for now)
      nodesData = [{ id: 'company', label: 'Your Company', type: 'company', size: 40, color: '#6366f1', level: 0 }];
      linksData = [];
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

      // Draw animated particles on links
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

        // Draw particle
        ctx.fillStyle = isDarkMode ? '#fbbf24' : '#f59e0b';
        ctx.globalAlpha = 0.8;
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
          💡 Drag to pan • Scroll to zoom • Click nodes for details
        </p>
      </div>
    </div>
  );
}

