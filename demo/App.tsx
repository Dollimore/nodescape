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
  title: 'Audio Amplifier Circuit',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 12 },
  nodes: [
    // Power supply section
    { id: 'vcc', type: 'netlabel', label: 'VCC +9V', style: { color: '#ef4444' } },
    { id: 'gnd1', type: 'netlabel', label: 'GND', style: { color: '#94a3b8' } },

    // Input stage
    { id: 'input', label: 'Audio Input', icon: 'connector', description: '3.5mm jack.' },
    { id: 'c1', label: 'C1', icon: 'capacitor', description: 'Coupling capacitor.', flowRate: '10uF' },
    { id: 'r1', label: 'R1', icon: 'resistor', description: 'Bias resistor.', flowRate: '10K' },
    { id: 'r2', label: 'R2', icon: 'resistor', description: 'Bias resistor.', flowRate: '47K' },

    // Amplifier
    { id: 'q1', label: 'Q1', icon: 'transistor-npn', description: 'NPN amplifier stage.',
      ports: [
        { id: 'B', label: 'B', side: 'left', position: 0.5 },
        { id: 'C', label: 'C', side: 'top', position: 0.5 },
        { id: 'E', label: 'E', side: 'bottom', position: 0.5 },
      ]
    },
    { id: 'r3', label: 'R3', icon: 'resistor', description: 'Collector resistor.', flowRate: '4.7K' },
    { id: 'r4', label: 'R4', icon: 'resistor', description: 'Emitter resistor.', flowRate: '1K' },

    // Output
    { id: 'c2', label: 'C2', icon: 'capacitor', description: 'Output coupling.', flowRate: '100uF' },
    { id: 'speaker', label: 'Speaker', icon: 'speaker', description: '8 ohm speaker.', status: 'online' },
    { id: 'gnd2', type: 'netlabel', label: 'GND', style: { color: '#94a3b8' } },
  ],
  edges: [
    // Signal path
    { id: 'a1', source: 'input', target: 'c1', color: '#3b82f6', flowAnimation: true, annotation: 'Audio in' },
    { id: 'a2', source: 'c1', target: 'q1', targetPort: 'B', color: '#3b82f6', flowAnimation: true },
    { id: 'a3', source: 'r1', target: 'q1', targetPort: 'B', color: '#94a3b8', showJunction: true },
    { id: 'a4', source: 'r2', target: 'q1', targetPort: 'B', color: '#94a3b8', showJunction: true },

    // Collector path
    { id: 'a5', source: 'vcc', target: 'r3', color: '#ef4444', annotation: '+9V' },
    { id: 'a6', source: 'r3', target: 'q1', targetPort: 'C', color: '#ef4444', flowAnimation: true },

    // Emitter path
    { id: 'a7', source: 'q1', sourcePort: 'E', target: 'r4', color: '#f59e0b' },
    { id: 'a8', source: 'r4', target: 'gnd1', color: '#94a3b8' },

    // Output path
    { id: 'a9', source: 'q1', sourcePort: 'C', target: 'c2', color: '#22c55e', flowAnimation: true, showJunction: true },
    { id: 'a10', source: 'c2', target: 'speaker', color: '#22c55e', flowAnimation: true, annotation: 'Amplified' },
    { id: 'a11', source: 'speaker', target: 'gnd2', color: '#94a3b8' },
  ],
};

