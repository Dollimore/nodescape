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
    { id: 'auth-group', type: 'group', label: 'Authentication', style: { color: '#3b82f6' } },
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
  title: 'Multi-Terminal HVDC Super Grid',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== NORTH-WEST REGION — Offshore Wind =====
    { id: 'nw-group', type: 'group', label: 'North-West — Offshore Wind Farm', style: { color: '#06b6d4' } },
    { id: 'nw-wind1', label: 'Wind Array A', icon: 'zap', description: '120 turbines, 8MW each.', status: 'online', flowRate: '960 MW', parentId: 'nw-group' },
    { id: 'nw-wind2', label: 'Wind Array B', icon: 'zap', description: '80 turbines, 10MW each.', status: 'online', flowRate: '800 MW', parentId: 'nw-group' },
    { id: 'nw-collect', label: 'Collection Bus', icon: 'zap', description: '66kV AC offshore platform.', parentId: 'nw-group' },
    { id: 'nw-xfmr', label: 'Offshore Transformer', icon: 'transformer', description: '66kV / 320kV step-up.',
      sections: [{ heading: 'Rating', content: '1800 MVA' }, { heading: 'Type', content: 'ONAN subsea' }], parentId: 'nw-group' },
    { id: 'nw-conv', label: 'Offshore Converter', icon: 'diode', description: 'VSC-MMC AC/DC conversion.',
      status: 'online', progress: 88, flowRate: '1600 MW',
      sections: [{ heading: 'Topology', content: 'Half-bridge MMC' }, { heading: 'DC Voltage', content: '+/-320 kV' }], parentId: 'nw-group' },

    // ===== NORTH-EAST REGION — Nuclear + Hydro =====
    { id: 'ne-group', type: 'group', label: 'North-East — Nuclear & Hydro Generation', style: { color: '#8b5cf6' } },
    { id: 'ne-nuclear', label: 'Nuclear Plant', icon: 'generator', description: '2x EPR reactors.',
      status: 'online', flowRate: '3200 MW', style: { color: '#8b5cf6' }, parentId: 'ne-group' },
    { id: 'ne-hydro', label: 'Pumped Hydro', icon: 'generator', description: 'Reversible pump-turbine.',
      status: 'online', flowRate: '1200 MW', style: { color: '#06b6d4' }, parentId: 'ne-group' },
    { id: 'ne-bus', label: 'AC Bus 400kV', icon: 'zap', description: 'Double busbar arrangement.', parentId: 'ne-group' },
    { id: 'ne-xfmr1', label: 'Converter Xfmr 1', icon: 'transformer', description: '400/200kV YNd11.',
      sections: [{ heading: 'Rating', content: '2400 MVA' }], parentId: 'ne-group' },
    { id: 'ne-xfmr2', label: 'Converter Xfmr 2', icon: 'transformer', description: '400/200kV YNd11.',
      sections: [{ heading: 'Rating', content: '1400 MVA' }], parentId: 'ne-group' },
    { id: 'ne-conv1', label: 'Rectifier Station 1', icon: 'diode', description: 'Thyristor LCC 12-pulse.',
      status: 'online', progress: 92, flowRate: '3000 MW',
      sections: [{ heading: 'Type', content: 'LCC Thyristor' }, { heading: 'DC', content: '+/-800 kV' }], parentId: 'ne-group' },
    { id: 'ne-conv2', label: 'Rectifier Station 2', icon: 'diode', description: 'VSC-MMC bi-directional.',
      status: 'online', progress: 67, flowRate: '1200 MW',
      sections: [{ heading: 'Type', content: 'FB-MMC VSC' }, { heading: 'DC', content: '+/-500 kV' }], parentId: 'ne-group' },

    // ===== DC TRANSMISSION CORRIDORS =====
    { id: 'dc-corridor1-p', label: 'HVDC Link 1 (+800kV)', description: '1200km overhead line.', flowRate: '+800 kV', style: { color: '#ef4444' } },
    { id: 'dc-corridor1-n', label: 'HVDC Link 1 (-800kV)', description: '1200km overhead line.', flowRate: '-800 kV', style: { color: '#3b82f6' } },
    { id: 'dc-corridor2', label: 'HVDC Link 2 (+/-500kV)', description: '450km subsea XLPE cable.', flowRate: '+/-500 kV', style: { color: '#f59e0b' } },
    { id: 'dc-corridor3', label: 'HVDC Link 3 (+/-320kV)', description: '280km subsea cable from offshore.', flowRate: '+/-320 kV', style: { color: '#22c55e' } },

    // ===== CENTRAL DC HUB =====
    { id: 'dc-hub-group', type: 'group', label: 'Central DC Switching Hub', style: { color: '#ef4444' } },
    { id: 'dc-breaker1', label: 'DC Breaker 1', icon: 'switch', description: 'Hybrid HVDC circuit breaker.',
      status: 'online', sections: [{ heading: 'Rating', content: '800kV / 5kA' }, { heading: 'Op Time', content: '<2ms' }], parentId: 'dc-hub-group' },
    { id: 'dc-breaker2', label: 'DC Breaker 2', icon: 'switch', description: 'Hybrid HVDC circuit breaker.',
      status: 'online', sections: [{ heading: 'Rating', content: '500kV / 3kA' }], parentId: 'dc-hub-group' },
    { id: 'dc-breaker3', label: 'DC Breaker 3', icon: 'switch', description: 'Hybrid HVDC circuit breaker.',
      status: 'warning', sections: [{ heading: 'Rating', content: '320kV / 2kA' }, { heading: 'Alert', content: 'Maintenance due' }], parentId: 'dc-hub-group' },

    // ===== SOUTH-WEST REGION — Industrial Load =====
    { id: 'sw-group', type: 'group', label: 'South-West — Industrial Load Center', style: { color: '#f59e0b' } },
    { id: 'sw-conv', label: 'Inverter Station SW', icon: 'diode', description: 'VSC-MMC DC/AC inversion.',
      status: 'online', progress: 71, flowRate: '2800 MW',
      sections: [{ heading: 'Type', content: 'FB-MMC VSC' }, { heading: 'Output', content: '400 kV AC' }], parentId: 'sw-group' },
    { id: 'sw-xfmr', label: 'Grid Transformer SW', icon: 'transformer', description: '200/400kV step-up.',
      sections: [{ heading: 'Rating', content: '3200 MVA' }], parentId: 'sw-group' },
    { id: 'sw-bus', label: 'SW 400kV Bus', icon: 'zap', description: 'GIS switchgear.', parentId: 'sw-group' },
    { id: 'sw-smelter', label: 'Aluminium Smelter', icon: 'motor', description: 'Continuous 1200MW load.',
      status: 'online', flowRate: '1200 MW', progress: 95, parentId: 'sw-group' },
    { id: 'sw-city', label: 'Metro Distribution', icon: 'zap', description: 'City grid connection.',
      status: 'online', flowRate: '1600 MW', parentId: 'sw-group' },

    // ===== SOUTH-EAST REGION — Solar + BESS =====
    { id: 'se-group', type: 'group', label: 'South-East — Solar & Battery Storage', style: { color: '#22c55e' } },
    { id: 'se-solar', label: 'Solar Farm', icon: 'zap', description: '2GW utility-scale PV.',
      status: 'online', flowRate: '1400 MW', progress: 70, style: { color: '#f59e0b' }, parentId: 'se-group' },
    { id: 'se-bess', label: 'BESS', icon: 'battery', description: '500MW / 2000MWh Li-ion.',
      status: 'online', flowRate: '300 MW', progress: 62,
      sections: [{ heading: 'Capacity', content: '2000 MWh' }, { heading: 'SoC', content: '62%' }], parentId: 'se-group' },
    { id: 'se-bus', label: 'SE AC Bus 220kV', icon: 'zap', parentId: 'se-group' },
    { id: 'se-conv', label: 'Converter Station SE', icon: 'diode', description: 'Bi-directional VSC.',
      status: 'online', progress: 45, flowRate: '1100 MW',
      sections: [{ heading: 'Type', content: 'FB-MMC' }, { heading: 'DC', content: '+/-500 kV' }], parentId: 'se-group' },

    // ===== PROTECTION & MONITORING =====
    { id: 'gnd-ne', type: 'netlabel', label: 'Earth Electrode NE', style: { color: '#94a3b8' } },
    { id: 'gnd-sw', type: 'netlabel', label: 'Earth Electrode SW', style: { color: '#94a3b8' } },
    { id: 'gnd-se', type: 'netlabel', label: 'Earth Electrode SE', style: { color: '#94a3b8' } },
    { id: 'gnd-nw', type: 'netlabel', label: 'Earth Electrode NW', style: { color: '#94a3b8' } },

    // Control center
    { id: 'scada', label: 'SCADA Control Center', icon: 'layout-dashboard', description: 'Central monitoring and dispatch.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Total Generation', content: '7360 MW' },
        { heading: 'Total Load', content: '6700 MW' },
        { heading: 'DC Losses', content: '~2.1%' },
        { heading: 'System Freq', content: '50.02 Hz' },
      ]
    },
  ],
  edges: [
    // NW Wind Farm internal
    { id: 'nw1', source: 'nw-wind1', target: 'nw-collect', color: '#22c55e', flowAnimation: true, annotation: '960 MW' },
    { id: 'nw2', source: 'nw-wind2', target: 'nw-collect', color: '#22c55e', flowAnimation: true, annotation: '800 MW' },
    { id: 'nw3', source: 'nw-collect', target: 'nw-xfmr', color: '#22c55e', flowAnimation: true, thickness: 3 },
    { id: 'nw4', source: 'nw-xfmr', target: 'nw-conv', color: '#f59e0b', flowAnimation: true, annotation: '320kV AC' },

    // NE Generation internal
    { id: 'ne1', source: 'ne-nuclear', target: 'ne-bus', color: '#8b5cf6', flowAnimation: true, annotation: '3200 MW', thickness: 4 },
    { id: 'ne2', source: 'ne-hydro', target: 'ne-bus', color: '#06b6d4', flowAnimation: true, annotation: '1200 MW', thickness: 3 },
    { id: 'ne3', source: 'ne-bus', target: 'ne-xfmr1', color: '#22c55e', flowAnimation: true, thickness: 3, showJunction: true },
    { id: 'ne4', source: 'ne-bus', target: 'ne-xfmr2', color: '#22c55e', flowAnimation: true, thickness: 2, showJunction: true },
    { id: 'ne5', source: 'ne-xfmr1', target: 'ne-conv1', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },
    { id: 'ne6', source: 'ne-xfmr2', target: 'ne-conv2', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },

    // DC Corridors — NE to Hub
    { id: 'dc1a', source: 'ne-conv1', target: 'dc-corridor1-p', color: '#ef4444', flowAnimation: true, annotation: '+800kV', thickness: 5 },
    { id: 'dc1b', source: 'ne-conv1', target: 'dc-corridor1-n', color: '#3b82f6', flowAnimation: true, annotation: '-800kV', thickness: 5 },
    { id: 'dc1c', source: 'dc-corridor1-p', target: 'dc-breaker1', color: '#ef4444', flowAnimation: true, thickness: 5 },
    { id: 'dc1d', source: 'dc-corridor1-n', target: 'dc-breaker1', color: '#3b82f6', flowAnimation: true, thickness: 5 },

    // DC Corridor — NE Conv2 to Hub
    { id: 'dc2a', source: 'ne-conv2', target: 'dc-corridor2', color: '#f59e0b', flowAnimation: true, annotation: '+/-500kV', thickness: 3 },
    { id: 'dc2b', source: 'dc-corridor2', target: 'dc-breaker2', color: '#f59e0b', flowAnimation: true, thickness: 3 },

    // DC Corridor — NW Offshore to Hub
    { id: 'dc3a', source: 'nw-conv', target: 'dc-corridor3', color: '#22c55e', flowAnimation: true, annotation: '+/-320kV', thickness: 3 },
    { id: 'dc3b', source: 'dc-corridor3', target: 'dc-breaker3', color: '#22c55e', flowAnimation: true, thickness: 3 },

    // Hub to SW
    { id: 'hub-sw1', source: 'dc-breaker1', target: 'sw-conv', color: '#ef4444', flowAnimation: true, thickness: 4, annotation: '800kV DC' },
    { id: 'hub-sw2', source: 'dc-breaker2', target: 'sw-conv', color: '#f59e0b', flowAnimation: true, thickness: 3, showJunction: true },

    // Hub to SE
    { id: 'hub-se1', source: 'dc-breaker3', target: 'se-conv', color: '#22c55e', flowAnimation: true, thickness: 3 },
    { id: 'hub-se2', source: 'dc-breaker2', target: 'se-conv', color: '#f59e0b', flowAnimation: true, thickness: 2, showJunction: true },

    // SW internal
    { id: 'sw1', source: 'sw-conv', target: 'sw-xfmr', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },
    { id: 'sw2', source: 'sw-xfmr', target: 'sw-bus', color: '#22c55e', flowAnimation: true, annotation: '400kV AC', thickness: 3 },
    { id: 'sw3', source: 'sw-bus', target: 'sw-smelter', color: '#ef4444', flowAnimation: true, annotation: '1200 MW', thickness: 3 },
    { id: 'sw4', source: 'sw-bus', target: 'sw-city', color: '#3b82f6', flowAnimation: true, annotation: '1600 MW', thickness: 3 },

    // SE internal
    { id: 'se1', source: 'se-solar', target: 'se-bus', color: '#f59e0b', flowAnimation: true, annotation: '1400 MW', thickness: 3 },
    { id: 'se2', source: 'se-bess', target: 'se-bus', color: '#8b5cf6', flowAnimation: true, annotation: '300 MW' },
    { id: 'se3', source: 'se-bus', target: 'se-conv', color: '#22c55e', flowAnimation: true, thickness: 2 },

    // Earth electrodes
    { id: 'gnd1', source: 'ne-conv1', target: 'gnd-ne', color: '#94a3b8', type: 'dashed' },
    { id: 'gnd2', source: 'sw-conv', target: 'gnd-sw', color: '#94a3b8', type: 'dashed' },
    { id: 'gnd3', source: 'se-conv', target: 'gnd-se', color: '#94a3b8', type: 'dashed' },
    { id: 'gnd4', source: 'nw-conv', target: 'gnd-nw', color: '#94a3b8', type: 'dashed' },

    // SCADA monitoring links
    { id: 'scada1', source: 'scada', target: 'dc-breaker1', color: '#8b5cf6', type: 'dashed', annotation: 'IEC 61850' },
    { id: 'scada2', source: 'scada', target: 'dc-breaker2', color: '#8b5cf6', type: 'dashed' },
    { id: 'scada3', source: 'scada', target: 'dc-breaker3', color: '#8b5cf6', type: 'dashed' },
  ],
};

