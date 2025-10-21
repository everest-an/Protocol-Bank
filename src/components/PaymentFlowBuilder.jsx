import React, { useState, useRef, useCallback } from 'react';
import { 
  Play, Save, Download, Upload, Trash2, Plus, Info, 
  Wallet, Clock, Zap, Users, GitBranch, Repeat, AlertCircle,
  Bot, Link as LinkIcon, Calendar, DollarSign
} from 'lucide-react';

// Node types
const NODE_TYPES = {
  SENDER: 'sender',
  PAYMENT: 'payment',
  TRIGGER: 'trigger',
  RECEIVER: 'receiver',
  LOGIC: 'logic'
};

// Node templates
const NODE_TEMPLATES = {
  sender: {
    type: NODE_TYPES.SENDER,
    label: 'Sender',
    icon: Wallet,
    color: 'bg-blue-500',
    inputs: [],
    outputs: ['wallet'],
    config: {
      type: 'wallet', // wallet, ai_agent, contract
      address: '',
      apiUrl: ''
    }
  },
  payment: {
    type: NODE_TYPES.PAYMENT,
    label: 'Payment',
    icon: DollarSign,
    color: 'bg-green-500',
    inputs: ['wallet'],
    outputs: ['payment'],
    config: {
      type: 'single', // single, stream, batch, conditional
      amount: '',
      currency: 'ETH'
    }
  },
  trigger: {
    type: NODE_TYPES.TRIGGER,
    label: 'Trigger',
    icon: Zap,
    color: 'bg-yellow-500',
    inputs: ['payment'],
    outputs: ['execute'],
    config: {
      type: 'time', // time, event, chainlink, ai, price
      condition: '',
      cronExpression: '0 0 1 * *', // Monthly on 1st
      chainlinkFeed: '',
      aiApiUrl: '',
      eventName: ''
    }
  },
  receiver: {
    type: NODE_TYPES.RECEIVER,
    label: 'Receiver',
    icon: Users,
    color: 'bg-purple-500',
    inputs: ['execute'],
    outputs: [],
    config: {
      type: 'wallet', // wallet, ai_agent, multiple
      address: '',
      apiUrl: '',
      addresses: []
    }
  },
  logic: {
    type: NODE_TYPES.LOGIC,
    label: 'Logic',
    icon: GitBranch,
    color: 'bg-orange-500',
    inputs: ['any'],
    outputs: ['true', 'false'],
    config: {
      type: 'if', // if, delay, loop, aggregate
      condition: '',
      delaySeconds: 0,
      loopCount: 1
    }
  }
};

// Demo templates
const DEMO_TEMPLATES = [
  {
    id: 'monthly-salary',
    name: 'Monthly Salary Payment',
    description: 'Automatically pay salaries on the 1st of each month',
    nodes: [
      { id: 'n1', ...NODE_TEMPLATES.sender, x: 100, y: 200, config: { type: 'wallet', address: '0x...' } },
      { id: 'n2', ...NODE_TEMPLATES.payment, x: 300, y: 200, config: { type: 'batch', amount: '5000', currency: 'USDC' } },
      { id: 'n3', ...NODE_TEMPLATES.trigger, x: 500, y: 200, config: { type: 'time', cronExpression: '0 0 1 * *' } },
      { id: 'n4', ...NODE_TEMPLATES.receiver, x: 700, y: 200, config: { type: 'multiple', addresses: ['0x...', '0x...'] } }
    ],
    connections: [
      { from: 'n1', fromPort: 'wallet', to: 'n2', toPort: 'wallet' },
      { from: 'n2', fromPort: 'payment', to: 'n3', toPort: 'payment' },
      { from: 'n3', fromPort: 'execute', to: 'n4', toPort: 'execute' }
    ]
  },
  {
    id: 'ai-driven',
    name: 'AI-Driven Payment',
    description: 'AI analyzes data and triggers payment based on conditions',
    nodes: [
      { id: 'n1', ...NODE_TEMPLATES.sender, x: 100, y: 200, config: { type: 'ai_agent', apiUrl: 'https://api.example.com/ai' } },
      { id: 'n2', ...NODE_TEMPLATES.payment, x: 300, y: 200, config: { type: 'conditional', amount: '1000', currency: 'ETH' } },
      { id: 'n3', ...NODE_TEMPLATES.trigger, x: 500, y: 200, config: { type: 'ai', aiApiUrl: 'https://api.example.com/decision' } },
      { id: 'n4', ...NODE_TEMPLATES.receiver, x: 700, y: 200, config: { type: 'ai_agent', apiUrl: 'https://api.example.com/receiver' } }
    ],
    connections: [
      { from: 'n1', fromPort: 'wallet', to: 'n2', toPort: 'wallet' },
      { from: 'n2', fromPort: 'payment', to: 'n3', toPort: 'payment' },
      { from: 'n3', fromPort: 'execute', to: 'n4', toPort: 'execute' }
    ]
  },
  {
    id: 'chainlink-price',
    name: 'Chainlink Price Trigger',
    description: 'Execute payment when ETH price reaches target',
    nodes: [
      { id: 'n1', ...NODE_TEMPLATES.sender, x: 100, y: 200, config: { type: 'wallet', address: '0x...' } },
      { id: 'n2', ...NODE_TEMPLATES.payment, x: 300, y: 200, config: { type: 'single', amount: '10', currency: 'ETH' } },
      { id: 'n3', ...NODE_TEMPLATES.trigger, x: 500, y: 200, config: { type: 'chainlink', chainlinkFeed: 'ETH/USD', condition: '> 3000' } },
      { id: 'n4', ...NODE_TEMPLATES.receiver, x: 700, y: 200, config: { type: 'wallet', address: '0x...' } }
    ],
    connections: [
      { from: 'n1', fromPort: 'wallet', to: 'n2', toPort: 'wallet' },
      { from: 'n2', fromPort: 'payment', to: 'n3', toPort: 'payment' },
      { from: 'n3', fromPort: 'execute', to: 'n4', toPort: 'execute' }
    ]
  }
];

