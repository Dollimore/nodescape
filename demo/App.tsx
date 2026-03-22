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

const windFarmDiagram: FlowDiagram = {
  title: 'Offshore Wind Farm — Hornsea Scale',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== OFFSHORE ARRAY =====
    { id: 'grp-array', type: 'group', label: 'Offshore Array', style: { color: '#06b6d4' } },

    { id: 'string-a', label: 'Turbine String A', icon: 'zap',
      description: '25x Siemens SG 14-222 DD offshore turbines.',
      status: 'online', progress: 94, flowRate: '334 MW',
      parentId: 'grp-array',
      sections: [
        { heading: 'Turbines', content: '25 x 14 MW' },
        { heading: 'Rotor Dia.', content: '222 m' },
        { heading: 'Hub Height', content: '150 m MSL' },
        { heading: 'Availability', content: '94.2%' },
      ],
      detail: {
        content: 'String A covers the **north-west sector** of the array. Turbines are arranged in 5 rows of 5, spaced 7 rotor diameters apart to minimize wake losses.',
        sections: [
          { type: 'keyvalue', title: 'Turbine Specifications', data: {
            'Model': 'Siemens SG 14-222 DD',
            'Rated Power': '14 MW per unit',
            'Cut-in Wind': '3 m/s',
            'Rated Wind': '11 m/s',
            'Cut-out Wind': '25 m/s',
            'Foundation': 'Monopile (jacket backup)',
            'Water Depth': '25-40 m',
          }},
          { type: 'chart', title: 'Power Curve (MW vs Wind Speed)', data: {
            type: 'line', values: [0, 0.5, 2, 5, 9, 13.5, 14, 14, 14, 13.8, 0],
            labels: ['0', '3', '5', '7', '9', '11', '12', '15', '20', '22', '25'],
            color: '#06b6d4',
          }},
          { type: 'timeline', title: 'Operational Events', data: [
            { time: '09:15', event: 'String A output at rated power', status: 'success' },
            { time: '07:30', event: 'Wind speed crossed rated threshold', status: 'info' },
            { time: '05:00', event: 'Turbine A-12 resumed after maintenance', status: 'success' },
            { time: '01:30', event: 'Turbine A-12 scheduled maintenance', status: 'warning' },
          ]},
        ],
      },
    },

    { id: 'string-b', label: 'Turbine String B', icon: 'zap',
      description: '25x Siemens SG 14-222 DD offshore turbines.',
      status: 'online', progress: 91, flowRate: '318 MW',
      parentId: 'grp-array',
      sections: [
        { heading: 'Turbines', content: '25 x 14 MW' },
        { heading: 'Availability', content: '91.4%' },
        { heading: 'Wake Loss', content: '3.8%' },
        { heading: 'Sector', content: 'North-East' },
      ],
    },

    { id: 'string-c', label: 'Turbine String C', icon: 'zap',
      description: '20x Siemens SG 14-222 DD offshore turbines.',
      status: 'warning', progress: 78, flowRate: '218 MW',
      parentId: 'grp-array',
      sections: [
        { heading: 'Turbines', content: '20 x 14 MW (2 offline)' },
        { heading: 'Availability', content: '78.1%' },
        { heading: 'Alert', content: '2 turbines in **scheduled maintenance**' },
        { heading: 'Sector', content: 'South' },
      ],
    },

    { id: 'array-junction', label: 'Inter-Array Junction', icon: 'git-merge',
      description: '33kV submarine cable junction hub.',
      status: 'online',
      parentId: 'grp-array',
      sections: [
        { heading: 'Voltage', content: '33 kV AC' },
        { heading: 'Cable Type', content: 'XLPE submarine' },
        { heading: 'Total Flow', content: '870 MW' },
      ],
    },

    { id: 'collect-platform', label: 'Collection Platform', icon: 'server',
      description: 'Offshore collection and switching platform.',
      status: 'online', flowRate: '870 MW',
      parentId: 'grp-array',
      sections: [
        { heading: 'Type', content: 'Jacket-mounted topsides' },
        { heading: 'Switchgear', content: '33kV GIS switchboard' },
        { heading: 'Voltage', content: '33 kV' },
        { heading: 'Busbars', content: '2x double-bus arrangement' },
      ],
    },

    // ===== OFFSHORE SUBSTATION =====
    { id: 'grp-oss', type: 'group', label: 'Offshore Substation (OSS)', style: { color: '#f59e0b' } },

    { id: 'oss-xfmr', label: 'Offshore Transformer', icon: 'transformer',
      description: '33kV to 132kV step-up transformer.',
      status: 'online', progress: 82, flowRate: '870 MW',
      parentId: 'grp-oss',
      sections: [
        { heading: 'Rating', content: '1000 MVA ONAN' },
        { heading: 'HV Voltage', content: '132 kV' },
        { heading: 'LV Voltage', content: '33 kV' },
        { heading: 'Vector Group', content: 'YNd11' },
        { heading: 'Impedance', content: '12.5%' },
      ],
    },

    { id: 'oss-svc', label: 'SVC — Reactive Compensation', icon: 'zap',
      description: 'Static Var Compensator for voltage stability.',
      status: 'online',
      parentId: 'grp-oss',
      sections: [
        { heading: 'Range', content: '-200 to +200 MVAr' },
        { heading: 'Response', content: '<30 ms' },
        { heading: 'Current', content: '+45 MVAr absorb' },
      ],
    },

    { id: 'oss-switchgear', label: 'OSS 132kV Switchgear', icon: 'git-branch',
      description: 'GIS switchgear at 132kV.',
      status: 'online',
      parentId: 'grp-oss',
      sections: [
        { heading: 'Type', content: 'SF6 GIS' },
        { heading: 'Voltage', content: '132 kV' },
        { heading: 'Busbars', content: 'Double busbar' },
        { heading: 'Feeders', content: '6 outgoing' },
      ],
    },

    // ===== EXPORT CABLE =====
    { id: 'grp-export', type: 'group', label: 'Export Cable System', style: { color: '#3b82f6' } },

    { id: 'export-cable', label: 'Export Subsea Cable', icon: 'zap',
      description: '132kV HVAC subsea cable export route.',
      status: 'online', flowRate: '850 MW',
      parentId: 'grp-export',
      sections: [
        { heading: 'Length', content: '95 km subsea' },
        { heading: 'Voltage', content: '132 kV AC' },
        { heading: 'Type', content: 'Mass-impregnated XLPE' },
        { heading: 'Cross-section', content: '1200 mm2 Cu' },
        { heading: 'Burial Depth', content: '1-2 m below seabed' },
        { heading: 'Rated Current', content: '1050 A' },
      ],
    },

    { id: 'cable-transition', label: 'Cable Transition Joint', icon: 'arrow-right',
      description: 'Subsea-to-onshore cable transition at beach.',
      status: 'online',
      parentId: 'grp-export',
      sections: [
        { heading: 'Location', content: 'Landfall — Grimsby' },
        { heading: 'Method', content: 'Horizontal directional drill' },
        { heading: 'HDD Length', content: '600 m' },
      ],
    },

    // ===== ONSHORE GRID =====
    { id: 'grp-onshore', type: 'group', label: 'Onshore Grid Connection', style: { color: '#22c55e' } },

    { id: 'onshore-sub', label: 'Onshore Substation', icon: 'box',
      description: '132/400kV onshore substation.',
      status: 'online', progress: 85, flowRate: '835 MW',
      parentId: 'grp-onshore',
      sections: [
        { heading: 'HV Rating', content: '400 kV' },
        { heading: 'LV Rating', content: '132 kV' },
        { heading: 'Transformers', content: '2x 500 MVA autotransformers' },
        { heading: 'Switchgear', content: '400kV AIS double busbar' },
      ],
    },

    { id: 'onshore-xfmr', label: 'Grid Transformer', icon: 'transformer',
      description: '132kV to 400kV autotransformer.',
      status: 'online', flowRate: '835 MW',
      parentId: 'grp-onshore',
      sections: [
        { heading: 'Rating', content: '2x 500 MVA' },
        { heading: 'HV', content: '400 kV' },
        { heading: 'LV', content: '132 kV' },
        { heading: 'Tap Range', content: '+/-10% OLTC' },
      ],
    },

    { id: 'grid-poi', label: 'Grid Connection Point', icon: 'zap',
      description: '400kV point of common coupling with National Grid.',
      status: 'online', flowRate: '835 MW',
      style: { color: '#22c55e' },
      parentId: 'grp-onshore',
      sections: [
        { heading: 'Voltage', content: '400 kV' },
        { heading: 'Grid Code', content: 'GB Grid Code 2023' },
        { heading: 'Freq Response', content: 'FFR contracted' },
        { heading: 'Export Cap.', content: '1200 MW (contracted)' },
      ],
    },

    { id: 'om-base', label: 'O&M Operations Base', icon: 'anchor',
      description: 'Shore-based operations and maintenance facility.',
      status: 'online',
      sections: [
        { heading: 'Location', content: 'Grimsby Port' },
        { heading: 'Personnel', content: '120 technicians' },
        { heading: 'Vessels', content: '4x SOV, 6x CTV' },
        { heading: 'Shift Pattern', content: '12-hour rotating' },
      ],
    },

    { id: 'weather-station', label: 'Met Mast — Weather Station', icon: 'cloud',
      description: 'Offshore meteorological monitoring mast.',
      status: 'online',
      sections: [
        { heading: 'Wind Speed', content: '**12.4 m/s** at 100m hub' },
        { heading: 'Wind Dir.', content: '248 degrees (WSW)' },
        { heading: 'Wave Height', content: '1.8 m Hs' },
        { heading: 'Air Temp', content: '9.2 C' },
        { heading: 'Visibility', content: '14 km' },
      ],
    },

    { id: 'scada-wind', label: 'Wind Farm SCADA', icon: 'layout-dashboard',
      description: 'Central SCADA and asset management system.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Total Output', content: '**870 MW**' },
        { heading: 'Capacity Factor', content: '43.7%' },
        { heading: 'Turbines Online', content: '68 / 70' },
        { heading: 'Curtailment', content: '0 MW' },
        { heading: 'Est. Daily Gen.', content: '~18,500 MWh' },
      ],
    },
  ],
  edges: [
    // Turbine strings to junction
    { id: 'wf1', source: 'string-a', target: 'array-junction', color: '#06b6d4', flowAnimation: true, annotation: '334 MW', thickness: 3, label: '33kV' },
    { id: 'wf2', source: 'string-b', target: 'array-junction', color: '#06b6d4', flowAnimation: true, annotation: '318 MW', thickness: 3 },
    { id: 'wf3', source: 'string-c', target: 'array-junction', color: '#f59e0b', flowAnimation: true, annotation: '218 MW', thickness: 2 },

    // Junction to collection platform
    { id: 'wf4', source: 'array-junction', target: 'collect-platform', color: '#06b6d4', flowAnimation: true, annotation: '870 MW', thickness: 4, label: '33kV XLPE' },

    // Collection platform to OSS transformer
    { id: 'wf5', source: 'collect-platform', target: 'oss-xfmr', color: '#22c55e', flowAnimation: true, annotation: '33kV', thickness: 4 },

    // OSS transformer to switchgear
    { id: 'wf6', source: 'oss-xfmr', target: 'oss-switchgear', color: '#f59e0b', flowAnimation: true, annotation: '132kV', thickness: 4 },

    // SVC to switchgear (reactive compensation)
    { id: 'wf7', source: 'oss-svc', target: 'oss-switchgear', color: '#8b5cf6', type: 'dashed', annotation: 'VAr support' },

    // Switchgear to export cable
    { id: 'wf8', source: 'oss-switchgear', target: 'export-cable', color: '#3b82f6', flowAnimation: true, annotation: '132kV', thickness: 4, label: '132kV Export' },

    // Export cable to cable transition
    { id: 'wf9', source: 'export-cable', target: 'cable-transition', color: '#3b82f6', flowAnimation: true, annotation: '95 km', thickness: 3 },

    // Cable transition to onshore substation
    { id: 'wf10', source: 'cable-transition', target: 'onshore-sub', color: '#22c55e', flowAnimation: true, annotation: '132kV', thickness: 4 },

    // Onshore substation to grid transformer
    { id: 'wf11', source: 'onshore-sub', target: 'onshore-xfmr', color: '#22c55e', flowAnimation: true, thickness: 3 },

    // Grid transformer to POI
    { id: 'wf12', source: 'onshore-xfmr', target: 'grid-poi', color: '#22c55e', flowAnimation: true, annotation: '400kV', thickness: 4, label: 'National Grid' },

    // O&M base monitoring links
    { id: 'wf13', source: 'om-base', target: 'collect-platform', color: '#94a3b8', type: 'dashed', annotation: 'Vessel ops' },
    { id: 'wf14', source: 'om-base', target: 'weather-station', color: '#94a3b8', type: 'dashed' },

    // SCADA monitoring
    { id: 'wf15', source: 'scada-wind', target: 'string-a', color: '#8b5cf6', type: 'dashed', annotation: 'IEC 61400-25' },
    { id: 'wf16', source: 'scada-wind', target: 'string-b', color: '#8b5cf6', type: 'dashed' },
    { id: 'wf17', source: 'scada-wind', target: 'string-c', color: '#8b5cf6', type: 'dashed' },
    { id: 'wf18', source: 'scada-wind', target: 'oss-switchgear', color: '#8b5cf6', type: 'dashed', annotation: 'IEC 61850' },
    { id: 'wf19', source: 'weather-station', target: 'scada-wind', color: '#06b6d4', type: 'dashed', annotation: 'Met data' },
  ],
};