// ===== SHOWCASE: Every feature in one diagram =====
const showcaseDiagram: FlowDiagram = {
  title: 'Nodescape Feature Showcase',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 24 },
  nodes: [
    // --- Groups ---
    { id: 'grp-gen', type: 'group', label: 'Generation Zone', style: { color: '#22c55e' } },
    { id: 'grp-network', type: 'group', label: 'Transmission Network', style: { color: '#3b82f6' } },
    { id: 'grp-load', type: 'group', label: 'Load Centers', style: { color: '#f59e0b' } },

    // --- Generation (various icons, status, progress, flowRate, sections) ---
    { id: 'gen-solar', label: 'Solar Farm', icon: 'zap', description: 'Utility-scale **2GW** PV array.',
      status: 'online', progress: 72, flowRate: '1440 MW', style: { color: '#f59e0b' }, parentId: 'grp-gen',
      sections: [
        { heading: 'Panels', content: '4.2 million modules' },
        { heading: 'Inverters', content: '200x `SMA Sunny Central`' },
      ],
      detail: {
        content: 'The solar farm operates across **4200 acres** with tracking arrays optimized for maximum energy capture.',
        sections: [
          { type: 'chart', title: 'Daily Output (MW)', data: { type: 'bar', values: [800, 1200, 1400, 1380, 1100, 600, 200], labels: ['6am', '9am', '12pm', '3pm', '5pm', '7pm', '9pm'], color: '#f59e0b' } },
          { type: 'keyvalue', title: 'Specifications', data: { 'Panel Type': 'Bifacial N-type', 'Capacity': '2000 MW', 'Annual Output': '3,800 GWh', 'Capacity Factor': '21.7%', 'Commissioning': '2024' } },
          { type: 'timeline', title: 'Recent Events', data: [
            { time: '14:32', event: 'Cloud cover clearing', status: 'success' },
            { time: '13:15', event: 'Output reduced to 70%', status: 'warning' },
            { time: '11:00', event: 'Peak output reached', status: 'success' },
            { time: '06:30', event: 'Sunrise generation started', status: 'info' },
          ]},
        ],
      },
    },
    { id: 'gen-wind', label: 'Offshore Wind', icon: 'zap', description: 'Floating turbine array.',
      status: 'online', progress: 88, flowRate: '960 MW', parentId: 'grp-gen' },
    { id: 'gen-nuclear', label: 'Nuclear Plant', icon: 'generator', description: 'Gen III+ EPR reactor.',
      status: 'online', progress: 95, flowRate: '1600 MW', style: { color: '#8b5cf6' }, parentId: 'grp-gen',
      sections: [
        { heading: 'Reactor', content: 'EPR 1600 MWe' },
        { heading: 'Coolant', content: 'Pressurized water' },
      ]
    },
    { id: 'gen-bess', label: 'Grid Battery', icon: 'battery', description: '800MW / 3200MWh storage.',
      status: 'online', progress: 58, flowRate: '400 MW', parentId: 'grp-gen',
      sections: [
        { heading: 'Chemistry', content: 'LFP cells' },
        { heading: 'SoC', content: '**58%** (1856 MWh)' },
      ]
    },

    // --- Network (transformers, breakers, bus, measurement, protection) ---
    { id: 'xfmr-main', label: 'Main Transformer', icon: 'transformer', description: '400/220kV auto-transformer.',
      status: 'online', parentId: 'grp-network',
      ports: [
        { id: 'HV', label: 'HV', side: 'top', position: 0.5 },
        { id: 'LV', label: 'LV', side: 'bottom', position: 0.3 },
        { id: 'TV', label: 'TV', side: 'bottom', position: 0.7 },
      ],
      sections: [{ heading: 'Rating', content: '2000 MVA ONAN/ONAF' }]
    },
    { id: 'cb-main', label: 'Main CB', icon: 'circuit-breaker', description: 'SF6 circuit breaker.',
      status: 'online', parentId: 'grp-network' },
    { id: 'bus-400', label: '400kV Bus', description: 'Double busbar with bus coupler.',
      parentId: 'grp-network' },
    { id: 'ct-1', label: 'CT', icon: 'current-transformer', parentId: 'grp-network' },
    { id: 'relay-87', label: 'Diff Relay', icon: 'protection-relay', description: 'Transformer differential.',
      status: 'online', parentId: 'grp-network' },
    { id: 'meter-v', label: 'Voltmeter', icon: 'voltmeter', parentId: 'grp-network' },
    { id: 'meter-a', label: 'Ammeter', icon: 'ammeter', parentId: 'grp-network' },
    { id: 'arr-1', label: 'Surge Arrester', icon: 'surge-arrester', parentId: 'grp-network' },

    // --- Decision node ---
    { id: 'decision-load', type: 'decision', label: 'Load > 3GW?', icon: 'shield-check',
      description: 'Check if total demand exceeds threshold.' },

    // --- HVDC link ---
    { id: 'conv-rect', label: 'Rectifier', icon: 'diode', description: 'LCC thyristor converter.',
      status: 'online', progress: 78, flowRate: '1200 MW',
      sections: [{ heading: 'DC Voltage', content: '+/-500 kV' }] },
    { id: 'dc-cable', label: 'HVDC Cable', description: '350km subsea XLPE.', flowRate: '+/-500 kV',
      style: { color: '#ef4444' } },
    { id: 'conv-inv', label: 'Inverter', icon: 'diode', description: 'VSC-MMC converter.',
      status: 'online', progress: 72, flowRate: '1150 MW' },

    // --- Load centers ---
    { id: 'load-city', label: 'City Grid', icon: 'zap', description: 'Metropolitan distribution.',
      status: 'online', flowRate: '2200 MW', progress: 82, parentId: 'grp-load' },
    { id: 'load-industry', label: 'Industrial Park', icon: 'motor', description: 'Heavy industrial loads.',
      status: 'online', flowRate: '1400 MW', progress: 91, parentId: 'grp-load',
      sections: [{ heading: 'Peak Demand', content: '1800 MW' }] },
    { id: 'load-datacenter', label: 'Data Center Campus', icon: 'server', description: '400MW campus with redundancy.',
      status: 'warning', flowRate: '380 MW', progress: 95, parentId: 'grp-load',
      sections: [
        { heading: 'PUE', content: '1.12' },
        { heading: 'Tier', content: 'IV (2N)' },
        { heading: 'Alert', content: 'Cooling capacity **92%**' },
      ]
    },

    // --- Net labels ---
    { id: 'nl-vcc', type: 'netlabel', label: 'VCC 400kV', style: { color: '#22c55e' } },
    { id: 'nl-gnd', type: 'netlabel', label: 'Station Earth', style: { color: '#94a3b8' } },

    // --- Start/End ---
    { id: 'start-grid', type: 'start', label: 'National Grid Connection', icon: 'zap' },
    { id: 'end-export', type: 'end', label: 'Export to Neighbor', icon: 'log-out' },

    // --- SCADA with glow ---
    { id: 'scada', label: 'SCADA / EMS', icon: 'layout-dashboard', description: 'Energy Management System.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Generation', content: '4400 MW total' },
        { heading: 'Demand', content: '3980 MW' },
        { heading: 'Frequency', content: '50.01 Hz' },
        { heading: 'Reserves', content: '420 MW spinning' },
      ]
    },
  ],
  edges: [
    // Generation to bus
    { id: 's1', source: 'gen-solar', target: 'bus-400', color: '#f59e0b', flowAnimation: true, annotation: '1440 MW', thickness: 3 },
    { id: 's2', source: 'gen-wind', target: 'bus-400', color: '#06b6d4', flowAnimation: true, annotation: '960 MW', thickness: 2 },
    { id: 's3', source: 'gen-nuclear', target: 'xfmr-main', targetPort: 'HV', color: '#8b5cf6', flowAnimation: true, annotation: '1600 MW', thickness: 4 },
    { id: 's4', source: 'gen-bess', target: 'bus-400', color: '#22c55e', flowAnimation: true, annotation: '400 MW', showJunction: true },

    // Transformer to bus
    { id: 's5', source: 'xfmr-main', sourcePort: 'LV', target: 'cb-main', color: '#22c55e', flowAnimation: true },
    { id: 's6', source: 'cb-main', target: 'bus-400', color: '#22c55e', flowAnimation: true, thickness: 3, showJunction: true },

    // Protection & measurement
    { id: 's7', source: 'xfmr-main', sourcePort: 'TV', target: 'ct-1', color: '#94a3b8' },
    { id: 's8', source: 'ct-1', target: 'relay-87', color: '#94a3b8', type: 'dashed' },
    { id: 's9', source: 'bus-400', target: 'meter-v', color: '#94a3b8', type: 'dashed' },
    { id: 's10', source: 'bus-400', target: 'meter-a', color: '#94a3b8', type: 'dashed' },
    { id: 's11', source: 'bus-400', target: 'arr-1', color: '#94a3b8' },

    // Bus to decision
    { id: 's12', source: 'bus-400', target: 'decision-load', color: '#3b82f6', flowAnimation: true, thickness: 3 },

    // Decision branches
    { id: 's13', source: 'decision-load', target: 'load-city', label: 'Yes', type: 'success', color: '#22c55e', flowAnimation: true, annotation: '2200 MW', thickness: 3 },
    { id: 's14', source: 'decision-load', target: 'conv-rect', label: 'Export', type: 'failure', color: '#ef4444', flowAnimation: true },

    // HVDC link
    { id: 's15', source: 'conv-rect', target: 'dc-cable', color: '#ef4444', flowAnimation: true, annotation: '+500kV DC', thickness: 4 },
    { id: 's16', source: 'dc-cable', target: 'conv-inv', color: '#ef4444', flowAnimation: true, thickness: 4 },
    { id: 's17', source: 'conv-inv', target: 'end-export', color: '#f59e0b', flowAnimation: true, annotation: '1150 MW' },

    // Load distribution
    { id: 's18', source: 'bus-400', target: 'load-industry', color: '#f59e0b', flowAnimation: true, annotation: '1400 MW', thickness: 2, showJunction: true },
    { id: 's19', source: 'bus-400', target: 'load-datacenter', color: '#3b82f6', flowAnimation: true, annotation: '380 MW', showJunction: true },

    // Grid connection
    { id: 's20', source: 'start-grid', target: 'bus-400', color: '#22c55e', flowAnimation: true, thickness: 3 },

    // Net labels
    { id: 's21', source: 'bus-400', target: 'nl-vcc', color: '#22c55e', type: 'dashed' },
    { id: 's22', source: 'arr-1', target: 'nl-gnd', color: '#94a3b8', type: 'dashed' },

    // SCADA monitoring
    { id: 's23', source: 'scada', target: 'bus-400', color: '#8b5cf6', type: 'dashed', annotation: 'IEC 61850' },
    { id: 's24', source: 'scada', target: 'relay-87', color: '#8b5cf6', type: 'dashed' },
    { id: 's25', source: 'scada', target: 'conv-rect', color: '#8b5cf6', type: 'dashed' },
  ],
};

