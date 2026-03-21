import React, { useRef, useState } from 'react';
import { FlowCanvas } from '../src';
import type { FlowDiagram, SidebarNodeTemplate } from '../src';
import type { FlowCanvasRef } from '../src/FlowCanvas';

const sampleDiagram: FlowDiagram = {
  title: 'User Authentication Flow',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 24 },
  nodes: [
    { id: 'start', type: 'start', label: 'User visits login page', icon: 'log-in' },
    { id: 'input', label: 'Enter credentials', description: 'User provides **email** and `password`.', icon: 'key-round' },
    { id: 'auth-group', type: 'group', label: 'Authentication' },
    {
      id: 'validate',
      type: 'decision',
      label: 'Valid credentials?',
      description: 'Check against *stored hash*.',
      icon: 'shield-check',
      parentId: 'auth-group',
    },
    {
      id: 'grant',
      label: 'Grant access',
      description: 'Create session and redirect to dashboard.',
      icon: 'check-circle',
      parentId: 'auth-group',
      sections: [
        { heading: 'Session', content: 'JWT token with **24h** expiry.' },
        { heading: 'Redirect', content: 'Send to `/dashboard`.' },
      ],
    },
    { id: 'deny', label: 'Show error', description: 'Display invalid credentials message.', icon: 'x-circle', parentId: 'auth-group' },
    { id: 'end-success', type: 'end', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'end-fail', type: 'end', label: 'Login page (retry)', icon: 'rotate-ccw' },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'input' },
    { id: 'e2', source: 'input', target: 'validate' },
    { id: 'e3', source: 'validate', target: 'grant', label: 'Yes', type: 'success' },
    { id: 'e4', source: 'validate', target: 'deny', label: 'No', type: 'failure' },
    { id: 'e5', source: 'grant', target: 'end-success' },
    { id: 'e6', source: 'deny', target: 'end-fail' },
  ],
};

const horizontalDiagram: FlowDiagram = {
  title: 'Data Pipeline',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 24 },
  nodes: [
    { id: 'ingest', type: 'start', label: 'Ingest', description: 'Receive raw data from API.', icon: 'download' },
    { id: 'validate', label: 'Validate', description: 'Check schema and types.', icon: 'shield-check' },
    { id: 'transform', label: 'Transform', description: 'Normalize and enrich data.', icon: 'refresh-cw' },
    { id: 'check', type: 'decision', label: 'Quality check?', icon: 'check-circle' },
    { id: 'store', label: 'Store', description: 'Write to database.', icon: 'database' },
    { id: 'reject', type: 'end', label: 'Reject', description: 'Send to dead letter queue.', icon: 'x-circle' },
    { id: 'done', type: 'end', label: 'Complete', icon: 'check' },
  ],
  edges: [
    { id: 'h1', source: 'ingest', target: 'validate' },
    { id: 'h2', source: 'validate', target: 'transform' },
    { id: 'h3', source: 'transform', target: 'check' },
    { id: 'h4', source: 'check', target: 'store', label: 'Pass', type: 'success' },
    { id: 'h5', source: 'check', target: 'reject', label: 'Fail', type: 'failure' },
    { id: 'h6', source: 'store', target: 'done' },
  ],
};

const datacenterDiagram: FlowDiagram = {
  title: 'Data Center Power Distribution',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 24 },
  nodes: [
    { id: 'grid', type: 'start', label: 'Utility Grid', icon: 'zap', status: 'online', flowRate: '12.4 MW' },
    { id: 'xfmr', label: 'Main Transformer', description: '132kV to 11kV step-down.', icon: 'box', status: 'online', progress: 78 },
    { id: 'swgr', label: 'Main Switchgear', description: '11kV distribution.', icon: 'git-branch', status: 'online' },
    { id: 'ups-a', label: 'UPS System A', description: '2MW capacity.', icon: 'battery-charging', status: 'online', progress: 65, flowRate: '1.3 MW' },
    { id: 'ups-b', label: 'UPS System B', description: '2MW capacity.', icon: 'battery-charging', status: 'warning', progress: 92, flowRate: '1.8 MW' },
    { id: 'pdu-a', label: 'PDU Row A', description: 'Power distribution to racks.', icon: 'server', status: 'online', progress: 45 },
    { id: 'pdu-b', label: 'PDU Row B', description: 'Power distribution to racks.', icon: 'server', status: 'online', progress: 71 },
    { id: 'gen', label: 'Backup Generator', description: '4MW diesel generator.', icon: 'fuel', status: 'idle', flowRate: '0 MW' },
  ],
  edges: [
    { id: 'dc1', source: 'grid', target: 'xfmr', flowAnimation: true, color: '#22c55e' },
    { id: 'dc2', source: 'xfmr', target: 'swgr', flowAnimation: true, color: '#22c55e' },
    { id: 'dc3', source: 'swgr', target: 'ups-a', label: 'Feed A', type: 'success', flowAnimation: true, color: '#3b82f6' },
    { id: 'dc4', source: 'swgr', target: 'ups-b', label: 'Feed B', type: 'success', flowAnimation: true, color: '#3b82f6' },
    { id: 'dc5', source: 'ups-a', target: 'pdu-a', flowAnimation: true, color: '#3b82f6' },
    { id: 'dc6', source: 'ups-b', target: 'pdu-b', flowAnimation: true, color: '#f59e0b' },
    { id: 'dc7', source: 'gen', target: 'swgr', label: 'Backup', type: 'dashed', color: '#94a3b8' },
  ],
};