const solarPlantDiagram: FlowDiagram = {
  title: 'Utility-Scale Solar Plant — 400 MWdc',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== SOLAR ARRAY =====
    { id: 'grp-solar', type: 'group', label: 'Solar Array', style: { color: '#f59e0b' } },

    { id: 'pv-block-a', label: 'PV Block A — 100 MWdc', icon: 'zap',
      description: 'Bifacial N-type modules, single-axis tracking.',
      status: 'online', progress: 88, flowRate: '88 MW',
      parentId: 'grp-solar',
      sections: [
        { heading: 'Modules', content: '166,667x Longi LR5-72HBD-555M' },
        { heading: 'Module Power', content: '555 Wp bifacial' },
        { heading: 'Strings', content: '10,000 strings x 28 modules' },
        { heading: 'Tracking', content: 'GTX single-axis N-S' },
        { heading: 'GHI Today', content: '**6.2 kWh/m2**' },
        { heading: 'Temp', content: 'Cell temp 42 C' },
      ],
      detail: {
        content: 'Block A covers **250 hectares** in the south-west quadrant. All trackers are operational and currently tracking at **35 degrees** elevation.',
        sections: [
          { type: 'keyvalue', title: 'Block A Specifications', data: {
            'DC Capacity': '100 MWdc',
            'Module Type': 'LR5-72HBD-555M bifacial',
            'Tracker': 'Array Technologies DuoMax',
            'Row Pitch': '7.5 m',
            'Coverage': '250 ha',
            'Specific Yield': '1,680 kWh/kWp/yr',
            'PR (Performance Ratio)': '83.4%',
          }},
          { type: 'chart', title: 'Today\'s Generation (MW)', data: {
            type: 'bar', values: [0, 5, 22, 55, 78, 88, 85, 79, 60, 32, 8, 0],
            labels: ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'],
            color: '#f59e0b',
          }},
          { type: 'timeline', title: 'Block A Events', data: [
            { time: '11:04', event: 'Peak output 88 MW achieved', status: 'success' },
            { time: '08:30', event: 'Trackers active, stow angle released', status: 'info' },
            { time: '07:15', event: 'Inverter warm-up sequence', status: 'info' },
            { time: '02:00', event: 'Overnight wind stow deactivated', status: 'success' },
          ]},
        ],
      },
    },

    { id: 'pv-block-b', label: 'PV Block B — 100 MWdc', icon: 'zap',
      description: 'Bifacial N-type modules, single-axis tracking.',
      status: 'online', progress: 86, flowRate: '86 MW',
      parentId: 'grp-solar',
      sections: [
        { heading: 'Modules', content: '166,667x Longi LR5-72HBD-555M' },
        { heading: 'GHI Today', content: '6.1 kWh/m2' },
        { heading: 'Availability', content: '99.6%' },
        { heading: 'Sector', content: 'North-West quadrant' },
      ],
    },

    { id: 'pv-block-c', label: 'PV Block C — 100 MWdc', icon: 'zap',
      description: 'Bifacial N-type modules, fixed tilt 20 degrees.',
      status: 'online', progress: 81, flowRate: '81 MW',
      parentId: 'grp-solar',
      sections: [
        { heading: 'Modules', content: '166,667x JA JAM72S30-555MR' },
        { heading: 'Tilt', content: 'Fixed 20 degrees (terrain constrained)' },
        { heading: 'GHI Today', content: '5.8 kWh/m2' },
        { heading: 'Soiling Loss', content: '1.2% (last cleaned 3 days ago)' },
      ],
    },

    { id: 'pv-block-d', label: 'PV Block D — 100 MWdc', icon: 'zap',
      description: 'Bifacial N-type modules, single-axis tracking.',
      status: 'warning', progress: 72, flowRate: '72 MW',
      parentId: 'grp-solar',
      sections: [
        { heading: 'Modules', content: '166,667x Longi LR5-72HBD-555M' },
        { heading: 'Availability', content: '72.4%' },
        { heading: 'Alert', content: '3 inverter units offline — **maintenance**' },
        { heading: 'Sector', content: 'South-East quadrant' },
      ],
    },

    { id: 'combiner-ab', label: 'Combiner Station AB', icon: 'git-merge',
      description: 'DC combiner and string monitoring for Blocks A and B.',
      status: 'online', flowRate: '174 MW DC',
      parentId: 'grp-solar',
      sections: [
        { heading: 'String Monitoring', content: 'SMA ShadeFix per string' },
        { heading: 'DC Voltage', content: '1000-1500V DC range' },
        { heading: 'Fusing', content: '10A string fuses' },
        { heading: 'Comms', content: 'RS-485 Modbus to SCADA' },
      ],
    },

    { id: 'combiner-cd', label: 'Combiner Station CD', icon: 'git-merge',
      description: 'DC combiner and string monitoring for Blocks C and D.',
      status: 'warning', flowRate: '153 MW DC',
      parentId: 'grp-solar',
    },

    { id: 'string-inv-ab', label: 'String Inverters — AB', icon: 'zap',
      description: 'Distributed string inverters for Blocks A and B.',
      status: 'online', progress: 92, flowRate: '169 MW AC',
      parentId: 'grp-solar',
      sections: [
        { heading: 'Inverters', content: '80x SMA Sunny Tripower 2500 TLEE' },
        { heading: 'Unit Power', content: '2.5 MWac each' },
        { heading: 'Efficiency', content: '98.8% peak CEC' },
        { heading: 'AC Output', content: '690V AC 3-phase' },
        { heading: 'MPPT Range', content: '860-1500V DC' },
      ],
    },

    { id: 'string-inv-cd', label: 'String Inverters — CD', icon: 'zap',
      description: 'Distributed string inverters for Blocks C and D.',
      status: 'warning', progress: 77, flowRate: '148 MW AC',
      parentId: 'grp-solar',
      sections: [
        { heading: 'Inverters', content: '80x SMA Sunny Tripower 2500 TLEE' },
        { heading: 'Online', content: '77 / 80 (3 in maintenance)' },
        { heading: 'AC Output', content: '690V AC 3-phase' },
      ],
    },

    // ===== CENTRAL PLANT =====
    { id: 'grp-plant', type: 'group', label: 'Central Plant', style: { color: '#3b82f6' } },

    { id: 'mv-switchgear', label: 'MV Switchgear — 33kV', icon: 'git-branch',
      description: 'Medium-voltage GIS switchgear collection bus.',
      status: 'online', flowRate: '317 MW AC',
      parentId: 'grp-plant',
      sections: [
        { heading: 'Voltage', content: '33 kV' },
        { heading: 'Configuration', content: 'Single busbar, 12 feeders' },
        { heading: 'Type', content: 'SF6 GIS indoor' },
        { heading: 'Protection', content: 'Diff, OC, earth fault' },
      ],
    },

    { id: 'stepup-xfmr', label: 'Step-Up Transformer', icon: 'transformer',
      description: '33kV to 132kV power transformer.',
      status: 'online', progress: 85, flowRate: '310 MW',
      parentId: 'grp-plant',
      sections: [
        { heading: 'Rating', content: '340 MVA ONAF' },
        { heading: 'HV', content: '132 kV' },
        { heading: 'LV', content: '33 kV' },
        { heading: 'Vector Group', content: 'YNd11' },
        { heading: 'Tap Changer', content: 'OLTC +/-15% 19 steps' },
        { heading: 'Cooling', content: 'ODAF at full load' },
      ],
    },

    { id: 'plant-ctrl', label: 'Plant Controller — PPC', icon: 'layout-dashboard',
      description: 'Park-level Power Plant Controller.',
      status: 'online',
      parentId: 'grp-plant',
      sections: [
        { heading: 'Function', content: 'Active/reactive power dispatch' },
        { heading: 'Grid Code', content: 'BDEW 2018 compliant' },
        { heading: 'Ramp Rate', content: '10% FP/min (active)' },
        { heading: 'Response', content: '<500 ms to TSO setpoint' },
      ],
    },

    // ===== BATTERY STORAGE (BESS) =====
    { id: 'grp-bess', type: 'group', label: 'Battery Energy Storage (BESS)', style: { color: '#8b5cf6' } },

    { id: 'bess-modules', label: 'BESS — 100 MW / 400 MWh', icon: 'battery',
      description: 'Li-ion battery energy storage system.',
      status: 'online', progress: 67, flowRate: '45 MW charge',
      parentId: 'grp-bess',
      sections: [
        { heading: 'Chemistry', content: 'LFP (LiFePO4) prismatic cells' },
        { heading: 'Total Energy', content: '400 MWh usable' },
        { heading: 'Power Rating', content: '100 MW / 4h' },
        { heading: 'SoC', content: '**67%** (268 MWh stored)' },
        { heading: 'Mode', content: 'Charging at 45 MW' },
        { heading: 'Round-trip Eff.', content: '92.5%' },
        { heading: 'Cycles', content: '1,240 of 6,000 rated' },
      ],
    },

    { id: 'bms', label: 'BMS — Battery Management', icon: 'shield-check',
      description: 'Battery Management System with cell balancing.',
      status: 'online',
      parentId: 'grp-bess',
      sections: [
        { heading: 'Cell Balancing', content: 'Active balancing <10mV delta' },
        { heading: 'Max Cell Temp', content: '32.4 C (within limits)' },
        { heading: 'Min Cell Temp', content: '28.1 C' },
        { heading: 'Cell Voltage', content: '3.26V avg (LFP nominal)' },
        { heading: 'Protection', content: 'OVP, UVP, OTP, short circuit' },
      ],
    },

    { id: 'thermal-mgmt', label: 'Thermal Management', icon: 'thermometer',
      description: 'Liquid cooling for battery modules.',
      status: 'online', progress: 42,
      parentId: 'grp-bess',
      sections: [
        { heading: 'Coolant', content: '50/50 glycol/water' },
        { heading: 'Supply Temp', content: '20 C' },
        { heading: 'Return Temp', content: '28 C' },
        { heading: 'HVAC', content: '2x 150kW compressor units' },
        { heading: 'Setpoint', content: '25-30 C operating range' },
      ],
    },

    // ===== GRID INTERFACE =====
    { id: 'grp-grid', type: 'group', label: 'Grid Interface', style: { color: '#22c55e' } },

    { id: 'revenue-meter', label: 'Revenue Meter', icon: 'gauge',
      description: 'Fiscal metering at point of interconnection.',
      status: 'online', flowRate: '310 MW export',
      parentId: 'grp-grid',
      sections: [
        { heading: 'Type', content: 'Landis+Gyr E650 revenue meter' },
        { heading: 'Accuracy', content: 'Class 0.2S (IEC 62053-22)' },
        { heading: 'Metering', content: 'Active, reactive, power factor' },
        { heading: 'Tariff', content: 'Interval data 30-min settlement' },
      ],
    },

    { id: 'poi', label: 'POI — Point of Interconnection', icon: 'zap',
      description: '132kV grid connection point.',
      status: 'online', flowRate: '310 MW',
      style: { color: '#22c55e' },
      parentId: 'grp-grid',
      sections: [
        { heading: 'Voltage', content: '132 kV' },
        { heading: 'Contracted Capacity', content: '320 MW' },
        { heading: 'Grid Operator', content: 'National Grid ESO' },
        { heading: 'Connection Ref.', content: 'TEC 2029/04/SW-001' },
        { heading: 'Reactive Range', content: '+/-60 MVAr (contractual)' },
      ],
    },

    // Weather station
    { id: 'weather-solar', label: 'Weather Station', icon: 'sun',
      description: 'Onsite meteorological monitoring.',
      status: 'online',
      sections: [
        { heading: 'GHI', content: '**812 W/m2** (pyranometer)' },
        { heading: 'DNI', content: '745 W/m2' },
        { heading: 'Ambient Temp', content: '24.1 C' },
        { heading: 'Wind Speed', content: '3.2 m/s (tracker stow: 14 m/s)' },
        { heading: 'Humidity', content: '38%' },
      ],
    },

    // SCADA
    { id: 'scada-solar', label: 'Plant SCADA', icon: 'layout-dashboard',
      description: 'Supervisory control and data acquisition system.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Total DC', content: '**327 MW**' },
        { heading: 'Total AC', content: '**317 MW**' },
        { heading: 'Plant PR', content: '82.1%' },
        { heading: 'BESS SoC', content: '67% / 268 MWh' },
        { heading: 'Irradiance', content: '812 W/m2 avg' },
        { heading: 'Today\'s Gen.', content: '1,840 MWh' },
      ],
    },
  ],
  edges: [
    // PV blocks to combiners
    { id: 'sp1', source: 'pv-block-a', target: 'combiner-ab', color: '#f59e0b', flowAnimation: true, annotation: '88 MW DC', thickness: 3, label: '1500V DC' },
    { id: 'sp2', source: 'pv-block-b', target: 'combiner-ab', color: '#f59e0b', flowAnimation: true, annotation: '86 MW DC', thickness: 3 },
    { id: 'sp3', source: 'pv-block-c', target: 'combiner-cd', color: '#f59e0b', flowAnimation: true, annotation: '81 MW DC', thickness: 3 },
    { id: 'sp4', source: 'pv-block-d', target: 'combiner-cd', color: '#f59e0b', flowAnimation: true, annotation: '72 MW DC', thickness: 2 },

    // Combiners to string inverters
    { id: 'sp5', source: 'combiner-ab', target: 'string-inv-ab', color: '#f59e0b', flowAnimation: true, annotation: '174 MW DC', thickness: 3 },
    { id: 'sp6', source: 'combiner-cd', target: 'string-inv-cd', color: '#f59e0b', flowAnimation: true, annotation: '153 MW DC', thickness: 3 },

    // String inverters to MV switchgear (DC to AC)
    { id: 'sp7', source: 'string-inv-ab', target: 'mv-switchgear', color: '#3b82f6', flowAnimation: true, annotation: '169 MW AC', thickness: 3, label: '690V -> 33kV' },
    { id: 'sp8', source: 'string-inv-cd', target: 'mv-switchgear', color: '#3b82f6', flowAnimation: true, annotation: '148 MW AC', thickness: 3 },

    // BESS to MV switchgear
    { id: 'sp9', source: 'bess-modules', target: 'mv-switchgear', color: '#8b5cf6', flowAnimation: true, annotation: '45 MW', thickness: 2, label: 'BESS AC' },

    // MV switchgear to step-up transformer
    { id: 'sp10', source: 'mv-switchgear', target: 'stepup-xfmr', color: '#3b82f6', flowAnimation: true, annotation: '317 MW', thickness: 4, label: '33kV' },

    // Transformer to revenue meter
    { id: 'sp11', source: 'stepup-xfmr', target: 'revenue-meter', color: '#22c55e', flowAnimation: true, annotation: '132kV', thickness: 4 },

    // Revenue meter to POI
    { id: 'sp12', source: 'revenue-meter', target: 'poi', color: '#22c55e', flowAnimation: true, annotation: '310 MW', thickness: 4 },

    // BMS controls BESS
    { id: 'sp13', source: 'bms', target: 'bess-modules', color: '#8b5cf6', type: 'dashed', annotation: 'Cell mgmt' },

    // Thermal management to BESS
    { id: 'sp14', source: 'thermal-mgmt', target: 'bess-modules', color: '#06b6d4', type: 'dashed', annotation: 'Cooling loop' },

    // Plant controller
    { id: 'sp15', source: 'plant-ctrl', target: 'mv-switchgear', color: '#3b82f6', type: 'dashed', annotation: 'Dispatch' },
    { id: 'sp16', source: 'plant-ctrl', target: 'bess-modules', color: '#8b5cf6', type: 'dashed', annotation: 'BESS setpoint' },

    // Weather station to SCADA
    { id: 'sp17', source: 'weather-solar', target: 'scada-solar', color: '#f59e0b', type: 'dashed', annotation: 'Met data' },

    // SCADA monitoring
    { id: 'sp18', source: 'scada-solar', target: 'string-inv-ab', color: '#8b5cf6', type: 'dashed', annotation: 'IEC 61850' },
    { id: 'sp19', source: 'scada-solar', target: 'string-inv-cd', color: '#8b5cf6', type: 'dashed' },
    { id: 'sp20', source: 'scada-solar', target: 'bms', color: '#8b5cf6', type: 'dashed', annotation: 'BESS telemetry' },
    { id: 'sp21', source: 'scada-solar', target: 'poi', color: '#8b5cf6', type: 'dashed', annotation: 'Grid data' },
    { id: 'sp22', source: 'scada-solar', target: 'plant-ctrl', color: '#8b5cf6', type: 'dashed', annotation: 'TSO setpoints' },
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

const powerSupplyDiagram: FlowDiagram = {
  title: 'ATX Power Supply — Multi-Stage Design',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 12 },
  nodes: [
    // ===== AC INPUT STAGE =====
    { id: 'grp-ac', type: 'group', label: 'AC Input Stage', style: { color: '#ef4444' } },

    { id: 'mains', label: 'J1 — Mains Input', icon: 'connector',
      description: 'IEC C14 inlet connector. 85-264V AC universal input.',
      parentId: 'grp-ac',
      ports: [
        { id: 'L', label: 'L', side: 'left', position: 0.3 },
        { id: 'N', label: 'N', side: 'left', position: 0.7 },
        { id: 'PE', label: 'PE', side: 'bottom', position: 0.5 },
      ],
    },

    { id: 'f1-mov', label: 'F1 / MOV1', icon: 'fuse',
      description: 'T6.3A 250V slow-blow fuse in series with MOV surge suppressor.',
      parentId: 'grp-ac',
      sections: [
        { heading: 'Fuse', content: 'T6.3A 250V ceramic' },
        { heading: 'MOV', content: 'S20K275 — 275V clamping' },
        { heading: 'Function', content: 'Overcurrent and surge protection' },
      ],
    },

    { id: 'emi-filter', label: 'EMI Filter', icon: 'inductor',
      description: 'Common-mode choke + differential-mode filter.',
      parentId: 'grp-ac',
      sections: [
        { heading: 'CM Choke', content: 'L1: 2x 15mH toroid' },
        { heading: 'X Cap', content: 'CX1: 0.47uF X2 class' },
        { heading: 'Y Cap', content: 'CY1/CY2: 2.2nF Y2 class' },
        { heading: 'Attenuation', content: '40dB @ 150kHz' },
      ],
    },

    { id: 'bridge-rect', label: 'BD1 — Bridge Rectifier', icon: 'diode',
      description: 'Full-wave bridge rectifier with bulk capacitor.',
      status: 'online', flowRate: '325V DC',
      parentId: 'grp-ac',
      ports: [
        { id: 'AC1', label: 'AC~', side: 'left', position: 0.3 },
        { id: 'AC2', label: 'AC~', side: 'left', position: 0.7 },
        { id: 'pos', label: '+', side: 'right', position: 0.3 },
        { id: 'neg', label: '-', side: 'right', position: 0.7 },
      ],
      sections: [
        { heading: 'Type', content: 'GBU1506 15A 600V' },
        { heading: 'Vout', content: '~325V DC (230V in)' },
        { heading: 'Bulk Cap', content: 'C1: 470uF 400V electrolytic' },
        { heading: 'Ripple', content: '<5V at full load' },
      ],
    },

    // ===== PFC STAGE =====
    { id: 'grp-pfc', type: 'group', label: 'PFC Stage', style: { color: '#f59e0b' } },

    { id: 'pfc-boost', label: 'PFC Boost Converter', icon: 'inductor',
      description: 'Active power factor correction boost stage.',
      status: 'online', progress: 96, flowRate: '400V DC bus',
      parentId: 'grp-pfc',
      ports: [
        { id: 'in', label: 'Vin', side: 'left', position: 0.5 },
        { id: 'out', label: 'Vout', side: 'right', position: 0.5 },
        { id: 'gate', label: 'G', side: 'bottom', position: 0.5 },
      ],
      sections: [
        { heading: 'Topology', content: 'Continuous conduction mode boost' },
        { heading: 'Inductor', content: 'L2: 200uH, 15A, powder core' },
        { heading: 'MOSFET', content: 'Q1: IPW65R065C7 650V 40A' },
        { heading: 'Diode', content: 'D1: IDH08SG60C SiC 8A 600V' },
        { heading: 'Vout', content: '400V DC regulated' },
        { heading: 'fsw', content: '65 kHz' },
      ],
    },

    { id: 'pfc-ctrl', label: 'PFC Controller — L6599', icon: 'circuit-breaker',
      description: 'Interleaved PFC controller IC with multiplier.',
      parentId: 'grp-pfc',
      sections: [
        { heading: 'IC', content: 'STMicro L6599 or NCP1650' },
        { heading: 'Sensing', content: 'AC voltage + inductor current' },
        { heading: 'THD', content: '<5% total harmonic distortion' },
        { heading: 'PF', content: '>0.99 at full load' },
        { heading: 'OVP', content: '430V threshold' },
      ],
    },

    // ===== DC-DC STAGE =====
    { id: 'grp-dcdc', type: 'group', label: 'DC-DC Converter Stage', style: { color: '#3b82f6' } },

    { id: 'half-bridge', label: 'Q2/Q3 — Half-Bridge LLC', icon: 'transistor-npn',
      description: 'Series-resonant LLC half-bridge converter.',
      status: 'online', progress: 94,
      parentId: 'grp-dcdc',
      ports: [
        { id: 'Vbus', label: 'Vbus', side: 'left', position: 0.3 },
        { id: 'gnd_dc', label: 'GND', side: 'left', position: 0.7 },
        { id: 'sw', label: 'SW', side: 'right', position: 0.5 },
      ],
      sections: [
        { heading: 'Topology', content: 'Half-bridge LLC resonant' },
        { heading: 'Q2', content: 'IPP65R080CFD 650V 21A' },
        { heading: 'Q3', content: 'IPP65R080CFD 650V 21A' },
        { heading: 'Lr (resonant)', content: '18 uH' },
        { heading: 'Cr (resonant)', content: '56 nF' },
        { heading: 'fsw range', content: '80-150 kHz' },
        { heading: 'Efficiency', content: '96.5% at full load' },
      ],
    },

    { id: 'hf-xfmr', label: 'T1 — HF Transformer', icon: 'transformer',
      description: 'High-frequency isolation transformer.',
      status: 'online',
      parentId: 'grp-dcdc',
      ports: [
        { id: 'pri', label: 'Pri', side: 'left', position: 0.5 },
        { id: 'sec1', label: '12V', side: 'right', position: 0.3 },
        { id: 'sec2', label: '5V', side: 'right', position: 0.7 },
      ],
      sections: [
        { heading: 'Core', content: 'Ferrite N87, E65/32/27' },
        { heading: 'Turns Ratio', content: 'Pri:12V = 14:3 / Pri:5V = 14:1.3' },
        { heading: 'Frequency', content: '80-150 kHz (LLC)' },
        { heading: 'Isolation', content: '3kV AC / 4.2kV DC' },
        { heading: 'Power', content: '650W continuous' },
      ],
      detail: {
        content: 'The HF transformer provides galvanic isolation between the 400V DC bus and the low-voltage secondary outputs. The core is designed for minimum flux density at the LLC resonant frequency.',
        sections: [
          { type: 'keyvalue', title: 'Transformer Parameters', data: {
            'Core Material': 'Ferroxcube 3C95 / TDK N87',
            'Core Size': 'E65/32/27 gapped',
            'Primary Turns': '14',
            '12V Winding': '3 turns bifilar',
            '5V Winding': '1.3 turns copper strip',
            'Magnetizing Ind.': 'Lm = 230 uH',
            'Leakage Ind.': 'Llk = 18 uH (forms Lr)',
            'Winding Temp Rise': '<40 C at 650W',
          }},
          { type: 'chart', title: 'Efficiency vs Load (%)', data: {
            type: 'line', values: [85, 90, 93, 95, 96.5, 96.8, 96.5, 95.5, 93],
            labels: ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '100%'],
            color: '#3b82f6',
          }},
        ],
      },
    },

    { id: 'out-rectifier', label: 'D2/D3 — Sync Rectifier', icon: 'diode',
      description: 'Synchronous rectification on secondary side.',
      parentId: 'grp-dcdc',
      sections: [
        { heading: '12V Rect.', content: 'D2: BSC093N10NS3G 100V 50A' },
        { heading: '5V Rect.', content: 'D3: BSC050N10NS3G 100V 100A' },
        { heading: 'Control', content: 'SY8206 synchronous rectifier IC' },
        { heading: 'VF', content: '<5mV on-state (SR mode)' },
      ],
    },

    // ===== OUTPUT STAGE =====
    { id: 'grp-out', type: 'group', label: 'Output Filter & Regulation', style: { color: '#22c55e' } },

    { id: 'out-filter-12v', label: 'L3/C3 — 12V Output Filter', icon: 'inductor',
      description: 'Output LC filter for 12V rail.',
      parentId: 'grp-out',
      sections: [
        { heading: 'Inductor', content: 'L3: 1.2uH, 50A powder core' },
        { heading: 'Cap', content: 'C3: 3x 2200uF 16V low-ESR' },
        { heading: 'Ripple', content: '<15mV pk-pk at 40A load' },
      ],
    },

    { id: 'out-filter-5v', label: 'L4/C4 — 5V Output Filter', icon: 'inductor',
      description: 'Output LC filter for 5V rail.',
      parentId: 'grp-out',
      sections: [
        { heading: 'Inductor', content: 'L4: 0.8uH, 30A' },
        { heading: 'Cap', content: 'C4: 2x 3300uF 10V' },
        { heading: 'Ripple', content: '<10mV pk-pk at 25A load' },
      ],
    },

    { id: 'vdiv-fb', label: 'R5/R6 — Voltage Divider', icon: 'resistor',
      description: 'Feedback voltage divider for 12V regulation.',
      parentId: 'grp-out',
      sections: [
        { heading: 'R5', content: '10 kohm 0.1%' },
        { heading: 'R6', content: '3.48 kohm 0.1%' },
        { heading: 'Vfb', content: '2.5V (TL431 reference)' },
        { heading: 'Gain', content: 'Sets 12.0V +/- 1%' },
      ],
    },

    { id: 'out-12v', label: '+12V Rail Output', icon: 'connector',
      description: '12V output rail terminal.',
      status: 'online', flowRate: '+12V / 40A',
      parentId: 'grp-out',
      style: { color: '#ef4444' },
      sections: [
        { heading: 'Voltage', content: '+12.02 V' },
        { heading: 'Current', content: '40 A (rated)' },
        { heading: 'Power', content: '480 W' },
        { heading: 'Load Reg.', content: '<1% (full to 20% load)' },
        { heading: 'Protection', content: 'OVP 13.8V / OCP 48A' },
      ],
    },

    { id: 'out-5v', label: '+5V Rail Output', icon: 'connector',
      description: '5V output rail terminal.',
      status: 'online', flowRate: '+5V / 25A',
      parentId: 'grp-out',
      style: { color: '#f59e0b' },
      sections: [
        { heading: 'Voltage', content: '+5.02 V' },
        { heading: 'Current', content: '25 A (rated)' },
        { heading: 'Power', content: '125 W' },
        { heading: 'Protection', content: 'OVP 6.0V / OCP 30A' },
      ],
    },

    // ===== CONTROL & FEEDBACK =====
    { id: 'grp-ctrl', type: 'group', label: 'Control and Feedback', style: { color: '#8b5cf6' } },

    { id: 'pwm-ctrl', label: 'U1 — LLC PWM Controller', icon: 'circuit-breaker',
      description: 'Resonant mode LLC controller IC.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      parentId: 'grp-ctrl',
      sections: [
        { heading: 'IC', content: 'NCP1395 / FAN7621' },
        { heading: 'Topology', content: 'Half-bridge LLC driver' },
        { heading: 'DT', content: '180 ns dead-time' },
        { heading: 'Soft Start', content: '8 ms from 150kHz down' },
        { heading: 'OVP', content: 'Latching shutdown' },
        { heading: 'Thermal', content: 'NTC thermistor shutdown >110C' },
      ],
    },

    { id: 'optocoupler', label: 'U2 — Optocoupler', icon: 'diode',
      description: 'PC817 optocoupler for isolated feedback.',
      parentId: 'grp-ctrl',
      sections: [
        { heading: 'Part', content: 'PC817C or FOD817' },
        { heading: 'CTR', content: '100-300%' },
        { heading: 'Isolation', content: '5kV AC' },
        { heading: 'BW', content: '~80 kHz' },
      ],
    },

    { id: 'tl431', label: 'U3 — TL431 Reference', icon: 'diode',
      description: 'Precision shunt regulator for voltage reference.',
      parentId: 'grp-ctrl',
      sections: [
        { heading: 'Part', content: 'TL431C 2.5V' },
        { heading: 'Vref', content: '2.495 V nominal' },
        { heading: 'Temp Coef', content: '30 ppm/C' },
        { heading: 'Loop Comp', content: 'Type-II compensator' },
      ],
    },

    // Net labels
    { id: 'nl-400vdc', type: 'netlabel', label: '400V DC Bus', style: { color: '#ef4444' } },
    { id: 'nl-pgnd', type: 'netlabel', label: 'PGND', style: { color: '#94a3b8' } },
    { id: 'nl-sgnd', type: 'netlabel', label: 'SGND', style: { color: '#06b6d4' } },
  ],
  edges: [
    // AC Input path
    { id: 'ps1', source: 'mains', sourcePort: 'L', target: 'f1-mov', color: '#ef4444', flowAnimation: true, annotation: '230V AC' },
    { id: 'ps2', source: 'f1-mov', target: 'emi-filter', color: '#ef4444', flowAnimation: true, annotation: 'L+N' },
    { id: 'ps3', source: 'emi-filter', target: 'bridge-rect', targetPort: 'AC1', color: '#ef4444', flowAnimation: true, thickness: 2 },
    { id: 'ps4', source: 'mains', sourcePort: 'N', target: 'bridge-rect', targetPort: 'AC2', color: '#94a3b8', flowAnimation: true },

    // Rectified DC to PFC
    { id: 'ps5', source: 'bridge-rect', sourcePort: 'pos', target: 'pfc-boost', targetPort: 'in', color: '#f59e0b', flowAnimation: true, annotation: '325V DC', thickness: 2 },
    { id: 'ps6', source: 'bridge-rect', sourcePort: 'neg', target: 'nl-pgnd', color: '#94a3b8' },

    // PFC boost to 400V DC bus
    { id: 'ps7', source: 'pfc-boost', sourcePort: 'out', target: 'nl-400vdc', color: '#ef4444', flowAnimation: true, annotation: '400V DC', thickness: 3 },
    { id: 'ps8', source: 'nl-400vdc', target: 'half-bridge', targetPort: 'Vbus', color: '#ef4444', flowAnimation: true, thickness: 3 },

    // PFC control
    { id: 'ps9', source: 'pfc-ctrl', target: 'pfc-boost', targetPort: 'gate', color: '#8b5cf6', type: 'dashed', annotation: 'PWM gate' },

    // Half-bridge to transformer
    { id: 'ps10', source: 'half-bridge', sourcePort: 'sw', target: 'hf-xfmr', targetPort: 'pri', color: '#3b82f6', flowAnimation: true, annotation: 'LLC resonant', thickness: 2 },
    { id: 'ps11', source: 'half-bridge', sourcePort: 'gnd_dc', target: 'nl-pgnd', color: '#94a3b8', showJunction: true },

    // Transformer secondaries to rectifier
    { id: 'ps12', source: 'hf-xfmr', sourcePort: 'sec1', target: 'out-rectifier', color: '#22c55e', flowAnimation: true, annotation: '12V AC' },
    { id: 'ps13', source: 'hf-xfmr', sourcePort: 'sec2', target: 'out-rectifier', color: '#f59e0b', flowAnimation: true, annotation: '5V AC' },

    // Rectifier to output filters
    { id: 'ps14', source: 'out-rectifier', target: 'out-filter-12v', color: '#ef4444', flowAnimation: true, annotation: '12V rect.', thickness: 2 },
    { id: 'ps15', source: 'out-rectifier', target: 'out-filter-5v', color: '#f59e0b', flowAnimation: true, annotation: '5V rect.', thickness: 2 },

    // Output filters to terminals
    { id: 'ps16', source: 'out-filter-12v', target: 'out-12v', color: '#ef4444', flowAnimation: true, annotation: '+12V 40A', thickness: 3 },
    { id: 'ps17', source: 'out-filter-5v', target: 'out-5v', color: '#f59e0b', flowAnimation: true, annotation: '+5V 25A', thickness: 2 },

    // Feedback path
    { id: 'ps18', source: 'out-12v', target: 'vdiv-fb', color: '#8b5cf6', type: 'dashed', annotation: 'V sense' },
    { id: 'ps19', source: 'vdiv-fb', target: 'tl431', color: '#8b5cf6', type: 'dashed', annotation: '2.5V ref' },
    { id: 'ps20', source: 'tl431', target: 'optocoupler', color: '#8b5cf6', type: 'dashed', annotation: 'Error signal' },
    { id: 'ps21', source: 'optocoupler', target: 'pwm-ctrl', color: '#8b5cf6', type: 'dashed', annotation: 'Isolated FB' },

    // PWM controller to half-bridge
    { id: 'ps22', source: 'pwm-ctrl', target: 'half-bridge', color: '#8b5cf6', type: 'dashed', annotation: 'HB drive' },

    // Ground references
    { id: 'ps23', source: 'out-12v', target: 'nl-sgnd', color: '#94a3b8', type: 'dashed' },
    { id: 'ps24', source: 'mains', sourcePort: 'PE', target: 'nl-pgnd', color: '#94a3b8', type: 'dashed', annotation: 'Earth' },
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
  const [activeDemo, setActiveDemo] = React.useState<'vertical' | 'wind-farm' | 'solar-plant' | 'datacenter' | 'power-supply' | 'hvdc' | 'showcase' | 'dc-facility' | 'nuclear'>('vertical');
  const [currentDiagram, setCurrentDiagram] = useState<FlowDiagram>(sampleDiagram);
  const demoMap: Record<string, FlowDiagram> = { vertical: sampleDiagram, 'wind-farm': windFarmDiagram, 'solar-plant': solarPlantDiagram, datacenter: datacenterDiagram, 'power-supply': powerSupplyDiagram, hvdc: hvdcDiagram, showcase: showcaseDiagram, 'dc-facility': dcFacilityDiagram, nuclear: nuclearDiagram };
  const baseDiagram = demoMap[activeDemo] || sampleDiagram;
  const diagram = (activeDemo === 'vertical' || activeDemo === 'showcase') ? currentDiagram : baseDiagram;
  const canvasRef = useRef<FlowCanvasRef>(null);

  const handleNodeCollapse = (nodeId: string, collapsed: boolean) => {
    setCurrentDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, branchCollapsed: collapsed } : n),
    }));
  };

  const handleDemoChange = (demo: 'vertical' | 'wind-farm' | 'solar-plant' | 'datacenter' | 'power-supply' | 'hvdc' | 'showcase' | 'dc-facility' | 'nuclear') => {
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
          onClick={() => handleDemoChange('wind-farm')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'wind-farm' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'wind-farm' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Wind Farm
        </button>
        <button
          onClick={() => handleDemoChange('solar-plant')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'solar-plant' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'solar-plant' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Solar Plant
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
          onClick={() => handleDemoChange('power-supply')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: activeDemo === 'power-supply' ? '#e2e8f0' : 'rgba(22,33,62,0.85)',
            color: activeDemo === 'power-supply' ? '#1a1a1a' : '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Power Supply
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
        legend
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