const dcFacilityDiagram: FlowDiagram = {
  title: 'Data Center Facility Layout',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // Power
    { id: 'grp-power', type: 'group', label: 'Power Infrastructure', style: { color: '#ef4444' } },
    { id: 'utility', label: 'Utility Feed', icon: 'zap', status: 'online', flowRate: '12 MW', parentId: 'grp-power' },
    { id: 'gen-a', label: 'Generator A', icon: 'generator', status: 'idle', flowRate: '6 MW', parentId: 'grp-power' },
    { id: 'gen-b', label: 'Generator B', icon: 'generator', status: 'idle', flowRate: '6 MW', parentId: 'grp-power' },
    { id: 'ats-1', label: 'ATS-1', icon: 'ats', status: 'online', parentId: 'grp-power' },
    { id: 'ups-a', label: 'UPS A', icon: 'ups-unit', status: 'online', progress: 45, flowRate: '4 MW', parentId: 'grp-power' },
    { id: 'ups-b', label: 'UPS B', icon: 'ups-unit', status: 'online', progress: 42, flowRate: '3.8 MW', parentId: 'grp-power' },

    // Cooling
    { id: 'grp-cool', type: 'group', label: 'Cooling Systems', style: { color: '#06b6d4' } },
    { id: 'chiller-1', label: 'Chiller 1', icon: 'chiller', status: 'online', progress: 68, flowRate: '2.4 MW', parentId: 'grp-cool' },
    { id: 'chiller-2', label: 'Chiller 2', icon: 'chiller', status: 'online', progress: 55, flowRate: '1.8 MW', parentId: 'grp-cool' },
    { id: 'crah-1', label: 'CRAH Row A', icon: 'crah', status: 'online', parentId: 'grp-cool' },
    { id: 'crah-2', label: 'CRAH Row B', icon: 'crah', status: 'warning', parentId: 'grp-cool',
      sections: [{ heading: 'Alert', content: 'Return temp **28.5C** (threshold 28C)' }] },

    // IT Infrastructure
    { id: 'grp-it', type: 'group', label: 'IT Infrastructure', style: { color: '#8b5cf6' } },
    { id: 'pdu-a1', label: 'PDU A1', icon: 'pdu-rack', status: 'online', progress: 72, flowRate: '180 kW', parentId: 'grp-it' },
    { id: 'pdu-b1', label: 'PDU B1', icon: 'pdu-rack', status: 'online', progress: 68, flowRate: '170 kW', parentId: 'grp-it' },
    { id: 'rack-1', label: 'Rack Row 1', icon: 'server-rack', status: 'online', progress: 85, flowRate: '320 kW', parentId: 'grp-it',
      description: '40 racks, high density compute.',
      sections: [{ heading: 'Avg Power', content: '8 kW/rack' }] },
    { id: 'rack-2', label: 'Rack Row 2', icon: 'server-rack', status: 'online', progress: 62, flowRate: '240 kW', parentId: 'grp-it',
      description: '40 racks, storage and network.' },

    // Network
    { id: 'grp-net', type: 'group', label: 'Network', style: { color: '#22c55e' } },
    { id: 'core-sw', label: 'Core Switch', icon: 'network-switch', status: 'online', flowRate: '400 Gbps', parentId: 'grp-net' },
    { id: 'fw-1', label: 'Firewall', icon: 'firewall', status: 'online', parentId: 'grp-net' },
    { id: 'lb-1', label: 'Load Balancer', icon: 'load-balancer', status: 'online', parentId: 'grp-net' },
    { id: 'isp-a', label: 'ISP A', icon: 'zap', status: 'online', flowRate: '100 Gbps', parentId: 'grp-net' },
    { id: 'isp-b', label: 'ISP B', icon: 'zap', status: 'online', flowRate: '100 Gbps', parentId: 'grp-net' },
  ],
  edges: [
    // Power distribution
    { id: 'p1', source: 'utility', target: 'ats-1', color: '#ef4444', flowAnimation: true, thickness: 3, annotation: '12 MW' },
    { id: 'p2', source: 'gen-a', target: 'ats-1', color: '#94a3b8', type: 'dashed' },
    { id: 'p3', source: 'gen-b', target: 'ats-1', color: '#94a3b8', type: 'dashed' },
    { id: 'p4', source: 'ats-1', target: 'ups-a', color: '#ef4444', flowAnimation: true, label: 'Feed A' },
    { id: 'p5', source: 'ats-1', target: 'ups-b', color: '#ef4444', flowAnimation: true, label: 'Feed B' },
    { id: 'p6', source: 'ups-a', target: 'pdu-a1', color: '#f59e0b', flowAnimation: true },
    { id: 'p7', source: 'ups-b', target: 'pdu-b1', color: '#f59e0b', flowAnimation: true },
    { id: 'p8', source: 'pdu-a1', target: 'rack-1', color: '#3b82f6', flowAnimation: true, showJunction: true },
    { id: 'p9', source: 'pdu-b1', target: 'rack-1', color: '#3b82f6', flowAnimation: true, showJunction: true },
    { id: 'p10', source: 'pdu-a1', target: 'rack-2', color: '#3b82f6', flowAnimation: true },
    { id: 'p11', source: 'pdu-b1', target: 'rack-2', color: '#3b82f6', flowAnimation: true },

    // Cooling
    { id: 'c1', source: 'chiller-1', target: 'crah-1', color: '#06b6d4', flowAnimation: true, annotation: 'Supply 7C' },
    { id: 'c2', source: 'chiller-2', target: 'crah-2', color: '#06b6d4', flowAnimation: true, annotation: 'Supply 7C' },

    // Network
    { id: 'n1', source: 'isp-a', target: 'fw-1', color: '#22c55e', flowAnimation: true },
    { id: 'n2', source: 'isp-b', target: 'fw-1', color: '#22c55e', flowAnimation: true },
    { id: 'n3', source: 'fw-1', target: 'lb-1', color: '#22c55e', flowAnimation: true },
    { id: 'n4', source: 'lb-1', target: 'core-sw', color: '#22c55e', flowAnimation: true, annotation: '400 Gbps' },
    { id: 'n5', source: 'core-sw', target: 'rack-1', color: '#22c55e', flowAnimation: true },
    { id: 'n6', source: 'core-sw', target: 'rack-2', color: '#22c55e', flowAnimation: true },
  ],
};