const circuitDiagram: FlowDiagram = {
  title: 'Simple Power Circuit',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 8 },
  nodes: [
    { id: 'source', label: 'AC Supply', icon: 'voltage-source', description: '240V AC mains.' },
    { id: 'breaker', label: 'Circuit Breaker', icon: 'switch', description: '32A rated.' },
    { id: 'xfmr', label: 'Transformer', icon: 'transformer', description: '240V to 24V step-down.' },
    { id: 'rect', label: 'Rectifier', icon: 'diode', description: 'Full bridge rectifier.' },
    { id: 'cap', label: 'Filter Cap', icon: 'capacitor', description: '1000uF smoothing.', flowRate: '1000uF' },
    { id: 'reg', label: 'Voltage Regulator', icon: 'resistor', description: '24V to 12V regulation.' },
    { id: 'load', label: 'Load', icon: 'motor', description: '12V DC motor.', status: 'online', flowRate: '2.4A' },
    { id: 'gnd', label: 'Ground', icon: 'ground' },
  ],
  edges: [
    { id: 'c1', source: 'source', target: 'breaker', color: '#ef4444', flowAnimation: true },
    { id: 'c2', source: 'breaker', target: 'xfmr', color: '#ef4444', flowAnimation: true },
    { id: 'c3', source: 'xfmr', target: 'rect', color: '#f59e0b', flowAnimation: true },
    { id: 'c4', source: 'rect', target: 'cap', color: '#3b82f6', flowAnimation: true, showJunction: true },
    { id: 'c5', source: 'cap', target: 'reg', color: '#3b82f6', flowAnimation: true },
    { id: 'c6', source: 'reg', target: 'load', label: '12V DC', color: '#22c55e', flowAnimation: true },
    { id: 'c7', source: 'load', target: 'gnd', color: '#94a3b8' },
  ],
};

const nodeTemplates: SidebarNodeTemplate[] = [
  { type: 'default', label: 'Process', description: 'A process step' },
  { type: 'decision', label: 'Decision', description: 'A branch point' },
  { type: 'start', label: 'Start', description: 'Entry point' },
  { type: 'end', label: 'End', description: 'Exit point' },
];

export function App() {
  const [activeDemo, setActiveDemo] = React.useState<'vertical' | 'horizontal' | 'datacenter' | 'circuit'>('vertical');
  const [currentDiagram, setCurrentDiagram] = useState<FlowDiagram>(sampleDiagram);
  const baseDiagram = activeDemo === 'vertical' ? sampleDiagram : activeDemo === 'horizontal' ? horizontalDiagram : activeDemo === 'datacenter' ? datacenterDiagram : circuitDiagram;
  const diagram = activeDemo === 'vertical' ? currentDiagram : baseDiagram;
  const canvasRef = useRef<FlowCanvasRef>(null);

  const handleNodeCollapse = (nodeId: string, collapsed: boolean) => {
    setCurrentDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, branchCollapsed: collapsed } : n),
    }));
  };

  const handleDemoChange = (demo: 'vertical' | 'horizontal' | 'datacenter' | 'circuit') => {
    setActiveDemo(demo);
    if (demo === 'vertical') setCurrentDiagram(sampleDiagram);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 20 }}>
        <button
          onClick={() => canvasRef.current?.downloadPng()}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #e0e0e0',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Export PNG
        </button>
        <button
          onClick={() => canvasRef.current?.downloadSvg()}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #e0e0e0',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Export SVG
        </button>
      </div>
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 20 }}>
        <button
          onClick={() => handleDemoChange('vertical')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'vertical' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'vertical' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Vertical (TB)
        </button>
        <button
          onClick={() => handleDemoChange('horizontal')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'horizontal' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'horizontal' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Horizontal (LR)
        </button>
        <button
          onClick={() => handleDemoChange('datacenter')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'datacenter' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'datacenter' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Data Center
        </button>
        <button
          onClick={() => handleDemoChange('circuit')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'circuit' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'circuit' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Circuit
        </button>
      </div>
      <FlowCanvas
        ref={canvasRef}
        diagram={diagram}
        mode="edit"
        onDiagramChange={console.log}
        background="dots"
        minimap
        themeToggle
        onThemeChange={(t) => console.log('Theme:', t)}
        onNodeClick={(id, node) => console.log('Node clicked:', id, node.label)}
        contextMenu
        onNodeCollapse={handleNodeCollapse}
        sidebar={nodeTemplates}
        onNodeDrop={(template, pos) => console.log('Dropped:', template.label, 'at', pos)}
      />
    </div>
  );
}