const hvdcDiagram: FlowDiagram = {
  title: 'HVDC Transmission System',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // Sending end
    { id: 'gen', label: 'Power Station', icon: 'generator', description: 'Coal/gas generation plant.', status: 'online', flowRate: '2000 MW',
      style: { color: '#22c55e' } },
    { id: 'ac-bus-s', label: 'AC Bus (Send)', icon: 'zap', description: '400kV AC collection bus.' },
    { id: 'xfmr-s', label: 'Converter Transformer', icon: 'transformer', description: '400kV/200kV step-down.',
      sections: [
        { heading: 'Rating', content: '2200 MVA' },
        { heading: 'Cooling', content: 'ONAN/ONAF' },
      ]
    },
    { id: 'conv-s', label: 'Rectifier Station', icon: 'diode', description: 'AC to DC conversion.',
      status: 'online', progress: 82, flowRate: '1840 MW',
      sections: [
        { heading: 'Type', content: 'Thyristor 12-pulse' },
        { heading: 'Voltage', content: '+/-500 kV DC' },
      ]
    },

    // DC Transmission
    { id: 'dc-line-p', label: 'DC Line (+)', description: 'Positive pole XLPE cable.', flowRate: '+500 kV',
      style: { color: '#ef4444' } },
    { id: 'dc-line-n', label: 'DC Line (-)', description: 'Negative pole XLPE cable.', flowRate: '-500 kV',
      style: { color: '#3b82f6' } },

    // Receiving end
    { id: 'conv-r', label: 'Inverter Station', icon: 'diode', description: 'DC to AC conversion.',
      status: 'online', progress: 78, flowRate: '1760 MW',
      sections: [
        { heading: 'Type', content: 'VSC MMC' },
        { heading: 'Output', content: '400 kV AC' },
      ]
    },
    { id: 'xfmr-r', label: 'Grid Transformer', icon: 'transformer', description: '200kV/400kV step-up.' },
    { id: 'ac-bus-r', label: 'AC Bus (Receive)', icon: 'zap', description: '400kV AC grid connection.' },
    { id: 'grid', label: 'National Grid', icon: 'zap', description: 'Connected load centers.',
      status: 'online', style: { color: '#3b82f6' } },

    // Protection
    { id: 'gnd-s', type: 'netlabel', label: 'Earth (Send)', style: { color: '#94a3b8' } },
    { id: 'gnd-r', type: 'netlabel', label: 'Earth (Recv)', style: { color: '#94a3b8' } },
  ],
  edges: [
    // AC side - sending
    { id: 'h1', source: 'gen', target: 'ac-bus-s', color: '#22c55e', flowAnimation: true, annotation: '400kV AC', thickness: 3 },
    { id: 'h2', source: 'ac-bus-s', target: 'xfmr-s', color: '#22c55e', flowAnimation: true, thickness: 3 },
    { id: 'h3', source: 'xfmr-s', target: 'conv-s', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },

    // DC transmission
    { id: 'h4', source: 'conv-s', target: 'dc-line-p', color: '#ef4444', flowAnimation: true, annotation: '+500kV DC', thickness: 4 },
    { id: 'h5', source: 'conv-s', target: 'dc-line-n', color: '#3b82f6', flowAnimation: true, annotation: '-500kV DC', thickness: 4 },
    { id: 'h6', source: 'dc-line-p', target: 'conv-r', color: '#ef4444', flowAnimation: true, thickness: 4 },
    { id: 'h7', source: 'dc-line-n', target: 'conv-r', color: '#3b82f6', flowAnimation: true, thickness: 4 },

    // AC side - receiving
    { id: 'h8', source: 'conv-r', target: 'xfmr-r', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },
    { id: 'h9', source: 'xfmr-r', target: 'ac-bus-r', color: '#22c55e', flowAnimation: true, annotation: '400kV AC', thickness: 3 },
    { id: 'h10', source: 'ac-bus-r', target: 'grid', color: '#22c55e', flowAnimation: true, thickness: 3 },

    // Grounding
    { id: 'h11', source: 'conv-s', target: 'gnd-s', color: '#94a3b8', type: 'dashed' },
    { id: 'h12', source: 'conv-r', target: 'gnd-r', color: '#94a3b8', type: 'dashed' },
  ],
};

const nodeTemplates: SidebarNodeTemplate[] = [
  { type: 'default', label: 'Process', description: 'A process step' },
  { type: 'decision', label: 'Decision', description: 'A branch point' },
  { type: 'start', label: 'Start', description: 'Entry point' },
  { type: 'end', label: 'End', description: 'Exit point' },
];

export function App() {
  const [activeDemo, setActiveDemo] = React.useState<'vertical' | 'horizontal' | 'datacenter' | 'circuit' | 'hvdc'>('vertical');
  const [currentDiagram, setCurrentDiagram] = useState<FlowDiagram>(sampleDiagram);
  const demoMap: Record<string, FlowDiagram> = { vertical: sampleDiagram, horizontal: horizontalDiagram, datacenter: datacenterDiagram, circuit: circuitDiagram, hvdc: hvdcDiagram };
  const baseDiagram = demoMap[activeDemo] || sampleDiagram;
  const diagram = activeDemo === 'vertical' ? currentDiagram : baseDiagram;
  const canvasRef = useRef<FlowCanvasRef>(null);

  const handleNodeCollapse = (nodeId: string, collapsed: boolean) => {
    setCurrentDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, branchCollapsed: collapsed } : n),
    }));
  };

  const handleDemoChange = (demo: 'vertical' | 'horizontal' | 'datacenter' | 'circuit' | 'hvdc') => {
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
        <button
          onClick={() => handleDemoChange('hvdc')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'hvdc' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'hvdc' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          HVDC
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
        zoomControls
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