const nuclearDiagram: FlowDiagram = {
  title: 'PWR Nuclear Power Plant',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // Primary Loop
    { id: 'grp-primary', type: 'group', label: 'Primary Loop (Radioactive)', style: { color: '#ef4444' } },
    { id: 'reactor', label: 'Reactor Vessel', icon: 'reactor-vessel', description: 'Pressurized Water Reactor.',
      status: 'online', progress: 95, flowRate: '3400 MWt', parentId: 'grp-primary',
      style: { color: '#ef4444' },
      sections: [
        { heading: 'Type', content: 'PWR Gen III+' },
        { heading: 'Fuel', content: 'UO2 enriched 4.5%' },
        { heading: 'Core Temp', content: 'Inlet **290C** / Outlet **325C**' },
        { heading: 'Pressure', content: '155 bar' },
      ],
      detail: {
        content: 'The reactor core contains **193 fuel assemblies** arranged in a cylindrical configuration. Each assembly contains 264 fuel rods with zircaloy cladding.',
        sections: [
          { type: 'keyvalue', title: 'Reactor Parameters', data: {
            'Thermal Power': '3400 MWt',
            'Core Flow': '18,800 kg/s',
            'Avg Linear Heat Rate': '17.5 kW/m',
            'Burnup': '45,000 MWd/tU',
            'Cycle Length': '18 months',
            'Control Rods': '69 RCCA assemblies',
          }},
          { type: 'chart', title: 'Core Temperature Distribution', data: {
            type: 'line', values: [290, 295, 305, 315, 325, 322, 310, 298, 290], labels: ['In', '', '', '', 'Peak', '', '', '', 'Out'], color: '#ef4444',
          }},
          { type: 'timeline', title: 'Recent Events', data: [
            { time: '08:00', event: 'Shift handover completed', status: 'info' },
            { time: '06:30', event: 'Control rod test - satisfactory', status: 'success' },
            { time: '02:15', event: 'Minor coolant chemistry adjustment', status: 'warning' },
            { time: '00:00', event: 'Steady state operation at 100%', status: 'success' },
          ]},
        ],
      },
    },
    { id: 'pressurizer', label: 'Pressurizer', icon: 'pressurizer', description: 'Maintains system pressure.',
      status: 'online', flowRate: '155 bar', parentId: 'grp-primary' },
    { id: 'rcp-1', label: 'RCP 1', icon: 'pump', description: 'Reactor Coolant Pump Loop 1.',
      status: 'online', progress: 88, parentId: 'grp-primary' },
    { id: 'rcp-2', label: 'RCP 2', icon: 'pump', description: 'Reactor Coolant Pump Loop 2.',
      status: 'online', progress: 85, parentId: 'grp-primary' },
    { id: 'ctrl-rods', label: 'Control Rods', icon: 'control-rod', description: '69 RCCA assemblies.',
      status: 'online', progress: 15, flowRate: '15% inserted', parentId: 'grp-primary' },

    // Steam Generators
    { id: 'grp-sg', type: 'group', label: 'Steam Generation', style: { color: '#f59e0b' } },
    { id: 'sg-1', label: 'Steam Gen 1', icon: 'steam-generator', description: 'U-tube heat exchanger.',
      status: 'online', progress: 92, flowRate: '1700 MWt', parentId: 'grp-sg' },
    { id: 'sg-2', label: 'Steam Gen 2', icon: 'steam-generator', description: 'U-tube heat exchanger.',
      status: 'online', progress: 90, flowRate: '1700 MWt', parentId: 'grp-sg' },

    // Secondary Loop
    { id: 'grp-secondary', type: 'group', label: 'Secondary Loop (Non-Radioactive)', style: { color: '#3b82f6' } },
    { id: 'hp-turbine', label: 'HP Turbine', icon: 'turbine', description: 'High pressure stage.',
      status: 'online', progress: 94, parentId: 'grp-secondary' },
    { id: 'lp-turbine', label: 'LP Turbine', icon: 'turbine', description: 'Low pressure stage (x3).',
      status: 'online', progress: 91, parentId: 'grp-secondary' },
    { id: 'generator', label: 'Generator', icon: 'generator', description: '1200 MWe turbo-generator.',
      status: 'online', flowRate: '1200 MWe', progress: 96, parentId: 'grp-secondary',
      style: { color: '#22c55e' } },
    { id: 'condenser', label: 'Condenser', icon: 'condenser', description: 'Steam to water conversion.',
      status: 'online', parentId: 'grp-secondary' },
    { id: 'feedpump', label: 'Feed Pump', icon: 'pump', description: 'Main feedwater pump.',
      status: 'online', parentId: 'grp-secondary' },
    { id: 'msv', label: 'Main Steam Valve', icon: 'valve', status: 'online', parentId: 'grp-secondary' },

    // Cooling
    { id: 'grp-cooling', type: 'group', label: 'Ultimate Heat Sink', style: { color: '#06b6d4' } },
    { id: 'cooling-tower-1', label: 'Cooling Tower 1', icon: 'cooling-tower', status: 'online', progress: 72, parentId: 'grp-cooling' },
    { id: 'cooling-tower-2', label: 'Cooling Tower 2', icon: 'cooling-tower', status: 'online', progress: 68, parentId: 'grp-cooling' },
    { id: 'circ-pump', label: 'Circ. Pump', icon: 'pump', status: 'online', parentId: 'grp-cooling' },

    // Safety Systems
    { id: 'grp-safety', type: 'group', label: 'Safety Systems', style: { color: '#8b5cf6' } },
    { id: 'eccs', label: 'ECCS', icon: 'valve', description: 'Emergency Core Cooling System.',
      status: 'online', parentId: 'grp-safety',
      sections: [{ heading: 'Status', content: 'Standby - all trains available' }] },
    { id: 'containment', label: 'Containment', icon: 'containment', description: 'Pre-stressed concrete with steel liner.',
      status: 'online', parentId: 'grp-safety',
      sections: [{ heading: 'Pressure', content: '1.01 bar (normal)' }, { heading: 'Leak Rate', content: '<0.1%/day' }] },
    { id: 'spray', label: 'Containment Spray', icon: 'valve', status: 'online', parentId: 'grp-safety' },

    // Grid Connection
    { id: 'xfmr-main', label: 'Main Transformer', icon: 'transformer', status: 'online', flowRate: '1200 MWe',
      sections: [{ heading: 'Rating', content: '1400 MVA 22/400kV' }] },
    { id: 'grid', label: 'National Grid', icon: 'zap', status: 'online', flowRate: '1200 MWe', style: { color: '#22c55e' } },

    // Labels
    { id: 'nl-rad', type: 'netlabel', label: 'RADIATION ZONE', style: { color: '#ef4444' } },
    { id: 'nl-grid', type: 'netlabel', label: '400kV GRID', style: { color: '#22c55e' } },

    // Control
    { id: 'control-room', label: 'Main Control Room', icon: 'layout-dashboard', description: 'Licensed operators on 24/7.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Power Level', content: '100% FP' },
        { heading: 'Reactor Period', content: 'Stable (infinity)' },
        { heading: 'Keff', content: '1.0000' },
        { heading: 'Boron', content: '850 ppm' },
      ],
    },
  ],
  edges: [
    // Primary loop
    { id: 'n1', source: 'reactor', target: 'sg-1', color: '#ef4444', flowAnimation: true, annotation: '325C', thickness: 4,
      measurements: [
        { label: 'T', value: '325', unit: 'C', status: 'normal' as const },
        { label: 'P', value: '155', unit: 'bar' },
      ],
    },
    { id: 'n2', source: 'reactor', target: 'sg-2', color: '#ef4444', flowAnimation: true, annotation: '325C', thickness: 4 },
    { id: 'n3', source: 'sg-1', target: 'rcp-1', color: '#f97316', flowAnimation: true, annotation: '290C' },
    { id: 'n4', source: 'sg-2', target: 'rcp-2', color: '#f97316', flowAnimation: true, annotation: '290C' },
    { id: 'n5', source: 'rcp-1', target: 'reactor', color: '#f97316', flowAnimation: true, thickness: 3 },
    { id: 'n6', source: 'rcp-2', target: 'reactor', color: '#f97316', flowAnimation: true, thickness: 3 },
    { id: 'n7', source: 'pressurizer', target: 'reactor', color: '#ef4444', type: 'dashed', annotation: '155 bar' },
    { id: 'n8', source: 'ctrl-rods', target: 'reactor', color: '#94a3b8', type: 'dashed' },

    // Steam side
    { id: 'n9', source: 'sg-1', target: 'msv', color: '#3b82f6', flowAnimation: true, annotation: 'Steam 280C' },
    { id: 'n10', source: 'sg-2', target: 'msv', color: '#3b82f6', flowAnimation: true, showJunction: true },
    { id: 'n11', source: 'msv', target: 'hp-turbine', color: '#3b82f6', flowAnimation: true, thickness: 3 },
    { id: 'n12', source: 'hp-turbine', target: 'lp-turbine', color: '#3b82f6', flowAnimation: true, thickness: 3 },
    { id: 'n13', source: 'lp-turbine', target: 'generator', color: '#22c55e', flowAnimation: true, annotation: '1200 MWe', thickness: 4,
      measurements: [
        { label: 'P', value: '1200', unit: 'MWe', status: 'normal' as const },
        { label: 'f', value: '50.0', unit: 'Hz' },
      ],
    },
    { id: 'n14', source: 'lp-turbine', target: 'condenser', color: '#06b6d4', flowAnimation: true, annotation: 'Exhaust' },
    { id: 'n15', source: 'condenser', target: 'feedpump', color: '#06b6d4', flowAnimation: true },
    { id: 'n16', source: 'feedpump', target: 'sg-1', color: '#3b82f6', flowAnimation: true, annotation: 'Feedwater' },

    // Cooling
    { id: 'n17', source: 'condenser', target: 'circ-pump', color: '#06b6d4', flowAnimation: true },
    { id: 'n18', source: 'circ-pump', target: 'cooling-tower-1', color: '#06b6d4', flowAnimation: true },
    { id: 'n19', source: 'circ-pump', target: 'cooling-tower-2', color: '#06b6d4', flowAnimation: true },

    // Grid
    { id: 'n20', source: 'generator', target: 'xfmr-main', color: '#22c55e', flowAnimation: true, annotation: '22kV', thickness: 4,
      measurements: [
        { label: 'P', value: '1200', unit: 'MW' },
        { label: 'V', value: '22', unit: 'kV' },
        { label: 'I', value: '31.5', unit: 'kA' },
      ],
    },
    { id: 'n21', source: 'xfmr-main', target: 'grid', color: '#22c55e', flowAnimation: true, annotation: '400kV', thickness: 4 },
    { id: 'n22', source: 'grid', target: 'nl-grid', color: '#22c55e', type: 'dashed' },

    // Safety
    { id: 'n23', source: 'eccs', target: 'reactor', color: '#8b5cf6', type: 'dashed', annotation: 'Emergency' },
    { id: 'n24', source: 'containment', target: 'reactor', color: '#8b5cf6', type: 'dashed' },
    { id: 'n25', source: 'spray', target: 'containment', color: '#8b5cf6', type: 'dashed' },
    { id: 'n26', source: 'reactor', target: 'nl-rad', color: '#ef4444', type: 'dashed' },

    // Control room monitoring
    { id: 'n27', source: 'control-room', target: 'reactor', color: '#8b5cf6', type: 'dashed', annotation: 'Monitoring' },
    { id: 'n28', source: 'control-room', target: 'generator', color: '#8b5cf6', type: 'dashed' },
  ],
};