export default function PaymentFlowBuilder({ onDeploy }) {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [demoMode, setDemoMode] = useState(true);
  const canvasRef = useRef(null);

  // Load demo template
  const loadDemo = (template) => {
    setNodes(template.nodes);
    setConnections(template.connections);
    setDemoMode(true);
  };

  // Add node to canvas
  const addNode = (template, x, y) => {
    const newNode = {
      id: `n${Date.now()}`,
      ...template,
      x,
      y
    };
    setNodes([...nodes, newNode]);
  };

  // Update node position
  const updateNodePosition = (id, x, y) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, x, y } : node
    ));
  };

  // Update node config
  const updateNodeConfig = (id, config) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, config: { ...node.config, ...config } } : node
    ));
  };

  // Delete node
  const deleteNode = (id) => {
    setNodes(nodes.filter(node => node.id !== id));
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  // Start connection
  const startConnection = (nodeId, port) => {
    setConnecting({ from: nodeId, fromPort: port });
  };

  // Complete connection
  const completeConnection = (nodeId, port) => {
    if (connecting && connecting.from !== nodeId) {
      const newConnection = {
        from: connecting.from,
        fromPort: connecting.fromPort,
        to: nodeId,
        toPort: port
      };
      setConnections([...connections, newConnection]);
    }
    setConnecting(null);
  };

  // Validate flow
  const validateFlow = () => {
    if (nodes.length === 0) return { valid: false, error: 'No nodes in flow' };
    
    const senders = nodes.filter(n => n.type === NODE_TYPES.SENDER);
    const receivers = nodes.filter(n => n.type === NODE_TYPES.RECEIVER);
    
    if (senders.length === 0) return { valid: false, error: 'Missing sender node' };
    if (receivers.length === 0) return { valid: false, error: 'Missing receiver node' };
    
    // Check all nodes are connected
    const connectedNodes = new Set();
    connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });
    
    const unconnected = nodes.filter(n => !connectedNodes.has(n.id));
    if (unconnected.length > 0) {
      return { valid: false, error: `Unconnected nodes: ${unconnected.map(n => n.label).join(', ')}` };
    }
    
    return { valid: true };
  };

  // Deploy flow
  const handleDeploy = () => {
    const validation = validateFlow();
    if (!validation.valid) {
      alert(`Cannot deploy: ${validation.error}`);
      return;
    }
    
    const flowData = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        config: n.config
      })),
      connections
    };
    
    if (onDeploy) {
      onDeploy(flowData);
    }
    
    alert('Flow deployed successfully!');
    setDemoMode(false);
  };

  // Save flow as template
  const saveTemplate = () => {
    const template = {
      name: prompt('Template name:'),
      nodes,
      connections
    };
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-flow-${Date.now()}.json`;
    a.click();
  };

  // Load template from file
  const loadTemplate = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const template = JSON.parse(e.target.result);
        setNodes(template.nodes);
        setConnections(template.connections);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Visual Payment Flow Builder</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag nodes, connect them, and deploy automated payment flows
            </p>
          </div>
          <div className="flex items-center gap-3">
            {demoMode && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                Demo Mode
              </span>
            )}
            <button
              onClick={() => document.getElementById('load-template').click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Load
            </button>
            <input
              id="load-template"
              type="file"
              accept=".json"
              onChange={loadTemplate}
              className="hidden"
            />
            <button
              onClick={saveTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Deploy Flow
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Node Palette */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Node Palette</h3>
          
          {/* Demo Templates */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Demo Templates</h4>
            <div className="space-y-2">
              {DEMO_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => loadDemo(template)}
                  className="w-full text-left px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-100">{template.name}</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Node Types */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Nodes</h4>
            <div className="space-y-2">
              {Object.entries(NODE_TEMPLATES).map(([key, template]) => {
                const Icon = template.icon;
                return (
                  <button
                    key={key}
                    onClick={() => addNode(template, 200, 200)}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{template.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={canvasRef}
            className="w-full h-full bg-gray-100 dark:bg-gray-950"
            style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            {/* Render connections */}
            {connections.map((conn, index) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              
              return (
                <line
                  key={index}
                  x1={fromNode.x + 120}
                  y1={fromNode.y + 40}
                  x2={toNode.x}
                  y2={toNode.y + 40}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            
            {/* Arrow marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>

          {/* Render nodes */}
          {nodes.map(node => {
            const Icon = node.icon;
            return (
              <div
                key={node.id}
                style={{ left: node.x, top: node.y }}
                className="absolute w-32 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg cursor-move"
                draggable
                onDragStart={(e) => {
                  setDraggingNode(node.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={(e) => {
                  const rect = canvasRef.current.getBoundingClientRect();
                  updateNodePosition(node.id, e.clientX - rect.left - 60, e.clientY - rect.top - 40);
                  setDraggingNode(null);
                }}
                onClick={() => setSelectedNode(node)}
              >
                <div className={`${node.color} px-3 py-2 rounded-t-lg flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-xs font-medium text-white">{node.label}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="text-white hover:text-red-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {node.config.type || 'Configure'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Help text */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Load a demo template or drag nodes from the palette to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Node Properties</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Node Type
                </label>
                <div className="text-sm text-gray-900 dark:text-white">{selectedNode.label}</div>
              </div>
              
              {/* Dynamic config fields based on node type */}
              {Object.entries(selectedNode.config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

