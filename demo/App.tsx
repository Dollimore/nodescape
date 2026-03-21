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
