import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function PaymentUniverse({ data, width, height, onNodeClick }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const simulationRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size with device pixel ratio
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    // Create simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(d => {
        // Vary distance based on node types
        if (d.source.type === 'company') return 150;
        return 80;
      }))
      .force('charge', d3.forceManyBody().strength(d => {
        if (d.type === 'company') return -1000;
        return -50;
      }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5));

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
      context.save();
      context.clearRect(0, 0, width, height);

      // Apply transform
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      // Draw links
      context.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      data.links.forEach(link => {
        context.beginPath();
        context.moveTo(link.source.x, link.source.y);
        context.lineTo(link.target.x, link.target.y);
        context.lineWidth = Math.sqrt(link.value) / 100;
        context.stroke();
      });

      // Draw nodes
      data.nodes.forEach(node => {
        context.beginPath();
        context.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        
        // Glow effect
        const gradient = context.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * 2
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(0.5, node.color + '80');
        gradient.addColorStop(1, node.color + '00');
        
        context.fillStyle = gradient;
        context.fill();
        
        // Solid center
        context.fillStyle = node.color;
        context.fill();

        // Draw labels for important nodes
        if (node.size > 15 || node.type === 'company') {
          context.fillStyle = '#ffffff';
          context.font = `${Math.max(10, node.size / 2)}px Inter, sans-serif`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(node.label, node.x, node.y + node.size + 12);
        }
      });

      context.restore();
    }

    // Simulation tick
    simulation.on('tick', draw);

    // Mouse interaction
    function getMousePos(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - transform.x) / transform.k,
        y: (event.clientY - rect.top - transform.y) / transform.k
      };
    }

    function findNode(pos) {
      return data.nodes.find(node => {
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < node.size;
      });
    }

    canvas.addEventListener('mousemove', (event) => {
      const pos = getMousePos(event);
      const node = findNode(pos);
      setHoveredNode(node || null);
      canvas.style.cursor = node ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', (event) => {
      const pos = getMousePos(event);
      const node = findNode(pos);
      if (node && onNodeClick) {
        onNodeClick(node);
      }
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #000000 100%)'
        }}
      />
      
      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-white max-w-xs">
          <h3 className="font-semibold text-lg mb-2">{hoveredNode.label}</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">Type: <span className="text-white">{hoveredNode.type}</span></p>
            <p className="text-gray-300">Category: <span className="text-white">{hoveredNode.category || 'N/A'}</span></p>
            <p className="text-gray-300">Amount: <span className="text-green-400">${hoveredNode.amount?.toLocaleString() || 0}</span></p>
            <p className="text-gray-300">Transactions: <span className="text-blue-400">{hoveredNode.transactions || 0}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