const nodeTemplates: SidebarNodeTemplate[] = [
  { type: 'default', label: 'Process', description: 'A process step' },
  { type: 'decision', label: 'Decision', description: 'A branch point' },
  { type: 'start', label: 'Start', description: 'Entry point' },
  { type: 'end', label: 'End', description: 'Exit point' },
];

export function App() {
  const [activeDemo, setActiveDemo] = React.useState<'vertical' | 'horizontal' | 'datacenter' | 'circuit' | 'hvdc' | 'showcase' | 'dc-facility' | 'nuclear'>('vertical');
  const [currentDiagram, setCurrentDiagram] = useState<FlowDiagram>(sampleDiagram);
  const demoMap: Record<string, FlowDiagram> = { vertical: sampleDiagram, horizontal: horizontalDiagram, datacenter: datacenterDiagram, circuit: circuitDiagram, hvdc: hvdcDiagram, showcase: showcaseDiagram, 'dc-facility': dcFacilityDiagram, nuclear: nuclearDiagram };
  const baseDiagram = demoMap[activeDemo] || sampleDiagram;
  const diagram = (activeDemo === 'vertical' || activeDemo === 'showcase') ? currentDiagram : baseDiagram;
  const canvasRef = useRef<FlowCanvasRef>(null);

  const handleNodeCollapse = (nodeId: string, collapsed: boolean) => {
    setCurrentDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, branchCollapsed: collapsed } : n),
    }));
  };

  const handleDemoChange = (demo: 'vertical' | 'horizontal' | 'datacenter' | 'circuit' | 'hvdc' | 'showcase' | 'dc-facility' | 'nuclear') => {
    setActiveDemo(demo);
    if (demo === 'vertical') setCurrentDiagram(sampleDiagram);
    if (demo === 'showcase') setCurrentDiagram(showcaseDiagram);
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
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => handleDemoChange('showcase')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'showcase' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'showcase' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Showcase
        </button>
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
        <button
          onClick={() => handleDemoChange('dc-facility')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'dc-facility' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'dc-facility' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          DC Facility
        </button>
        <button
          onClick={() => handleDemoChange('nuclear')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'nuclear' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'nuclear' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Nuclear
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
        onNodesDelete={(ids) => console.log('Delete nodes:', ids)}
        onSelectionChange={(ids) => console.log('Selected:', ids)}
        onNodeLabelChange={(id, label) => console.log('Label changed:', id, label)}
        detailPanel
        story={activeDemo === 'showcase' ? {
          steps: [
            { nodeId: 'gen-solar', title: 'Solar Generation', content: 'The solar farm generates **1440 MW** using 4.2 million PV panels across 4200 acres.' },
            { nodeId: 'gen-nuclear', title: 'Nuclear Baseload', content: 'The nuclear plant provides steady **1600 MW** baseload from a Gen III+ EPR reactor.' },
            { nodeId: 'bus-400', title: 'Transmission Bus', content: 'All generation feeds into the **400kV bus** for distribution to loads.' },
            { nodeId: 'decision-load', title: 'Load Decision', content: 'When total load exceeds **3GW**, surplus power is exported via HVDC link.' },
            { nodeId: 'load-datacenter', title: 'Data Center Load', content: 'The data center campus draws **380 MW** at PUE 1.12 with Tier IV redundancy.' },
            { nodeId: 'scada', title: 'System Control', content: 'The SCADA/EMS monitors all generation, load, and frequency in real-time.' },
          ],
        } : undefined}
      />
    </div>
  );
}
