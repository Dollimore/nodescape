import React, { useRef, useState } from 'react';
import { FlowCanvas } from '../src';
import type { FlowDiagram, SidebarNodeTemplate } from '../src';
import type { FlowCanvasRef } from '../src/FlowCanvas';
import { ProjectView } from '../src/project/ProjectView';
import type { ProjectData } from '../src/project/types';
import { Sidebar } from './Sidebar';

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
    // ===== UTILITY & MAIN POWER =====
    { id: 'grid', type: 'start', label: 'Utility Grid', icon: 'zap', status: 'online', flowRate: '12.4 MW' },
    { id: 'xfmr', label: 'Main Transformer', description: '132kV to 11kV step-down.', icon: 'box', status: 'online', progress: 78,
      sections: [
        { heading: 'Rating', content: '16 MVA ONAN' },
        { heading: 'Impedance', content: '5.75%' },
        { heading: 'Tap', content: '+2 (11.5kV)' },
      ],
    },
    { id: 'swgr', label: 'Main Switchgear', description: '11kV distribution.', icon: 'git-branch', status: 'online',
      sections: [
        { heading: 'Voltage', content: '11kV' },
        { heading: 'Fault Level', content: '25kA' },
      ],
    },

    // ===== UPS SYSTEMS =====
    { id: 'ups-a', label: 'UPS System A', description: '2MW capacity, double conversion.', icon: 'battery-charging', status: 'online', progress: 65, flowRate: '1.3 MW',
      sections: [
        { heading: 'Capacity', content: '2 MW / 2000 kVA' },
        { heading: 'Battery', content: '1500 Ah VRLA, 480V' },
        { heading: 'Runtime', content: '15 min at full load' },
        { heading: 'Efficiency', content: '96.2% ECO mode' },
      ],
      detail: {
        content: 'UPS System A provides conditioned, uninterruptible power to IT Row A. Double conversion topology with active harmonic filter.',
        sections: [
          {
            type: 'trend',
            title: 'Battery Voltage (V) — Last 4 Hours',
            data: { values: [484, 483, 482, 482, 483, 484, 484, 483, 482, 483, 484, 484], labels: ['4h', '3.6h', '3.2h', '2.8h', '2.4h', '2h', '1.6h', '1.2h', '0.8h', '0.4h', '0.1h', 'Now'], color: '#3b82f6', unit: 'V', min: 460, max: 500 },
          },
          {
            type: 'keyvalue',
            title: 'UPS Specifications',
            data: {
              'Model': 'Eaton 9395P',
              'Input Voltage': '480V 3-phase',
              'Output Voltage': '480V 3-phase',
              'Capacity': '2000 kVA / 2000 kW',
              'Battery Type': 'VRLA sealed lead-acid',
              'Battery Strings': '4 strings x 40 cells',
              'Commissioning': '2022-08',
              'Next PM': '2026-08',
            },
          },
        ],
      },
    },
    { id: 'ups-b', label: 'UPS System B', description: '2MW capacity — high load.', icon: 'battery-charging', status: 'warning', progress: 92, flowRate: '1.8 MW',
      sections: [
        { heading: 'Capacity', content: '2 MW' },
        { heading: 'Load', content: '**92%** — approaching threshold' },
        { heading: 'Battery', content: '1500 Ah VRLA, 480V' },
      ],
    },

    // ===== PDUs =====
    { id: 'pdu-a', label: 'PDU Row A', description: 'Power distribution to racks.', icon: 'server', status: 'online', progress: 45,
      sections: [{ heading: 'Circuits', content: '24x 30A branch circuits' }, { heading: 'Metering', content: 'Per-outlet monitoring' }],
    },
    { id: 'pdu-b', label: 'PDU Row B', description: 'Power distribution to racks.', icon: 'server', status: 'online', progress: 71,
      sections: [{ heading: 'Circuits', content: '24x 30A branch circuits' }, { heading: 'Alert', content: 'Load at 71% — monitor closely' }],
    },

    // ===== RACK ROWS =====
    { id: 'rack-row-1', label: 'Rack Row 1', description: 'High-density compute — 20 racks.', icon: 'server', status: 'online', progress: 88, flowRate: '320 kW',
      sections: [
        { heading: 'Racks', content: '20 x 42U' },
        { heading: 'Avg Density', content: '16 kW/rack' },
        { heading: 'Max Density', content: '32 kW/rack' },
        { heading: 'Inlet Temp', content: '22C (target 21C)' },
      ],
      detail: {
        content: 'Row 1 hosts the primary compute cluster: **80 dual-socket servers** running virtualized workloads. Inlet temperature is within spec.',
        sections: [
          {
            type: 'chart',
            title: 'CPU Utilisation (%) — Last 24h',
            data: {
              type: 'bar',
              values: [42, 38, 35, 33, 36, 45, 62, 74, 82, 85, 88, 86, 84, 83, 85, 80, 76, 72, 68, 65, 62, 58, 52, 46],
              labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
              color: '#8b5cf6',
            },
          },
          {
            type: 'keyvalue',
            title: 'Server Specifications',
            data: {
              'Platform': 'Dell PowerEdge R760',
              'CPU': '2x Intel Xeon Platinum 8480+',
              'Cores': '112 cores / 224 threads per server',
              'RAM': '512 GB DDR5 ECC',
              'Storage': '2x 1.92TB NVMe SSD',
              'NICs': '2x 25GbE + 1x 1GbE IPMI',
              'Power Draw': '600W typical / 900W max',
              'OS': 'RHEL 9.3 / VMware ESXi 8',
            },
          },
          {
            type: 'timeline',
            title: 'Recent Deployment Events',
            data: [
              { time: '14:02', event: 'vSphere cluster rebalance completed', status: 'success' },
              { time: '11:30', event: 'Firmware update applied — rack-1-04', status: 'info' },
              { time: '09:15', event: 'New VM batch deployed (x40)', status: 'success' },
              { time: '03:30', event: 'Overnight patch window — 12 servers rebooted', status: 'warning' },
              { time: '00:05', event: 'Backup jobs completed successfully', status: 'success' },
            ],
          },
        ],
      },
    },
    { id: 'rack-row-2', label: 'Rack Row 2', description: 'Storage and network tier — 20 racks.', icon: 'server', status: 'online', progress: 60, flowRate: '180 kW',
      sections: [
        { heading: 'Racks', content: '20 x 42U' },
        { heading: 'Avg Density', content: '9 kW/rack' },
        { heading: 'Inlet Temp', content: '21C' },
      ],
    },

    // ===== BACKUP GENERATOR =====
    { id: 'gen', label: 'Backup Generator', description: '4MW diesel generator.', icon: 'fuel', status: 'idle', flowRate: '0 MW',
      sections: [
        { heading: 'Capacity', content: '4 MW' },
        { heading: 'Fuel', content: 'Diesel — 72h at full load' },
        { heading: 'Start Time', content: '<10s to full load' },
        { heading: 'Last Test', content: '2026-03-10 — PASS' },
      ],
    },

    // ===== NETWORK =====
    { id: 'grp-net', type: 'group', label: 'Network Infrastructure', style: { color: '#22c55e' } },
    { id: 'core-sw', label: 'Core Switch', description: 'Spine layer — dual-homed.', icon: 'network-switch', status: 'online', flowRate: '800 Gbps', parentId: 'grp-net',
      sections: [
        { heading: 'Model', content: 'Arista 7050CX3' },
        { heading: 'Uplinks', content: '8x 100GbE to ISPs' },
        { heading: 'Downlinks', content: '48x 25GbE to ToR switches' },
      ],
      detail: {
        content: 'Core switches form the spine of a leaf-spine Clos architecture. All inter-row traffic traverses the spine layer via ECMP.',
        sections: [
          {
            type: 'keyvalue',
            title: 'Port Utilisation',
            data: {
              'Spine Uplink 1': '82% (82 Gbps)',
              'Spine Uplink 2': '79% (79 Gbps)',
              'ToR Downlinks Avg': '54%',
              'Peak Throughput': '612 Gbps (today)',
              'Packet Loss': '0.00%',
              'Latency (p99)': '28 µs',
            },
          },
          {
            type: 'table',
            title: 'Connected Leaf Switches',
            data: {
              headers: ['Switch', 'Rack Row', 'Uplink Speed', 'Load', 'Status'],
              rows: [
                ['ToR-A1', 'Row 1 (A-side)', '2x 25GbE', '67%', 'Online'],
                ['ToR-A2', 'Row 1 (B-side)', '2x 25GbE', '71%', 'Online'],
                ['ToR-B1', 'Row 2 (A-side)', '2x 25GbE', '44%', 'Online'],
                ['ToR-B2', 'Row 2 (B-side)', '2x 25GbE', '39%', 'Online'],
                ['ToR-OOB', 'OOB Mgmt', '1x 1GbE', '8%', 'Online'],
              ],
            },
          },
        ],
      },
    },
    { id: 'tor-a1', label: 'ToR Switch A1', description: 'Top-of-rack, Row 1 A-side.', icon: 'network-switch', status: 'online', flowRate: '50 Gbps', parentId: 'grp-net' },
    { id: 'tor-b1', label: 'ToR Switch B1', description: 'Top-of-rack, Row 2 A-side.', icon: 'network-switch', status: 'online', flowRate: '22 Gbps', parentId: 'grp-net' },
    { id: 'fw', label: 'Firewall Cluster', description: 'Stateful inspection, HA pair.', icon: 'shield', status: 'online', parentId: 'grp-net',
      sections: [{ heading: 'Model', content: 'Palo Alto PA-5450' }, { heading: 'Throughput', content: '200 Gbps' }],
    },
    { id: 'dns-dhcp', label: 'DNS / DHCP', description: 'Infoblox Grid — dual site.', icon: 'layout-dashboard', status: 'online', parentId: 'grp-net',
      sections: [{ heading: 'DNS Queries/s', content: '28,400' }, { heading: 'DHCP Leases', content: '12,840 active' }],
    },

    // ===== MONITORING & SECURITY =====
    { id: 'grp-mon', type: 'group', label: 'Monitoring & Security', style: { color: '#06b6d4' } },
    { id: 'dcim', label: 'DCIM System', description: 'Data Center Infrastructure Mgmt.', icon: 'layout-dashboard', status: 'online', style: { color: '#06b6d4', glow: true }, parentId: 'grp-mon',
      sections: [
        { heading: 'Platform', content: 'Nlyte DCIM v12' },
        { heading: 'Devices Managed', content: '1,840' },
        { heading: 'PUE (live)', content: '1.38' },
        { heading: 'Power Efficiency', content: '72.5%' },
      ],
    },
    { id: 'env-sensor', label: 'Environmental Sensors', description: 'Temp/humidity per rack row.', icon: 'thermometer', status: 'online', parentId: 'grp-mon',
      sections: [
        { heading: 'Row 1 Inlet', content: '22.1 C / 41% RH' },
        { heading: 'Row 2 Inlet', content: '21.4 C / 43% RH' },
        { heading: 'Hot Aisle', content: '38.2 C' },
        { heading: 'Alert Threshold', content: '27C inlet / 45C hot aisle' },
      ],
    },
    { id: 'cctv', label: 'CCTV & Access Control', description: 'Physical security — all entry points.', icon: 'shield', status: 'online', parentId: 'grp-mon',
      sections: [
        { heading: 'Cameras', content: '64 IP cameras (4K)' },
        { heading: 'Access Points', content: '12 card readers + biometric' },
        { heading: 'Last Breach Attempt', content: 'None in 180 days' },
      ],
    },
    { id: 'fire-suppress', label: 'Fire Suppression', description: 'Pre-action FM-200 system.', icon: 'zap', status: 'online', parentId: 'grp-mon',
      sections: [
        { heading: 'Agent', content: 'FM-200 (HFC-227ea)' },
        { heading: 'Coverage', content: 'All IT halls + UPS rooms' },
        { heading: 'Last Inspection', content: '2026-01-15 — PASS' },
      ],
    },
  ],
  edges: [
    // Main power path
    { id: 'dc1', source: 'grid', target: 'xfmr', flowAnimation: true, color: '#22c55e', thickness: 3,
      measurements: [{ label: 'V', value: '132', unit: 'kV' }, { label: 'P', value: '12.4', unit: 'MW' }],
    },
    { id: 'dc2', source: 'xfmr', target: 'swgr', flowAnimation: true, color: '#22c55e', thickness: 3,
      measurements: [{ label: 'V', value: '11', unit: 'kV' }, { label: 'I', value: '651', unit: 'A' }],
    },
    { id: 'dc3', source: 'swgr', target: 'ups-a', label: 'Feed A', type: 'success', flowAnimation: true, color: '#3b82f6',
      measurements: [{ label: 'P', value: '1.3', unit: 'MW', status: 'normal' as const }],
    },
    { id: 'dc4', source: 'swgr', target: 'ups-b', label: 'Feed B', type: 'success', flowAnimation: true, color: '#3b82f6',
      measurements: [{ label: 'P', value: '1.8', unit: 'MW', status: 'warning' as const }],
    },
    { id: 'dc5', source: 'ups-a', target: 'pdu-a', flowAnimation: true, color: '#3b82f6', annotation: '480V AC' },
    { id: 'dc6', source: 'ups-b', target: 'pdu-b', flowAnimation: true, color: '#f59e0b', annotation: '480V AC' },
    { id: 'dc7', source: 'gen', target: 'swgr', label: 'Backup', type: 'dashed', color: '#94a3b8' },

    // PDU to racks
    { id: 'dc8', source: 'pdu-a', target: 'rack-row-1', flowAnimation: true, color: '#8b5cf6', showJunction: true },
    { id: 'dc9', source: 'pdu-b', target: 'rack-row-1', flowAnimation: true, color: '#8b5cf6', showJunction: true },
    { id: 'dc10', source: 'pdu-a', target: 'rack-row-2', flowAnimation: true, color: '#8b5cf6' },
    { id: 'dc11', source: 'pdu-b', target: 'rack-row-2', flowAnimation: true, color: '#8b5cf6' },

    // Network
    { id: 'dc12', source: 'core-sw', target: 'tor-a1', color: '#22c55e', flowAnimation: true, annotation: '25GbE' },
    { id: 'dc13', source: 'core-sw', target: 'tor-b1', color: '#22c55e', flowAnimation: true, annotation: '25GbE' },
    { id: 'dc14', source: 'tor-a1', target: 'rack-row-1', color: '#22c55e', flowAnimation: true },
    { id: 'dc15', source: 'tor-b1', target: 'rack-row-2', color: '#22c55e', flowAnimation: true },
    { id: 'dc16', source: 'fw', target: 'core-sw', color: '#22c55e', flowAnimation: true, annotation: '100GbE', thickness: 3 },
    { id: 'dc17', source: 'core-sw', target: 'dns-dhcp', color: '#22c55e', type: 'dashed' },

    // Monitoring
    { id: 'dc18', source: 'dcim', target: 'env-sensor', color: '#06b6d4', type: 'dashed', annotation: 'Modbus/SNMP' },
    { id: 'dc19', source: 'dcim', target: 'ups-a', color: '#06b6d4', type: 'dashed' },
    { id: 'dc20', source: 'dcim', target: 'ups-b', color: '#06b6d4', type: 'dashed' },
    { id: 'dc21', source: 'cctv', target: 'rack-row-1', color: '#94a3b8', type: 'dashed', annotation: 'Physical access' },
    { id: 'dc22', source: 'fire-suppress', target: 'rack-row-1', color: '#ef4444', type: 'dashed', annotation: 'FM-200 zone' },
    { id: 'dc23', source: 'fire-suppress', target: 'rack-row-2', color: '#ef4444', type: 'dashed' },
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
    { id: 'nw-statcom', label: 'STATCOM NW', icon: 'zap', description: 'Reactive compensation at offshore PCC.',
      status: 'online', flowRate: '200 MVAr', parentId: 'nw-group',
      sections: [{ heading: 'Type', content: 'VSC-based STATCOM' }, { heading: 'Rating', content: '+/-200 MVAr' }, { heading: 'Function', content: 'Voltage control & reactive support' }],
    },

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
      sections: [
        { heading: 'Type', content: 'LCC Thyristor' },
        { heading: 'DC', content: '+/-800 kV' },
        { heading: 'Firing Angle', content: '15 deg (alpha)' },
        { heading: 'Cooling', content: 'Deionised water' },
      ],
      parentId: 'ne-group',
      detail: {
        content: 'Rectifier Station 1 uses a **12-pulse thyristor LCC** topology fed from two converter transformers with 30-degree phase shift. It is the backbone of the +/-800 kV ultra-HVDC corridor.',
        sections: [
          {
            type: 'trend',
            title: 'Power Transfer (MW) — Last 24h',
            data: {
              values: [2800, 2750, 2700, 2720, 2800, 2900, 3000, 3050, 3000, 2980, 3000, 3000, 2950, 2900, 2950, 3000, 3000, 2980, 2950, 2900, 2850, 2800, 2780, 2800],
              labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
              color: '#ef4444', unit: 'MW', min: 0, max: 3200,
            },
          },
          {
            type: 'keyvalue',
            title: 'Converter Specifications',
            data: {
              'Topology': 'LCC 12-pulse thyristor',
              'DC Voltage': '+/-800 kV',
              'Rated Current': '3750 A',
              'Rated Power': '3000 MW',
              'Firing Angle (alpha)': '15 deg',
              'Overlap Angle (mu)': '22 deg',
              'Valve Groups': '2 x 6-pulse in series',
              'Thyristor Rating': '8500V / 4000A',
              'Cooling': 'Deionised water loop',
              'Commissioning': '2020',
            },
          },
          {
            type: 'timeline',
            title: 'Recent Events',
            data: [
              { time: '11:00', event: 'Power order increased to 3000 MW', status: 'success' },
              { time: '06:30', event: 'Shift changeover — all parameters normal', status: 'info' },
              { time: '03:15', event: 'Temporary derating to 2700 MW (maintenance)', status: 'warning' },
              { time: '00:00', event: 'Steady-state full-power operation', status: 'success' },
            ],
          },
        ],
      },
    },
    { id: 'ne-conv2', label: 'Rectifier Station 2', icon: 'diode', description: 'VSC-MMC bi-directional.',
      status: 'online', progress: 67, flowRate: '1200 MW',
      sections: [{ heading: 'Type', content: 'FB-MMC VSC' }, { heading: 'DC', content: '+/-500 kV' }], parentId: 'ne-group' },
    { id: 'ne-svc', label: 'SVC — NE', icon: 'zap', description: 'Static Var Compensator at 400kV bus.',
      status: 'online', flowRate: '+150 MVAr', parentId: 'ne-group',
      sections: [{ heading: 'Type', content: 'TCR + TSC' }, { heading: 'Rating', content: '+/-300 MVAr' }, { heading: 'Purpose', content: 'Commutation failure prevention' }],
    },

    // ===== DC FAULT DETECTION & PROTECTION =====
    { id: 'prot-group', type: 'group', label: 'DC Protection & Fault Detection', style: { color: '#ef4444' } },
    { id: 'dc-fault1', label: 'DC Fault Detector 1', icon: 'shield', description: 'Travelling-wave fault location — Link 1.',
      status: 'online', parentId: 'prot-group',
      sections: [
        { heading: 'Method', content: 'Travelling wave + di/dt' },
        { heading: 'Reach', content: 'Full 1200km line' },
        { heading: 'Op Time', content: '<1ms detection' },
        { heading: 'Last Trip', content: 'None in 90 days' },
      ],
    },
    { id: 'dc-fault2', label: 'DC Fault Detector 2', icon: 'shield', description: 'Differential protection — Link 2.',
      status: 'online', parentId: 'prot-group',
      sections: [{ heading: 'Method', content: 'Line differential' }, { heading: 'Op Time', content: '<2ms' }],
    },
    { id: 'prot-coord', label: 'Protection Coordination', icon: 'layout-dashboard', description: 'Central HVDC protection logic.',
      status: 'online', style: { color: '#ef4444' }, parentId: 'prot-group',
      sections: [
        { heading: 'Standard', content: 'IEC 60919 / CIGRE B4' },
        { heading: 'Backup', content: 'Teleprotection via OPGW' },
        { heading: 'Comm Latency', content: '<1ms fiber' },
      ],
    },

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
    { id: 'sw-statcom', label: 'STATCOM SW', icon: 'zap', description: 'Dynamic reactive support at SW inverter.',
      status: 'online', flowRate: '+180 MVAr', parentId: 'sw-group',
      sections: [{ heading: 'Type', content: 'FB-MMC STATCOM' }, { heading: 'Rating', content: '+/-250 MVAr' }],
    },

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
      ],
      detail: {
        content: 'The SCADA/EMS manages all four converter stations and the central switching hub. **IEC 61850-90-8** HVDC communication standard is implemented across all substations.',
        sections: [
          {
            type: 'meritorder',
            title: 'Generation Merit Order Dispatch',
            data: [
              { label: 'Nuclear', value: 3200, cost: 12, color: '#8b5cf6' },
              { label: 'Hydro', value: 1200, cost: 18, color: '#06b6d4' },
              { label: 'Offshore Wind', value: 1600, cost: 22, color: '#22c55e' },
              { label: 'Solar', value: 1400, cost: 25, color: '#f59e0b' },
              { label: 'BESS Dispatch', value: 300, cost: 35, color: '#3b82f6' },
            ],
          },
          {
            type: 'loadprofile',
            title: 'System Load Profile — 24h',
            data: {
              values: [5800, 5600, 5400, 5300, 5400, 5700, 6100, 6400, 6600, 6700, 6700, 6650, 6600, 6500, 6450, 6400, 6350, 6300, 6400, 6500, 6600, 6500, 6300, 6000],
              labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
              color: '#8b5cf6', unit: 'MW',
            },
          },
        ],
      },
    },
  ],
  edges: [
    // NW Wind Farm internal
    { id: 'nw1', source: 'nw-wind1', target: 'nw-collect', color: '#22c55e', flowAnimation: true, annotation: '960 MW',
      measurements: [{ label: 'P', value: '960', unit: 'MW' }, { label: 'V', value: '66', unit: 'kV' }],
    },
    { id: 'nw2', source: 'nw-wind2', target: 'nw-collect', color: '#22c55e', flowAnimation: true, annotation: '800 MW',
      measurements: [{ label: 'P', value: '800', unit: 'MW' }],
    },
    { id: 'nw3', source: 'nw-collect', target: 'nw-xfmr', color: '#22c55e', flowAnimation: true, thickness: 3 },
    { id: 'nw4', source: 'nw-xfmr', target: 'nw-conv', color: '#f59e0b', flowAnimation: true, annotation: '320kV AC' },
    { id: 'nw5', source: 'nw-statcom', target: 'nw-collect', color: '#06b6d4', type: 'dashed', annotation: 'Q support' },

    // NE Generation internal
    { id: 'ne1', source: 'ne-nuclear', target: 'ne-bus', color: '#8b5cf6', flowAnimation: true, annotation: '3200 MW', thickness: 4,
      measurements: [{ label: 'P', value: '3200', unit: 'MW' }, { label: 'V', value: '400', unit: 'kV' }],
    },
    { id: 'ne2', source: 'ne-hydro', target: 'ne-bus', color: '#06b6d4', flowAnimation: true, annotation: '1200 MW', thickness: 3,
      measurements: [{ label: 'P', value: '1200', unit: 'MW' }],
    },
    { id: 'ne3', source: 'ne-bus', target: 'ne-xfmr1', color: '#22c55e', flowAnimation: true, thickness: 3, showJunction: true },
    { id: 'ne4', source: 'ne-bus', target: 'ne-xfmr2', color: '#22c55e', flowAnimation: true, thickness: 2, showJunction: true },
    { id: 'ne5', source: 'ne-xfmr1', target: 'ne-conv1', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },
    { id: 'ne6', source: 'ne-xfmr2', target: 'ne-conv2', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },
    { id: 'ne7', source: 'ne-svc', target: 'ne-bus', color: '#06b6d4', type: 'dashed', annotation: 'Q ctrl' },

    // DC Corridors — NE to Hub
    { id: 'dc1a', source: 'ne-conv1', target: 'dc-corridor1-p', color: '#ef4444', flowAnimation: true, annotation: '+800kV', thickness: 5,
      measurements: [{ label: 'V', value: '+800', unit: 'kV', status: 'normal' as const }, { label: 'I', value: '3750', unit: 'A' }, { label: 'P', value: '3000', unit: 'MW' }],
    },
    { id: 'dc1b', source: 'ne-conv1', target: 'dc-corridor1-n', color: '#3b82f6', flowAnimation: true, annotation: '-800kV', thickness: 5,
      measurements: [{ label: 'V', value: '-800', unit: 'kV' }],
    },
    { id: 'dc1c', source: 'dc-corridor1-p', target: 'dc-breaker1', color: '#ef4444', flowAnimation: true, thickness: 5 },
    { id: 'dc1d', source: 'dc-corridor1-n', target: 'dc-breaker1', color: '#3b82f6', flowAnimation: true, thickness: 5 },

    // DC Corridor — NE Conv2 to Hub
    { id: 'dc2a', source: 'ne-conv2', target: 'dc-corridor2', color: '#f59e0b', flowAnimation: true, annotation: '+/-500kV', thickness: 3,
      measurements: [{ label: 'V', value: '500', unit: 'kV' }, { label: 'P', value: '1200', unit: 'MW' }],
    },
    { id: 'dc2b', source: 'dc-corridor2', target: 'dc-breaker2', color: '#f59e0b', flowAnimation: true, thickness: 3 },

    // DC Corridor — NW Offshore to Hub
    { id: 'dc3a', source: 'nw-conv', target: 'dc-corridor3', color: '#22c55e', flowAnimation: true, annotation: '+/-320kV', thickness: 3,
      measurements: [{ label: 'V', value: '320', unit: 'kV' }, { label: 'P', value: '1600', unit: 'MW' }],
    },
    { id: 'dc3b', source: 'dc-corridor3', target: 'dc-breaker3', color: '#22c55e', flowAnimation: true, thickness: 3 },

    // Hub to SW
    { id: 'hub-sw1', source: 'dc-breaker1', target: 'sw-conv', color: '#ef4444', flowAnimation: true, thickness: 4, annotation: '800kV DC',
      measurements: [{ label: 'P', value: '2400', unit: 'MW' }, { label: 'V', value: '800', unit: 'kV' }],
    },
    { id: 'hub-sw2', source: 'dc-breaker2', target: 'sw-conv', color: '#f59e0b', flowAnimation: true, thickness: 3, showJunction: true,
      measurements: [{ label: 'P', value: '400', unit: 'MW' }],
    },

    // Hub to SE
    { id: 'hub-se1', source: 'dc-breaker3', target: 'se-conv', color: '#22c55e', flowAnimation: true, thickness: 3,
      measurements: [{ label: 'P', value: '800', unit: 'MW' }, { label: 'V', value: '320', unit: 'kV' }],
    },
    { id: 'hub-se2', source: 'dc-breaker2', target: 'se-conv', color: '#f59e0b', flowAnimation: true, thickness: 2, showJunction: true,
      measurements: [{ label: 'P', value: '300', unit: 'MW' }],
    },

    // SW internal
    { id: 'sw1', source: 'sw-conv', target: 'sw-xfmr', color: '#f59e0b', flowAnimation: true, annotation: '200kV AC' },
    { id: 'sw2', source: 'sw-xfmr', target: 'sw-bus', color: '#22c55e', flowAnimation: true, annotation: '400kV AC', thickness: 3 },
    { id: 'sw3', source: 'sw-bus', target: 'sw-smelter', color: '#ef4444', flowAnimation: true, annotation: '1200 MW', thickness: 3 },
    { id: 'sw4', source: 'sw-bus', target: 'sw-city', color: '#3b82f6', flowAnimation: true, annotation: '1600 MW', thickness: 3 },
    { id: 'sw5', source: 'sw-statcom', target: 'sw-bus', color: '#06b6d4', type: 'dashed', annotation: 'Q support' },

    // SE internal
    { id: 'se1', source: 'se-solar', target: 'se-bus', color: '#f59e0b', flowAnimation: true, annotation: '1400 MW', thickness: 3,
      measurements: [{ label: 'P', value: '1400', unit: 'MW' }],
    },
    { id: 'se2', source: 'se-bess', target: 'se-bus', color: '#8b5cf6', flowAnimation: true, annotation: '300 MW',
      measurements: [{ label: 'P', value: '300', unit: 'MW' }, { label: 'SoC', value: '62', unit: '%' }],
    },
    { id: 'se3', source: 'se-bus', target: 'se-conv', color: '#22c55e', flowAnimation: true, thickness: 2 },

    // Earth electrodes
    { id: 'gnd1', source: 'ne-conv1', target: 'gnd-ne', color: '#94a3b8', type: 'dashed' },
    { id: 'gnd2', source: 'sw-conv', target: 'gnd-sw', color: '#94a3b8', type: 'dashed' },
    { id: 'gnd3', source: 'se-conv', target: 'gnd-se', color: '#94a3b8', type: 'dashed' },
    { id: 'gnd4', source: 'nw-conv', target: 'gnd-nw', color: '#94a3b8', type: 'dashed' },

    // Protection links
    { id: 'prot1', source: 'dc-fault1', target: 'dc-corridor1-p', color: '#ef4444', type: 'dashed', annotation: 'TW monitor' },
    { id: 'prot2', source: 'dc-fault2', target: 'dc-corridor2', color: '#ef4444', type: 'dashed' },
    { id: 'prot3', source: 'prot-coord', target: 'dc-breaker1', color: '#ef4444', type: 'dashed', annotation: 'Trip signal' },
    { id: 'prot4', source: 'prot-coord', target: 'dc-breaker2', color: '#ef4444', type: 'dashed' },
    { id: 'prot5', source: 'prot-coord', target: 'dc-breaker3', color: '#ef4444', type: 'dashed' },

    // SCADA monitoring links
    { id: 'scada1', source: 'scada', target: 'dc-breaker1', color: '#8b5cf6', type: 'dashed', annotation: 'IEC 61850' },
    { id: 'scada2', source: 'scada', target: 'dc-breaker2', color: '#8b5cf6', type: 'dashed' },
    { id: 'scada3', source: 'scada', target: 'dc-breaker3', color: '#8b5cf6', type: 'dashed' },
    { id: 'scada4', source: 'scada', target: 'ne-conv1', color: '#8b5cf6', type: 'dashed' },
    { id: 'scada5', source: 'scada', target: 'prot-coord', color: '#8b5cf6', type: 'dashed', annotation: 'Protection IED' },
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
          { type: 'trend', title: 'Neutron Flux (% FP) — Last 24h', data: {
            values: [100, 100, 100, 100, 100, 100, 99.8, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 99.9, 100, 100, 100, 100, 100, 100, 100],
            labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
            color: '#ef4444', unit: '% FP', min: 95, max: 101,
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
    { id: 'chem-vol', label: 'CVCS', icon: 'valve', description: 'Chemical & Volume Control System.',
      status: 'online', parentId: 'grp-primary',
      sections: [
        { heading: 'Boron Concentration', content: '850 ppm (boric acid)' },
        { heading: 'pH', content: '7.2 (lithiated)' },
        { heading: 'Dissolved H2', content: '25 cc/kg' },
        { heading: 'Function', content: 'Long-term reactivity control + primary purification' },
      ],
    },

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
      style: { color: '#22c55e' },
      detail: {
        content: 'The main generator is a **hydrogen-cooled turbo-generator** directly coupled to the LP turbine shaft. It operates at 22kV, 50Hz.',
        sections: [
          {
            type: 'keyvalue',
            title: 'Generator Specifications',
            data: {
              'Model': 'Alstom/GE ARABELLE',
              'Rated Output': '1200 MWe',
              'Terminal Voltage': '22 kV',
              'Current': '31,500 A',
              'Power Factor': '0.90 lagging',
              'Frequency': '50.0 Hz',
              'Speed': '1500 rpm (4-pole)',
              'Cooling': 'Hydrogen inner-cooled',
              'Stator Cooling': 'Distilled water',
              'Efficiency': '98.7%',
            },
          },
          {
            type: 'trend',
            title: 'Active Power Output (MWe) — Last 24h',
            data: {
              values: [1200, 1200, 1200, 1200, 1200, 1200, 1198, 1199, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1199, 1200, 1200, 1200, 1200, 1200, 1200, 1200],
              labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
              color: '#22c55e', unit: 'MWe', min: 1100, max: 1250,
            },
          },
        ],
      },
    },
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
      sections: [
        { heading: 'Status', content: 'Standby - all trains available' },
        { heading: 'Trains', content: '4 independent safety trains' },
        { heading: 'Injection Flow', content: '1800 m3/h per train' },
      ],
    },
    { id: 'accumulator', label: 'Accumulators', icon: 'pressurizer', description: 'Passive high-pressure injection tanks.',
      status: 'online', parentId: 'grp-safety',
      sections: [
        { heading: 'Tanks', content: '4 x 50 m3' },
        { heading: 'Pressure', content: '45 bar N2 cover gas' },
        { heading: 'Boron', content: '2500 ppm' },
        { heading: 'Level', content: '100% (ready)' },
      ],
    },
    { id: 'diesel-gen', label: 'Emergency Diesels', icon: 'fuel', description: 'Class 1E safety-grade generators.',
      status: 'idle', parentId: 'grp-safety',
      sections: [
        { heading: 'Units', content: '4 x 6 MVA' },
        { heading: 'Fuel', content: 'Diesel — 72h supply' },
        { heading: 'Start Time', content: '<10s to full load' },
        { heading: 'Last Test', content: '2026-03-01 — PASS' },
      ],
    },
    { id: 'containment', label: 'Containment', icon: 'containment', description: 'Pre-stressed concrete with steel liner.',
      status: 'online', parentId: 'grp-safety',
      sections: [{ heading: 'Pressure', content: '1.01 bar (normal)' }, { heading: 'Leak Rate', content: '<0.1%/day' }] },
    { id: 'spray', label: 'Containment Spray', icon: 'valve', status: 'online', parentId: 'grp-safety' },

    // Radiation Monitoring
    { id: 'grp-rad', type: 'group', label: 'Radiation Monitoring', style: { color: '#ef4444' } },
    { id: 'rad-primary', label: 'Primary Coolant Monitor', icon: 'shield', description: 'Continuous activity monitoring.',
      status: 'online', parentId: 'grp-rad',
      sections: [
        { heading: 'Activity', content: '3.2 x 10^5 Bq/kg (normal)' },
        { heading: 'Cs-137', content: 'ND (below detection limit)' },
        { heading: 'I-131', content: '12 Bq/kg (within limit)' },
        { heading: 'Alert Level', content: '10^7 Bq/kg (fuel failure indicator)' },
      ],
    },
    { id: 'rad-containment', label: 'Containment Area Monitor', icon: 'shield', description: 'In-containment radiation survey.',
      status: 'online', parentId: 'grp-rad',
      sections: [
        { heading: 'Dose Rate', content: '2.1 mSv/h (normal ops)' },
        { heading: 'Alert', content: '>10 mSv/h evacuation zone' },
      ],
    },
    { id: 'rad-stack', label: 'Stack Emission Monitor', icon: 'shield', description: 'Effluent discharge monitoring.',
      status: 'online', parentId: 'grp-rad',
      sections: [
        { heading: 'Noble Gases', content: '< 10^6 Bq/m3' },
        { heading: 'Particulates', content: '< 0.1 Bq/m3' },
        { heading: 'Tritium', content: '< 10^4 Bq/m3' },
      ],
    },

    // Spent Fuel Pool
    { id: 'grp-sfp', type: 'group', label: 'Spent Fuel Pool', style: { color: '#f59e0b' } },
    { id: 'sfp', label: 'Spent Fuel Pool', icon: 'pressurizer', description: 'Underwater storage for discharged assemblies.',
      status: 'online', parentId: 'grp-sfp',
      sections: [
        { heading: 'Capacity', content: '1200 assemblies (wet)' },
        { heading: 'Occupancy', content: '640 assemblies stored' },
        { heading: 'Water Level', content: '7.2 m above top of fuel' },
        { heading: 'Water Temp', content: '32 C' },
        { heading: 'pH', content: '7.4 (borated)' },
      ],
    },
    { id: 'sfp-pump', label: 'SFP Cooling Pump', icon: 'pump', description: 'Forced circulation cooling.',
      status: 'online', progress: 45, parentId: 'grp-sfp',
      sections: [{ heading: 'Flow', content: '1200 m3/h' }, { heading: 'Heat Removal', content: '4.2 MWt' }],
    },
    { id: 'sfp-hx', label: 'SFP Heat Exchanger', icon: 'steam-generator', description: 'Pool water to service water.',
      status: 'online', parentId: 'grp-sfp',
      sections: [{ heading: 'Capacity', content: '5 MWt' }, { heading: 'Coolant', content: 'River water' }],
    },
    { id: 'sfp-level', label: 'SFP Level Monitor', icon: 'thermometer', description: 'Level + temperature instrumentation.',
      status: 'online', parentId: 'grp-sfp',
      sections: [{ heading: 'Level', content: '7.2 m (alarm at 6.0 m)' }, { heading: 'Temp Alarm', content: '>60C' }],
    },

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
      detail: {
        content: 'The Main Control Room is staffed 24/7 by licensed Senior Reactor Operators. All safety parameters are within Tech Spec limits.',
        sections: [
          {
            type: 'loadprofile',
            title: 'Unit 1 Generation Profile — 24h',
            data: {
              values: [1200, 1200, 1200, 1200, 1200, 1200, 1198, 1199, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1199, 1200, 1200, 1200, 1200, 1200, 1200, 1200],
              labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
              color: '#8b5cf6', unit: 'MWe',
            },
          },
          {
            type: 'meritorder',
            title: 'Multi-Unit Dispatch Order',
            data: [
              { label: 'Unit 1 Nuclear', value: 1200, cost: 10, color: '#ef4444' },
              { label: 'Unit 2 Nuclear', value: 1200, cost: 10, color: '#f97316' },
              { label: 'Hydro Peaker', value: 400, cost: 28, color: '#06b6d4' },
              { label: 'Gas Backup', value: 300, cost: 75, color: '#94a3b8' },
            ],
          },
        ],
      },
    },
  ],
  edges: [
    // Primary loop
    { id: 'n1', source: 'reactor', target: 'sg-1', color: '#ef4444', flowAnimation: true, annotation: '325C', thickness: 4,
      measurements: [
        { label: 'T', value: '325', unit: 'C', status: 'normal' as const },
        { label: 'P', value: '155', unit: 'bar' },
        { label: 'F', value: '9400', unit: 'kg/s' },
      ],
    },
    { id: 'n2', source: 'reactor', target: 'sg-2', color: '#ef4444', flowAnimation: true, annotation: '325C', thickness: 4,
      measurements: [
        { label: 'T', value: '325', unit: 'C' },
        { label: 'P', value: '155', unit: 'bar' },
      ],
    },
    { id: 'n3', source: 'sg-1', target: 'rcp-1', color: '#f97316', flowAnimation: true, annotation: '290C' },
    { id: 'n4', source: 'sg-2', target: 'rcp-2', color: '#f97316', flowAnimation: true, annotation: '290C' },
    { id: 'n5', source: 'rcp-1', target: 'reactor', color: '#f97316', flowAnimation: true, thickness: 3 },
    { id: 'n6', source: 'rcp-2', target: 'reactor', color: '#f97316', flowAnimation: true, thickness: 3 },
    { id: 'n7', source: 'pressurizer', target: 'reactor', color: '#ef4444', type: 'dashed', annotation: '155 bar' },
    { id: 'n8', source: 'ctrl-rods', target: 'reactor', color: '#94a3b8', type: 'dashed' },
    { id: 'n8b', source: 'chem-vol', target: 'reactor', color: '#f59e0b', type: 'dashed', annotation: 'Boron/makeup' },

    // Steam side
    { id: 'n9', source: 'sg-1', target: 'msv', color: '#3b82f6', flowAnimation: true, annotation: 'Steam 280C',
      measurements: [{ label: 'T', value: '280', unit: 'C' }, { label: 'P', value: '65', unit: 'bar' }],
    },
    { id: 'n10', source: 'sg-2', target: 'msv', color: '#3b82f6', flowAnimation: true, showJunction: true },
    { id: 'n11', source: 'msv', target: 'hp-turbine', color: '#3b82f6', flowAnimation: true, thickness: 3 },
    { id: 'n12', source: 'hp-turbine', target: 'lp-turbine', color: '#3b82f6', flowAnimation: true, thickness: 3 },
    { id: 'n13', source: 'lp-turbine', target: 'generator', color: '#22c55e', flowAnimation: true, annotation: '1200 MWe', thickness: 4,
      measurements: [
        { label: 'P', value: '1200', unit: 'MWe', status: 'normal' as const },
        { label: 'f', value: '50.0', unit: 'Hz' },
        { label: 'N', value: '1500', unit: 'rpm' },
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
    { id: 'n23', source: 'eccs', target: 'reactor', color: '#8b5cf6', type: 'dashed', annotation: 'Emergency injection' },
    { id: 'n23b', source: 'accumulator', target: 'reactor', color: '#f59e0b', type: 'dashed', annotation: 'High-P injection' },
    { id: 'n23c', source: 'diesel-gen', target: 'eccs', color: '#94a3b8', type: 'dashed', annotation: 'Emergency power' },
    { id: 'n24', source: 'containment', target: 'reactor', color: '#8b5cf6', type: 'dashed' },
    { id: 'n25', source: 'spray', target: 'containment', color: '#8b5cf6', type: 'dashed' },
    { id: 'n26', source: 'reactor', target: 'nl-rad', color: '#ef4444', type: 'dashed' },

    // Radiation monitoring
    { id: 'n26b', source: 'rad-primary', target: 'reactor', color: '#ef4444', type: 'dashed', annotation: 'Activity' },
    { id: 'n26c', source: 'rad-containment', target: 'containment', color: '#ef4444', type: 'dashed' },
    { id: 'n26d', source: 'rad-stack', target: 'grid', color: '#94a3b8', type: 'dashed', annotation: 'Effluent' },

    // Spent fuel pool
    { id: 'n29', source: 'sfp-pump', target: 'sfp', color: '#f59e0b', flowAnimation: true, annotation: 'Pool cooling' },
    { id: 'n30', source: 'sfp', target: 'sfp-hx', color: '#f59e0b', flowAnimation: true },
    { id: 'n31', source: 'sfp-level', target: 'sfp', color: '#94a3b8', type: 'dashed', annotation: 'Level/Temp' },

    // Control room monitoring
    { id: 'n27', source: 'control-room', target: 'reactor', color: '#8b5cf6', type: 'dashed', annotation: 'Monitoring' },
    { id: 'n28', source: 'control-room', target: 'generator', color: '#8b5cf6', type: 'dashed' },
    { id: 'n28b', source: 'control-room', target: 'sfp', color: '#8b5cf6', type: 'dashed', annotation: 'SFP monitor' },
    { id: 'n28c', source: 'control-room', target: 'rad-primary', color: '#8b5cf6', type: 'dashed' },
  ],
};
const gasPipelineDiagram: FlowDiagram = {
  title: 'Natural Gas Pipeline Network',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== PRODUCTION ZONE =====
    { id: 'grp-production', type: 'group', label: 'Production Zone', style: { color: '#22c55e' } },
    {
      id: 'well-1', label: 'Gas Well A-1', icon: 'fuel', description: 'High-pressure natural gas wellhead.',
      status: 'online', progress: 84, flowRate: '12.4 MMscfd', parentId: 'grp-production',
      sections: [
        { heading: 'Wellhead Pressure', content: '3400 psi' },
        { heading: 'Depth', content: '9200 ft' },
        { heading: 'Formation', content: 'Marcellus Shale' },
      ],
    },
    {
      id: 'well-2', label: 'Gas Well A-2', icon: 'fuel', description: 'Medium-pressure wellhead.',
      status: 'online', progress: 71, flowRate: '9.8 MMscfd', parentId: 'grp-production',
      sections: [
        { heading: 'Wellhead Pressure', content: '2900 psi' },
        { heading: 'Depth', content: '8600 ft' },
      ],
    },
    {
      id: 'well-3', label: 'Gas Well A-3', icon: 'fuel', description: 'Lower-rate wellhead — workover scheduled.',
      status: 'warning', progress: 38, flowRate: '4.1 MMscfd', parentId: 'grp-production',
      sections: [
        { heading: 'Wellhead Pressure', content: '1800 psi' },
        { heading: 'Alert', content: 'Liquid loading detected' },
      ],
    },
    {
      id: 'processing-plant', label: 'Gas Processing Plant', icon: 'settings', description: 'Full separation and treatment facility.',
      status: 'online', progress: 79, flowRate: '26.3 MMscfd', parentId: 'grp-production',
      style: { color: '#22c55e' },
      sections: [
        { heading: 'H2S Removal', content: 'Amine scrubbing — 98.7% removal' },
        { heading: 'NGL Extraction', content: 'Cryogenic fractionation — C2+' },
        { heading: 'CO2 Content', content: '<2 mol%' },
        { heading: 'Water Dew Point', content: '-40 degF' },
      ],
      detail: {
        content: 'The processing plant receives **raw wellhead gas** and conditions it to pipeline specification. H2S is removed via amine absorption and NGL fractions are separated cryogenically.',
        sections: [
          { type: 'keyvalue', title: 'Plant Specifications', data: {
            'Inlet Capacity': '30 MMscfd',
            'Inlet Pressure': '600 psi',
            'Outlet Pressure': '850 psi',
            'H2S Spec': '<4 ppm',
            'Water Content': '<7 lb/MMscf',
            'NGL Recovery': '92% ethane',
            'Commissioned': '2019',
          }},
          { type: 'chart', title: 'Daily Throughput (MMscfd)', data: { type: 'bar', values: [24, 26, 25, 27, 26, 28, 26], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], color: '#22c55e' } },
          { type: 'timeline', title: 'Recent Events', data: [
            { time: '06:15', event: 'Amine reboiler startup complete', status: 'success' },
            { time: '04:30', event: 'NGL separator pressure adjusted', status: 'info' },
            { time: 'Yesterday', event: 'H2S scrubber solvent regenerated', status: 'success' },
            { time: '2 days ago', event: 'Inlet slug catcher overflow', status: 'warning' },
          ]},
        ],
      },
    },
    {
      id: 'dehydration', label: 'Dehydration Unit', icon: 'droplets', description: 'TEG glycol dehydration.',
      status: 'online', progress: 88, flowRate: '26.3 MMscfd', parentId: 'grp-production',
      sections: [
        { heading: 'Process', content: 'Triethylene glycol (TEG)' },
        { heading: 'Outlet Dew Point', content: '-50 degF' },
        { heading: 'Glycol Circulation', content: '2.8 gal/lb H2O removed' },
      ],
    },

    // ===== TRANSMISSION =====
    { id: 'grp-transmission', type: 'group', label: 'High-Pressure Transmission', style: { color: '#f59e0b' } },
    {
      id: 'compressor-1', label: 'Compressor Station 1', icon: 'zap', description: 'Gas turbine-driven centrifugal compressor.',
      status: 'online', progress: 82, flowRate: '26.3 MMscfd', parentId: 'grp-transmission',
      sections: [
        { heading: 'Driver', content: 'Solar Turbines Centaur 50' },
        { heading: 'Discharge Pressure', content: '1200 psi' },
        { heading: 'Suction Pressure', content: '850 psi' },
        { heading: 'Utilization', content: '82%' },
      ],
      detail: {
        content: 'Station 1 is the primary inlet compression point. It boosts wellhead-gathered gas from **850 psi to 1200 psi** for long-distance transmission.',
        sections: [
          { type: 'keyvalue', title: 'Compressor Parameters', data: {
            'Driver Type': 'Gas turbine',
            'Rated Power': '5800 HP',
            'Compression Ratio': '1.41:1',
            'Discharge Temp': '140 degF',
            'Unit Run Hours': '14,820 hr',
            'Next Overhaul': '18,000 hr',
          }},
          { type: 'chart', title: 'Station Flow (MMscfd)', data: { type: 'line', values: [22, 24, 25, 26, 26, 27, 26], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], color: '#f59e0b' } },
          { type: 'timeline', title: 'Recent Events', data: [
            { time: '12:00', event: 'Load step — demand increase', status: 'info' },
            { time: '08:45', event: 'Unit 1A at rated speed', status: 'success' },
            { time: 'Yesterday', event: 'Preventive lube oil change', status: 'success' },
            { time: '3 days ago', event: 'Surge event — recycle valve opened', status: 'warning' },
          ]},
        ],
      },
    },
    {
      id: 'pipeline-seg-1', label: 'Transmission Pipeline AB', icon: 'minus', description: '48-inch OD mainline — Segment AB.',
      flowRate: '26.3 MMscfd', parentId: 'grp-transmission',
      sections: [
        { heading: 'Diameter', content: '48 inch OD' },
        { heading: 'Length', content: '62 miles' },
        { heading: 'Operating Pressure', content: '1100 psi' },
        { heading: 'Wall Thickness', content: '0.625 inch, X70 grade' },
      ],
    },
    {
      id: 'metering-1', label: 'Fiscal Metering Station', icon: 'gauge', description: 'Custody transfer measurement.',
      status: 'online', flowRate: '26.3 MMscfd', parentId: 'grp-transmission',
      sections: [
        { heading: 'Meter Type', content: 'Ultrasonic (5-path)' },
        { heading: 'Uncertainty', content: '+/-0.25%' },
        { heading: 'Temperature', content: '58 degF' },
        { heading: 'Pressure', content: '1090 psi' },
      ],
    },
    {
      id: 'compressor-2', label: 'Compressor Station 2', icon: 'zap', description: 'Mid-line booster station.',
      status: 'online', progress: 67, flowRate: '26.3 MMscfd', parentId: 'grp-transmission',
      sections: [
        { heading: 'Driver', content: 'Electric motor + VFD' },
        { heading: 'Discharge Pressure', content: '1150 psi' },
        { heading: 'Utilization', content: '67%' },
      ],
    },
    {
      id: 'pipeline-seg-2', label: 'Transmission Pipeline BC', icon: 'minus', description: '36-inch OD mainline — Segment BC.',
      flowRate: '26.3 MMscfd', parentId: 'grp-transmission',
      sections: [
        { heading: 'Diameter', content: '36 inch OD' },
        { heading: 'Length', content: '48 miles' },
        { heading: 'Operating Pressure', content: '1050 psi' },
      ],
    },
    {
      id: 'compressor-3', label: 'Compressor Station 3', icon: 'zap', description: 'End-of-line delivery compressor.',
      status: 'online', progress: 74, flowRate: '24.8 MMscfd', parentId: 'grp-transmission',
      sections: [
        { heading: 'Driver', content: 'Reciprocating gas engine' },
        { heading: 'Discharge Pressure', content: '600 psi' },
        { heading: 'Utilization', content: '74%' },
      ],
    },

    // ===== DISTRIBUTION =====
    { id: 'grp-distribution', type: 'group', label: 'City Gate & Distribution', style: { color: '#3b82f6' } },
    {
      id: 'city-gate', label: 'City Gate Station', icon: 'building', description: 'Pressure regulation and odorization.',
      status: 'online', flowRate: '18.2 MMscfd', parentId: 'grp-distribution',
      sections: [
        { heading: 'Inlet Pressure', content: '600 psi' },
        { heading: 'Outlet Pressure', content: '60 psi' },
        { heading: 'Odorization', content: 'THT at 0.5 lb/MMscf' },
        { heading: 'Measurement', content: 'Turbine meters — dual-run' },
      ],
    },
    {
      id: 'pressure-reduction', label: 'District Pressure Reduction', icon: 'settings', description: 'Second stage reduction to service pressure.',
      status: 'online', flowRate: '18.2 MMscfd', parentId: 'grp-distribution',
      sections: [
        { heading: 'Outlet Pressure', content: '2 psi' },
        { heading: 'Relief Valve Set', content: '5 psi' },
      ],
    },
    {
      id: 'distribution-network', label: 'Local Distribution Network', icon: 'git-branch', description: 'Low-pressure polyethylene mains.',
      status: 'online', flowRate: '18.2 MMscfd', parentId: 'grp-distribution',
      sections: [
        { heading: 'Customers', content: '42,000 residential + 1800 commercial' },
        { heading: 'Main Length', content: '380 miles PE pipe' },
        { heading: 'System Pressure', content: '0.25 psi' },
      ],
    },

    // ===== STORAGE =====
    { id: 'grp-storage', type: 'group', label: 'Gas Storage', style: { color: '#8b5cf6' } },
    {
      id: 'underground-storage', label: 'Underground Storage', icon: 'database', description: 'Depleted reservoir seasonal storage.',
      status: 'online', progress: 61, flowRate: '4.2 MMscfd inject', parentId: 'grp-storage',
      detail: {
        content: 'The underground storage field uses a **depleted sandstone reservoir** at 4200 ft depth. Current injection season filling for winter peak demand.',
        sections: [
          { type: 'keyvalue', title: 'Storage Field Specifications', data: {
            'Total Capacity': '18.4 Bcf',
            'Working Gas': '12.1 Bcf',
            'Cushion Gas': '6.3 Bcf',
            'Current Inventory': '7.4 Bcf (61%)',
            'Max Injection Rate': '120 MMscfd',
            'Max Withdrawal Rate': '180 MMscfd',
            'Reservoir Depth': '4200 ft',
            'Reservoir Type': 'Depleted sandstone',
          }},
          { type: 'chart', title: 'Storage Inventory (Bcf)', data: { type: 'line', values: [4.1, 4.9, 5.8, 6.3, 6.9, 7.2, 7.4], labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], color: '#8b5cf6' } },
          { type: 'timeline', title: 'Operational Events', data: [
            { time: 'Today', event: 'Injection rate increased to 120 MMscfd', status: 'info' },
            { time: '3 days ago', event: 'Field inspection completed', status: 'success' },
            { time: 'Last week', event: 'Injection compressor 3 returned to service', status: 'success' },
            { time: '2 weeks ago', event: 'Compressor 3 trip — high vibration', status: 'warning' },
          ]},
        ],
      },
      sections: [
        { heading: 'Inventory', content: '7.4 Bcf (61% of working capacity)' },
        { heading: 'Status', content: 'Injection mode — winter fill' },
        { heading: 'Reservoir Pressure', content: '1820 psi' },
      ],
    },
    {
      id: 'lng-peak-shaving', label: 'LNG Peak Shaving Plant', icon: 'thermometer', description: 'Liquefaction and vaporization for peak demand.',
      status: 'idle', progress: 94, flowRate: '0 MMscfd (standby)', parentId: 'grp-storage',
      sections: [
        { heading: 'LNG Storage', content: '2x 1,200,000 gallon tanks' },
        { heading: 'Vaporization Capacity', content: '28 MMscfd' },
        { heading: 'Liquefaction Capacity', content: '6 MMscfd' },
        { heading: 'Fill Level', content: '94% — winter ready' },
      ],
    },

    // SCADA Control Center
    {
      id: 'gas-scada', label: 'Pipeline SCADA', icon: 'layout-dashboard', description: 'Gas Control Center — 24/7 operations.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Total Throughput', content: '26.3 MMscfd' },
        { heading: 'System Pressure', content: 'Normal — all segments' },
        { heading: 'Leak Detection', content: 'No anomalies' },
        { heading: 'On-Call Crew', content: '3 controllers active' },
      ],
    },

    // Net labels
    { id: 'nl-wellhead', type: 'netlabel', label: 'Wellhead Gas (Raw)', style: { color: '#22c55e' } },
    { id: 'nl-sales', type: 'netlabel', label: 'Sales Gas Spec', style: { color: '#f59e0b' } },
  ],
  edges: [
    // Production gathering
    { id: 'gp1', source: 'well-1', target: 'processing-plant', color: '#22c55e', flowAnimation: true, annotation: '12.4 MMscfd', thickness: 2 },
    { id: 'gp2', source: 'well-2', target: 'processing-plant', color: '#22c55e', flowAnimation: true, annotation: '9.8 MMscfd', thickness: 2 },
    { id: 'gp3', source: 'well-3', target: 'processing-plant', color: '#86efac', flowAnimation: true, annotation: '4.1 MMscfd', thickness: 1 },
    { id: 'gp4', source: 'processing-plant', target: 'dehydration', color: '#22c55e', flowAnimation: true, annotation: '26.3 MMscfd', thickness: 3 },
    { id: 'gp5', source: 'dehydration', target: 'nl-wellhead', color: '#22c55e', type: 'dashed' },
    // Transmission
    { id: 'gt1', source: 'dehydration', target: 'compressor-1', color: '#f59e0b', flowAnimation: true, annotation: '850 psi', thickness: 3 },
    { id: 'gt2', source: 'compressor-1', target: 'pipeline-seg-1', color: '#f59e0b', flowAnimation: true, annotation: '1200 psi', thickness: 4 },
    { id: 'gt3', source: 'pipeline-seg-1', target: 'metering-1', color: '#f59e0b', flowAnimation: true, thickness: 4,
      measurements: [
        { label: 'P', value: '1100', unit: 'psi', status: 'normal' as const },
        { label: 'Q', value: '26.3', unit: 'MMscfd' },
      ],
    },
    { id: 'gt4', source: 'metering-1', target: 'compressor-2', color: '#f59e0b', flowAnimation: true, thickness: 3 },
    { id: 'gt5', source: 'compressor-2', target: 'pipeline-seg-2', color: '#f59e0b', flowAnimation: true, annotation: '1150 psi', thickness: 3 },
    { id: 'gt6', source: 'pipeline-seg-2', target: 'compressor-3', color: '#f59e0b', flowAnimation: true, thickness: 3 },
    { id: 'gt7', source: 'compressor-3', target: 'city-gate', color: '#f59e0b', flowAnimation: true, annotation: '600 psi', thickness: 3 },
    { id: 'gt8', source: 'dehydration', target: 'nl-sales', color: '#f59e0b', type: 'dashed' },
    // Storage tap
    { id: 'gs1', source: 'pipeline-seg-2', target: 'underground-storage', color: '#8b5cf6', flowAnimation: true, annotation: '4.2 MMscfd inject', showJunction: true },
    { id: 'gs2', source: 'underground-storage', target: 'compressor-3', color: '#8b5cf6', type: 'dashed', annotation: 'Winter withdrawal' },
    { id: 'gs3', source: 'lng-peak-shaving', target: 'city-gate', color: '#8b5cf6', type: 'dashed', annotation: 'Emergency supply' },
    { id: 'gs4', source: 'metering-1', target: 'lng-peak-shaving', color: '#8b5cf6', type: 'dashed', annotation: 'Liquefaction feed', showJunction: true },
    // Distribution
    { id: 'gd1', source: 'city-gate', target: 'pressure-reduction', color: '#3b82f6', flowAnimation: true, annotation: '60 psi', thickness: 3 },
    { id: 'gd2', source: 'pressure-reduction', target: 'distribution-network', color: '#3b82f6', flowAnimation: true, annotation: '2 psi', thickness: 2 },
    // SCADA monitoring
    { id: 'gc1', source: 'gas-scada', target: 'compressor-1', color: '#8b5cf6', type: 'dashed', annotation: 'RTU/SCADA' },
    { id: 'gc2', source: 'gas-scada', target: 'compressor-2', color: '#8b5cf6', type: 'dashed' },
    { id: 'gc3', source: 'gas-scada', target: 'compressor-3', color: '#8b5cf6', type: 'dashed' },
    { id: 'gc4', source: 'gas-scada', target: 'underground-storage', color: '#8b5cf6', type: 'dashed' },
    { id: 'gc5', source: 'gas-scada', target: 'city-gate', color: '#8b5cf6', type: 'dashed' },
  ],
};

const hydroPlantDiagram: FlowDiagram = {
  title: 'Hydroelectric Power Plant',
  layout: { direction: 'LR', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== RESERVOIR & DAM =====
    { id: 'grp-reservoir', type: 'group', label: 'Reservoir & Dam', style: { color: '#06b6d4' } },
    {
      id: 'reservoir', label: 'Mountain Reservoir', icon: 'droplets', description: 'Upper storage reservoir — seasonal regulation.',
      status: 'online', progress: 73, flowRate: '285 m3/s inflow', parentId: 'grp-reservoir',
      style: { color: '#06b6d4' },
      detail: {
        content: 'The reservoir provides **6 months of active storage** for seasonal flow regulation. Current level is 73% of full supply level, with controlled releases through the powerhouse intake.',
        sections: [
          { type: 'keyvalue', title: 'Reservoir Parameters', data: {
            'Full Supply Level': 'El. 1842 m',
            'Current Level': 'El. 1838.4 m (73%)',
            'Minimum Operating Level': 'El. 1790 m',
            'Total Capacity': '4,820 Mm3',
            'Active Storage': '3,240 Mm3',
            'Surface Area': '48.6 km2',
            'Catchment Area': '1,240 km2',
            'Mean Annual Inflow': '9.2 km3',
          }},
          { type: 'chart', title: 'Water Level (% Full Supply)', data: { type: 'line', values: [88, 82, 76, 73, 71, 68, 73], labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], color: '#06b6d4' } },
          { type: 'timeline', title: 'Reservoir Events', data: [
            { time: 'Today', event: 'Level at 73% — normal operating range', status: 'success' },
            { time: '3 days ago', event: 'Inflow surge from upstream rainfall', status: 'info' },
            { time: 'Last week', event: 'Spillway gates tested — satisfactory', status: 'success' },
            { time: '2 months ago', event: 'Full supply level reached', status: 'info' },
          ]},
        ],
      },
      sections: [
        { heading: 'Current Level', content: 'El. 1838.4 m — 73% full supply' },
        { heading: 'Active Storage', content: '2,365 Mm3 available' },
        { heading: 'Net Inflow', content: '285 m3/s' },
        { heading: 'Evaporation Loss', content: '1.2 m3/s' },
      ],
    },
    {
      id: 'dam', label: 'Concrete Arch Dam', icon: 'shield', description: 'Double-curvature thin arch dam.',
      status: 'online', parentId: 'grp-reservoir',
      sections: [
        { heading: 'Type', content: 'Double-curvature arch' },
        { heading: 'Height', content: '185 m' },
        { heading: 'Crest Length', content: '456 m' },
        { heading: 'Year Commissioned', content: '1994' },
        { heading: 'Seepage Rate', content: '12 L/s — within tolerance' },
      ],
    },
    {
      id: 'spillway', label: 'Gated Spillway', icon: 'git-branch', description: 'Radial gates for flood discharge.',
      status: 'idle', flowRate: '0 m3/s', parentId: 'grp-reservoir',
      sections: [
        { heading: 'Gates', content: '6x radial gates, 12m x 14m each' },
        { heading: 'Design Flood', content: 'PMF 4,200 m3/s' },
        { heading: 'Status', content: 'All gates closed — normal operation' },
        { heading: 'Last Operation', content: '14 days ago — flood event' },
      ],
    },
    {
      id: 'intake', label: 'Power Intake & Penstock', icon: 'arrow-right', description: 'Bellmouth intake with trash racks and penstock.',
      status: 'online', flowRate: '270 m3/s', parentId: 'grp-reservoir',
      sections: [
        { heading: 'Intake Type', content: 'Bellmouth with trash racks' },
        { heading: 'Penstock Diameter', content: '5.8 m steel lined' },
        { heading: 'Gross Head', content: '148 m' },
        { heading: 'Net Head', content: '142.5 m' },
        { heading: 'Flow Rate', content: '90 m3/s per unit' },
      ],
    },

    // ===== POWERHOUSE =====
    { id: 'grp-powerhouse', type: 'group', label: 'Powerhouse', style: { color: '#3b82f6' } },
    {
      id: 'turbine-1', label: 'Francis Turbine 1', icon: 'zap', description: 'Unit 1 — synchronous generating unit.',
      status: 'online', progress: 94, flowRate: '90 m3/s', parentId: 'grp-powerhouse',
      detail: {
        content: 'Francis Turbine Unit 1 is operating at **94% rated output**. The unit has completed 28,400 operating hours since last major overhaul.',
        sections: [
          { type: 'keyvalue', title: 'Turbine Specifications', data: {
            'Type': 'Francis — radial-axial',
            'Runner Diameter': '4.2 m',
            'Rated Output': '120 MW',
            'Current Output': '112.8 MW',
            'Design Head': '142 m',
            'Design Flow': '92 m3/s',
            'Efficiency': '93.4%',
            'Speed': '166.7 RPM',
            'Run Hours': '28,400 hr',
          }},
          { type: 'chart', title: 'Unit Output (MW)', data: { type: 'line', values: [95, 105, 112, 110, 113, 112, 113], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], color: '#3b82f6' } },
          { type: 'timeline', title: 'Unit Events', data: [
            { time: '08:00', event: 'Shift handover — unit normal', status: 'success' },
            { time: 'Yesterday', event: 'Governor fine-tuned for grid regulation', status: 'info' },
            { time: '3 days ago', event: 'Bearing temperature high alarm cleared', status: 'warning' },
            { time: 'Last month', event: '100% load test — satisfactory', status: 'success' },
          ]},
        ],
      },
      sections: [
        { heading: 'Output', content: '112.8 MW (94% of rated)' },
        { heading: 'Efficiency', content: '93.4%' },
        { heading: 'Guide Vane Opening', content: '76%' },
        { heading: 'Vibration', content: '0.08 mm/s — normal' },
      ],
    },
    {
      id: 'turbine-2', label: 'Francis Turbine 2', icon: 'zap', description: 'Unit 2 — synchronous generating unit.',
      status: 'online', progress: 87, flowRate: '83 m3/s', parentId: 'grp-powerhouse',
      sections: [
        { heading: 'Output', content: '104.4 MW (87% of rated)' },
        { heading: 'Efficiency', content: '92.8%' },
        { heading: 'Guide Vane Opening', content: '71%' },
        { heading: 'Run Hours', content: '31,200 hr (overhaul due at 32k)' },
      ],
    },
    {
      id: 'turbine-3', label: 'Francis Turbine 3', icon: 'zap', description: 'Unit 3 — scheduled maintenance.',
      status: 'warning', progress: 0, flowRate: '0 m3/s', parentId: 'grp-powerhouse',
      sections: [
        { heading: 'Status', content: 'Out of service — runner inspection' },
        { heading: 'Return to Service', content: '5 days estimated' },
        { heading: 'Work Scope', content: 'Runner crack repair, seal replacement' },
      ],
    },
    {
      id: 'generator-1', label: 'Generator 1', icon: 'generator', description: '120 MVA salient-pole synchronous generator.',
      status: 'online', progress: 94, flowRate: '112.8 MW', parentId: 'grp-powerhouse',
      detail: {
        content: 'Generator 1 is a **salient-pole synchronous machine** directly coupled to Francis Turbine 1. It supplies active and reactive power to the 11kV busbar.',
        sections: [
          { type: 'keyvalue', title: 'Generator Data', data: {
            'Rated MVA': '133 MVA',
            'Rated MW': '120 MW',
            'Power Factor': '0.9 lag',
            'Terminal Voltage': '11 kV',
            'Current': '6,980 A',
            'Speed': '166.7 RPM',
            'Poles': '36',
            'Exciter Type': 'Brushless static',
          }},
          { type: 'chart', title: 'Active Power (MW)', data: { type: 'bar', values: [108, 110, 113, 111, 113, 112, 113], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], color: '#22c55e' } },
          { type: 'timeline', title: 'Events', data: [
            { time: '06:00', event: 'AVR setpoint adjusted +0.5 kV', status: 'info' },
            { time: 'Yesterday', event: 'Stator winding temperature normal', status: 'success' },
            { time: '2 days ago', event: 'Partial discharge test — pass', status: 'success' },
            { time: '6 months ago', event: 'Major overhaul completed', status: 'info' },
          ]},
        ],
      },
      sections: [
        { heading: 'Active Power', content: '112.8 MW' },
        { heading: 'Reactive Power', content: '28.4 MVAR' },
        { heading: 'Terminal Voltage', content: '11.2 kV' },
        { heading: 'Stator Temperature', content: '72 degC — normal' },
      ],
    },
    {
      id: 'generator-2', label: 'Generator 2', icon: 'generator', description: '120 MVA synchronous generator.',
      status: 'online', progress: 87, flowRate: '104.4 MW', parentId: 'grp-powerhouse',
      sections: [
        { heading: 'Active Power', content: '104.4 MW' },
        { heading: 'Terminal Voltage', content: '11.1 kV' },
        { heading: 'Stator Temperature', content: '68 degC — normal' },
      ],
    },
    {
      id: 'generator-3', label: 'Generator 3', icon: 'generator', description: '120 MVA synchronous generator — offline.',
      status: 'warning', progress: 0, parentId: 'grp-powerhouse',
      sections: [
        { heading: 'Status', content: 'Offline — unit 3 outage' },
        { heading: 'Isolation', content: 'Generator breaker open, earthed' },
      ],
    },
    {
      id: 'stepup-xfmr', label: 'Step-Up Transformer', icon: 'transformer', description: '11kV/220kV generator transformer.',
      status: 'online', flowRate: '217.2 MW', parentId: 'grp-powerhouse',
      sections: [
        { heading: 'Rating', content: '280 MVA ONAN' },
        { heading: 'Ratio', content: '11 / 220 kV' },
        { heading: 'Tap', content: '+2.5% (OLTC pos 7)' },
        { heading: 'Oil Temperature', content: '62 degC — normal' },
      ],
    },
    {
      id: 'busbar', label: 'Switchyard Busbar', icon: 'zap', description: '220kV GIS switchyard — double busbar.',
      status: 'online', parentId: 'grp-powerhouse',
    },

    // ===== ENVIRONMENTAL =====
    { id: 'grp-environmental', type: 'group', label: 'Environmental Systems', style: { color: '#22c55e' } },
    {
      id: 'fish-ladder', label: 'Fish Ladder', icon: 'arrow-up', description: 'Pool-and-weir fish passage facility.',
      status: 'online', flowRate: '2.4 m3/s', parentId: 'grp-environmental',
      sections: [
        { heading: 'Type', content: '42-pool vertical slot fish ladder' },
        { heading: 'Target Species', content: 'Atlantic salmon, sea trout' },
        { heading: 'Passage Count (YTD)', content: '4,820 fish' },
        { heading: 'Status', content: 'Operational — upstream migration active' },
      ],
    },
    {
      id: 'min-flow-valve', label: 'Minimum Flow Release', icon: 'valve', description: 'Bypasses minimum environmental flow.',
      status: 'online', flowRate: '12.6 m3/s', parentId: 'grp-environmental',
      sections: [
        { heading: 'Required Release', content: '12.6 m3/s (regulatory minimum)' },
        { heading: 'Valve Type', content: 'Hollow jet valve DN1200' },
        { heading: 'Control', content: 'Automatic — reservoir level based' },
      ],
    },
    {
      id: 'water-quality', label: 'Water Quality Station', icon: 'gauge', description: 'Downstream monitoring station.',
      status: 'online', parentId: 'grp-environmental',
      sections: [
        { heading: 'DO (Dissolved O2)', content: '8.4 mg/L — good' },
        { heading: 'Temperature', content: '11.2 degC' },
        { heading: 'pH', content: '7.6' },
        { heading: 'Turbidity', content: '3.2 NTU — normal' },
        { heading: 'Transmission', content: 'Data to Environment Agency' },
      ],
    },

    // ===== GRID CONNECTION =====
    { id: 'grp-grid', type: 'group', label: 'Grid Connection', style: { color: '#f59e0b' } },
    {
      id: 'transmission-line', label: '220kV Transmission Line', icon: 'zap', description: '220kV double-circuit overhead line.',
      status: 'online', flowRate: '217.2 MW', parentId: 'grp-grid',
      sections: [
        { heading: 'Voltage', content: '220 kV' },
        { heading: 'Length', content: '34 km to grid substation' },
        { heading: 'Conductor', content: 'ACSR Zebra 2x400mm2' },
        { heading: 'Rating', content: '320 MVA continuous' },
      ],
    },
    {
      id: 'grid-connection', label: 'National Grid', icon: 'zap', description: '220kV national transmission system.',
      status: 'online', flowRate: '217.2 MW', parentId: 'grp-grid',
      style: { color: '#22c55e' },
    },

    // Control Room
    {
      id: 'hydro-control', label: 'Plant Control Room', icon: 'layout-dashboard', description: 'Integrated plant control — 24/7 licensed operators.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Total Output', content: '217.2 MW (Units 1 + 2)' },
        { heading: 'Available Capacity', content: '217.2 / 360 MW (60%)' },
        { heading: 'System Frequency', content: '50.01 Hz' },
        { heading: 'Reservoir Level', content: 'El. 1838.4 m — normal' },
        { heading: 'Unit 3 Status', content: 'Outage — 5 days to return' },
      ],
    },

    // Net labels
    { id: 'nl-tailwater', type: 'netlabel', label: 'Tailwater / Downstream', style: { color: '#06b6d4' } },
    { id: 'nl-220kv', type: 'netlabel', label: '220kV GRID', style: { color: '#22c55e' } },
  ],
  edges: [
    // Water path — reservoir to turbines
    { id: 'hw1', source: 'reservoir', target: 'dam', color: '#06b6d4', flowAnimation: true },
    { id: 'hw2', source: 'dam', target: 'intake', color: '#06b6d4', flowAnimation: true, annotation: '270 m3/s' },
    { id: 'hw3', source: 'intake', target: 'turbine-1', color: '#06b6d4', flowAnimation: true, annotation: '90 m3/s', thickness: 3 },
    { id: 'hw4', source: 'intake', target: 'turbine-2', color: '#06b6d4', flowAnimation: true, annotation: '83 m3/s', thickness: 3, showJunction: true },
    { id: 'hw5', source: 'intake', target: 'turbine-3', color: '#94a3b8', type: 'dashed', annotation: 'Offline' },
    // Spillway
    { id: 'hw6', source: 'reservoir', target: 'spillway', color: '#06b6d4', type: 'dashed', annotation: 'Flood bypass', showJunction: true },
    { id: 'hw7', source: 'spillway', target: 'nl-tailwater', color: '#06b6d4', type: 'dashed' },
    // Environmental flows
    { id: 'henv1', source: 'reservoir', target: 'fish-ladder', color: '#22c55e', type: 'dashed', annotation: '2.4 m3/s', showJunction: true },
    { id: 'henv2', source: 'reservoir', target: 'min-flow-valve', color: '#22c55e', type: 'dashed', annotation: '12.6 m3/s', showJunction: true },
    { id: 'henv3', source: 'min-flow-valve', target: 'nl-tailwater', color: '#22c55e', type: 'dashed' },
    { id: 'henv4', source: 'turbine-1', target: 'water-quality', color: '#06b6d4', type: 'dashed', annotation: 'Tailrace discharge', showJunction: true },
    // Turbine-generator mechanical coupling
    { id: 'hmech1', source: 'turbine-1', target: 'generator-1', color: '#3b82f6', flowAnimation: true, annotation: '112.8 MW', thickness: 3,
      measurements: [
        { label: 'P', value: '112.8', unit: 'MW', status: 'normal' as const },
        { label: 'n', value: '166.7', unit: 'RPM' },
      ],
    },
    { id: 'hmech2', source: 'turbine-2', target: 'generator-2', color: '#3b82f6', flowAnimation: true, annotation: '104.4 MW', thickness: 3 },
    { id: 'hmech3', source: 'turbine-3', target: 'generator-3', color: '#94a3b8', type: 'dashed', annotation: 'Offline' },
    // Electrical — to transformer
    { id: 'hel1', source: 'generator-1', target: 'stepup-xfmr', color: '#22c55e', flowAnimation: true, annotation: '11 kV', thickness: 3,
      measurements: [
        { label: 'P', value: '112.8', unit: 'MW' },
        { label: 'V', value: '11.2', unit: 'kV' },
      ],
    },
    { id: 'hel2', source: 'generator-2', target: 'stepup-xfmr', color: '#22c55e', flowAnimation: true, annotation: '11 kV', thickness: 3, showJunction: true },
    { id: 'hel3', source: 'stepup-xfmr', target: 'busbar', color: '#f59e0b', flowAnimation: true, annotation: '220 kV', thickness: 4,
      measurements: [
        { label: 'P', value: '217.2', unit: 'MW', status: 'normal' as const },
        { label: 'V', value: '220', unit: 'kV' },
      ],
    },
    // Grid export
    { id: 'hgrid1', source: 'busbar', target: 'transmission-line', color: '#f59e0b', flowAnimation: true, thickness: 4, annotation: '217.2 MW' },
    { id: 'hgrid2', source: 'transmission-line', target: 'grid-connection', color: '#f59e0b', flowAnimation: true, thickness: 4 },
    { id: 'hgrid3', source: 'grid-connection', target: 'nl-220kv', color: '#22c55e', type: 'dashed' },
    // Control signals (purple dashed)
    { id: 'hctrl1', source: 'hydro-control', target: 'turbine-1', color: '#8b5cf6', type: 'dashed', annotation: 'Governor' },
    { id: 'hctrl2', source: 'hydro-control', target: 'turbine-2', color: '#8b5cf6', type: 'dashed' },
    { id: 'hctrl3', source: 'hydro-control', target: 'intake', color: '#8b5cf6', type: 'dashed' },
    { id: 'hctrl4', source: 'hydro-control', target: 'reservoir', color: '#8b5cf6', type: 'dashed', annotation: 'Level monitor' },
    { id: 'hctrl5', source: 'hydro-control', target: 'generator-1', color: '#8b5cf6', type: 'dashed' },
    { id: 'hctrl6', source: 'hydro-control', target: 'busbar', color: '#8b5cf6', type: 'dashed', annotation: 'AGC dispatch' },
    // Environmental monitoring
    { id: 'henv5', source: 'water-quality', target: 'hydro-control', color: '#22c55e', type: 'dashed', annotation: 'Quality data' },
  ],
};

const hydrogenDiagram: FlowDiagram = {
  title: 'Green Hydrogen Facility — NEOM Scale',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== RENEWABLE GENERATION =====
    { id: 'grp-renewable', type: 'group', label: 'Renewable Generation', style: { color: '#22c55e' } },

    { id: 'solar-farm', label: 'Solar Farm — 2 GWp', icon: 'solar-panel',
      description: 'Utility-scale bifacial PV array, single-axis tracking.',
      status: 'online', progress: 91, flowRate: '1820 MW',
      parentId: 'grp-renewable',
      sections: [
        { heading: 'Capacity', content: '2000 MWp DC' },
        { heading: 'Modules', content: '3.3M bifacial 600 Wp panels' },
        { heading: 'Current Output', content: '1820 MW AC' },
        { heading: 'Irradiance', content: '7.1 kWh/m2/day (GHI)' },
      ],
      detail: {
        content: 'The solar farm covers **4,000 hectares** and uses single-axis tracking to maximise irradiance capture in the Saudi Arabian desert. Performance ratio is 84%.',
        sections: [
          { type: 'keyvalue', title: 'Solar Farm Specifications', data: {
            'DC Capacity': '2000 MWp',
            'AC Export': '1820 MW',
            'Module Type': 'Bifacial N-type 600 Wp',
            'Tracker': 'Single-axis N-S',
            'Coverage': '4000 ha',
            'Performance Ratio': '84%',
            'Specific Yield': '2100 kWh/kWp/yr',
            'Inverters': '200x 9 MW string inverters',
          }},
          { type: 'chart', title: 'Today\'s Generation Profile (MW)', data: {
            type: 'bar',
            values: [0, 0, 80, 400, 900, 1400, 1700, 1820, 1800, 1750, 1600, 1300, 900, 400, 80, 0],
            labels: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
            color: '#22c55e',
          }},
          { type: 'timeline', title: 'Solar Farm Events', data: [
            { time: '11:04', event: 'Peak output 1820 MW achieved', status: 'success' },
            { time: '08:30', event: 'Trackers released from overnight stow', status: 'info' },
            { time: '06:15', event: 'Inverter warm-up sequence complete', status: 'info' },
            { time: '02:00', event: 'Wind stow protocol deactivated', status: 'success' },
          ]},
        ],
      },
    },

    { id: 'wind-farm', label: 'Wind Farm — 400 MW', icon: 'wind-turbine',
      description: '80x 5 MW onshore wind turbines.',
      status: 'online', progress: 78, flowRate: '312 MW',
      parentId: 'grp-renewable',
      sections: [
        { heading: 'Turbines', content: '80 x 5 MW' },
        { heading: 'Wind Speed', content: '9.4 m/s at hub height' },
        { heading: 'Availability', content: '97.5%' },
        { heading: 'Capacity Factor', content: '38%' },
      ],
    },

    { id: 'grid-battery', label: 'Grid Battery — 500 MWh', icon: 'battery',
      description: '500 MWh BESS for renewable smoothing.',
      status: 'online', progress: 68, flowRate: '±200 MW',
      parentId: 'grp-renewable',
      sections: [
        { heading: 'Energy', content: '500 MWh usable' },
        { heading: 'Power', content: '250 MW charge / 250 MW discharge' },
        { heading: 'State of Charge', content: '68%' },
        { heading: 'Chemistry', content: 'LFP — 4 hour duration' },
        { heading: 'Cycles', content: '1,240 / 6,000 lifetime' },
      ],
    },

    // ===== WATER SUPPLY =====
    { id: 'grp-water', type: 'group', label: 'Water Supply', style: { color: '#06b6d4' } },

    { id: 'seawater-intake', label: 'Seawater Intake', icon: 'flow-meter',
      description: 'Red Sea seawater intake structure.',
      status: 'online', flowRate: '15,000 m3/hr',
      parentId: 'grp-water',
      sections: [
        { heading: 'Flow Rate', content: '15,000 m3/hr' },
        { heading: 'Salinity', content: '42 ppt (Red Sea)' },
        { heading: 'Screen Size', content: '1 mm band screens' },
        { heading: 'Pumps', content: '4x 4000 m3/hr submersible' },
      ],
    },

    { id: 'desalination', label: 'Desalination Plant', icon: 'desalination',
      description: 'Reverse osmosis desalination — 12,000 m3/hr output.',
      status: 'online', progress: 94, flowRate: '12,000 m3/hr',
      parentId: 'grp-water',
      sections: [
        { heading: 'Technology', content: 'SWRO — 2-pass' },
        { heading: 'Output', content: '12,000 m3/hr potable' },
        { heading: 'Recovery', content: '45%' },
        { heading: 'SEC', content: '3.2 kWh/m3' },
        { heading: 'Reject', content: 'Brine returned to sea via diffuser' },
      ],
      detail: {
        content: 'The SWRO plant uses **energy recovery devices** (ERDs) to recapture pressure from the brine stream, achieving a specific energy consumption of 3.2 kWh/m3 — well below the industry average.',
        sections: [
          { type: 'keyvalue', title: 'Desalination Specifications', data: {
            'Technology': 'Seawater RO (SWRO)',
            'Passes': '2-pass for high purity',
            'Capacity': '12,000 m3/hr',
            'Feed Pressure': '65 bar',
            'Membrane Elements': '48,000 x 8-inch spiral wound',
            'Energy Recovery': 'PX pressure exchangers',
            'SEC': '3.2 kWh/m3',
            'Permeate TDS': '<200 mg/L',
          }},
        ],
      },
    },

    { id: 'water-storage', label: 'Purified Water Storage', icon: 'water-purification',
      description: 'Demineralised water buffer tanks — 50,000 m3.',
      status: 'online', progress: 72,
      parentId: 'grp-water',
      sections: [
        { heading: 'Capacity', content: '50,000 m3 total (4 tanks)' },
        { heading: 'Water Quality', content: 'Conductivity <0.1 uS/cm' },
        { heading: 'Current Level', content: '72% (36,000 m3)' },
        { heading: 'Autonomy', content: '~18 hours at full electrolyzer load' },
      ],
    },

    // ===== ELECTROLYSIS PLANT =====
    { id: 'grp-electrolysis', type: 'group', label: 'Electrolysis Plant', style: { color: '#f59e0b' } },

    { id: 'power-conditioning', label: 'Power Conditioning', icon: 'inverter',
      description: 'AC/DC rectification and power quality conditioning.',
      status: 'online', progress: 89, flowRate: '2100 MW DC',
      parentId: 'grp-electrolysis',
      sections: [
        { heading: 'Input', content: '2100 MW AC' },
        { heading: 'Output', content: '2100 MW DC at 1000V' },
        { heading: 'Efficiency', content: '97.8%' },
        { heading: 'Rectifiers', content: '210x 10 MW thyristor rectifiers' },
      ],
    },

    { id: 'pem-electrolyzer', label: 'PEM Electrolyzer Bank', icon: 'pem-electrolyzer',
      description: '500 MW PEM electrolyzer — proton exchange membrane technology.',
      status: 'online', progress: 87, flowRate: '5.8 t H2/hr',
      parentId: 'grp-electrolysis',
      sections: [
        { heading: 'Power Input', content: '500 MW DC' },
        { heading: 'Efficiency', content: '70% (LHV basis)' },
        { heading: 'H2 Output', content: '5.8 t/hr (140 t/day)' },
        { heading: 'Output Pressure', content: '30 bar' },
        { heading: 'Stack Life', content: '80,000 hr design' },
      ],
      detail: {
        content: 'The PEM electrolyzer bank consists of **500 x 1 MW stacks** operating at 70% efficiency on an LHV basis. Proton exchange membrane technology enables rapid response to renewable variability.',
        sections: [
          { type: 'keyvalue', title: 'PEM Electrolyzer Specifications', data: {
            'Rated Power': '500 MW DC',
            'Stacks': '500 x 1 MW PEM stacks',
            'Efficiency (LHV)': '70% (47.6 kWh/kg H2)',
            'H2 Output': '140 tonnes/day',
            'Operating Pressure': '30 bar',
            'Operating Temperature': '60-80C',
            'Water Consumption': '9 L/kg H2',
            'Stack Life': '80,000 hours',
            'Response Time': '<1 second (0-100%)',
            'Manufacturer': 'ITM Power / Nel ASA',
          }},
          { type: 'chart', title: 'H2 Output vs Power Input (t/hr)', data: {
            type: 'line',
            values: [0, 0.6, 1.2, 1.8, 2.4, 3.2, 4.1, 4.9, 5.5, 5.8, 5.8],
            labels: ['0', '50', '100', '150', '200', '250', '300', '350', '400', '450', '500'],
            color: '#f59e0b',
          }},
          { type: 'timeline', title: 'Electrolyzer Events', data: [
            { time: '10:45', event: 'Stack 047 returned to service after maintenance', status: 'success' },
            { time: '08:00', event: 'Morning ramp — full load achieved in 12 s', status: 'success' },
            { time: '06:30', event: 'Renewable power ramping — electrolyzer following', status: 'info' },
            { time: '01:30', event: 'Stack 047 taken offline for planned stack replacement', status: 'warning' },
          ]},
        ],
      },
    },

    { id: 'alk-electrolyzer', label: 'Alkaline Electrolyzer Bank', icon: 'alkaline-electrolyzer',
      description: '1600 MW alkaline electrolyzer — pressurised KOH electrolyte.',
      status: 'online', progress: 92, flowRate: '17.1 t H2/hr',
      parentId: 'grp-electrolysis',
      sections: [
        { heading: 'Power Input', content: '1600 MW DC' },
        { heading: 'Efficiency', content: '68% (LHV basis)' },
        { heading: 'H2 Output', content: '17.1 t/hr (410 t/day)' },
        { heading: 'Electrolyte', content: '30% KOH solution' },
        { heading: 'Output Pressure', content: '10 bar' },
      ],
    },

    // ===== HYDROGEN PROCESSING =====
    { id: 'grp-processing', type: 'group', label: 'Hydrogen Processing', style: { color: '#8b5cf6' } },

    { id: 'h2-compression', label: 'H2 Compression', icon: 'compressor',
      description: 'Multi-stage diaphragm compression to 200 bar.',
      status: 'online', progress: 88, flowRate: '550 t H2/day',
      parentId: 'grp-processing',
      sections: [
        { heading: 'Suction Pressure', content: '10-30 bar (from electrolyzers)' },
        { heading: 'Discharge Pressure', content: '200 bar' },
        { heading: 'Technology', content: 'Diaphragm compressors x12' },
        { heading: 'Power', content: '45 MW (parasitic load)' },
      ],
    },

    { id: 'h2-purification', label: 'H2 Purification (PSA)', icon: 'water-purification',
      description: 'Pressure swing adsorption — 99.999% purity.',
      status: 'online', progress: 95, flowRate: '540 t H2/day',
      parentId: 'grp-processing',
      sections: [
        { heading: 'Technology', content: 'Pressure Swing Adsorption' },
        { heading: 'H2 Purity', content: '99.999% (5N grade)' },
        { heading: 'Recovery', content: '97% yield' },
        { heading: 'Impurity Removal', content: 'O2, N2, H2O, trace gases' },
      ],
    },

    { id: 'h2-storage-tank', label: 'H2 Bulk Storage', icon: 'h2-storage',
      description: '10,000 tonne H2 geological salt cavern storage.',
      status: 'online', progress: 54,
      sections: [
        { heading: 'Type', content: 'Salt cavern geological storage' },
        { heading: 'Capacity', content: '10,000 tonnes H2' },
        { heading: 'Current Level', content: '54% — 5,400 t' },
        { heading: 'Pressure', content: '100-200 bar operating range' },
        { heading: 'Cavern Depth', content: '1,200-1,600 m' },
        { heading: 'Autonomy', content: '~20 days at full output' },
      ],
      detail: {
        content: 'Underground salt cavern storage provides **large-scale seasonal buffer** capacity. The cavern was solution-mined from a halite formation and sealed with cement and steel casing.',
        sections: [
          { type: 'keyvalue', title: 'Storage Specifications', data: {
            'Storage Type': 'Solution-mined salt cavern',
            'Total Capacity': '10,000 tonnes H2',
            'Current Inventory': '5,400 tonnes (54%)',
            'Min Operating Pressure': '100 bar (cushion gas)',
            'Max Operating Pressure': '200 bar',
            'Depth': '1200-1600 m below surface',
            'Cavern Volume': '~300,000 m3',
            'Cycling Frequency': 'Seasonal — ~4 cycles/year',
          }},
          { type: 'chart', title: 'Storage Level (%) — Last 30 Days', data: {
            type: 'line',
            values: [42, 44, 46, 49, 52, 55, 58, 60, 62, 63, 61, 59, 57, 55, 54, 53, 54, 55, 57, 58, 57, 56, 55, 54, 53, 54, 54, 54, 54, 54],
            labels: Array.from({ length: 30 }, (_, i) => String(i + 1)),
            color: '#8b5cf6',
          }},
        ],
      },
    },

    // ===== AMMONIA EXPORT =====
    { id: 'grp-ammonia', type: 'group', label: 'Ammonia Export', style: { color: '#3b82f6' } },

    { id: 'n2-supply', label: 'Air Separation Unit', icon: 'compressor',
      description: 'Cryogenic ASU — nitrogen supply for Haber-Bosch.',
      status: 'online', flowRate: '450 t N2/hr',
      parentId: 'grp-ammonia',
      sections: [
        { heading: 'Technology', content: 'Cryogenic distillation' },
        { heading: 'N2 Output', content: '450 t/hr at 99.99% purity' },
        { heading: 'Power', content: '30 MW (parasitic load)' },
        { heading: 'O2 Byproduct', content: '380 t/hr (exported or vented)' },
      ],
    },

    { id: 'ammonia-synthesis', label: 'Ammonia Synthesis (Haber-Bosch)', icon: 'ammonia-synthesis',
      description: 'Green ammonia synthesis — 1200 t NH3/day.',
      status: 'online', progress: 91, flowRate: '1200 t NH3/day',
      parentId: 'grp-ammonia',
      sections: [
        { heading: 'Technology', content: 'Haber-Bosch with iron catalyst' },
        { heading: 'Temperature', content: '400-500C' },
        { heading: 'Pressure', content: '150-200 bar' },
        { heading: 'NH3 Output', content: '1200 t/day' },
        { heading: 'H2 Consumption', content: '~178 kg H2/t NH3' },
      ],
      detail: {
        content: 'The Haber-Bosch synthesis loop converts **green H2 and N2 into ammonia** over a promoted iron catalyst. Single-pass conversion is ~20%; unreacted gases are recycled.',
        sections: [
          { type: 'keyvalue', title: 'Synthesis Loop Specifications', data: {
            'Technology': 'Haber-Bosch (promoted Fe catalyst)',
            'H2 Feed Rate': '213.6 t/day',
            'N2 Feed Rate': '1254 t/day',
            'NH3 Output': '1200 t/day',
            'Reactor Temp': '400-500C',
            'Reactor Pressure': '150-200 bar',
            'Single-Pass Conversion': '~20%',
            'Loop Efficiency': '>98% with recycle',
            'Catalyst Life': '5-7 years',
          }},
        ],
      },
    },

    { id: 'nh3-storage', label: 'Liquid NH3 Storage', icon: 'h2-storage',
      description: 'Cryogenic liquid ammonia storage tanks — 50,000 t.',
      status: 'online', progress: 61,
      parentId: 'grp-ammonia',
      sections: [
        { heading: 'Capacity', content: '50,000 tonnes NH3 total' },
        { heading: 'Current Level', content: '61% — 30,500 t' },
        { heading: 'Temperature', content: '-33C (atmospheric pressure)' },
        { heading: 'Tanks', content: '5x 10,000 t double-wall cryogenic' },
        { heading: 'Boil-Off', content: '0.04%/day' },
      ],
    },

    { id: 'export-terminal', label: 'Export Terminal', icon: 'lng-terminal',
      description: 'Dedicated green ammonia export jetty — 2 berths.',
      status: 'online',
      parentId: 'grp-ammonia',
      sections: [
        { heading: 'Berths', content: '2x VLAC (Very Large Ammonia Carrier)' },
        { heading: 'Ship Size', content: 'Up to 87,000 m3 VLAC' },
        { heading: 'Loading Rate', content: '3,000 m3/hr per arm' },
        { heading: 'Annual Export', content: '~400,000 t NH3/year' },
        { heading: 'Destinations', content: 'Japan, South Korea, Netherlands' },
      ],
    },

    // ===== HYDROGEN DISTRIBUTION =====
    { id: 'grp-distribution', type: 'group', label: 'Hydrogen Distribution', style: { color: '#ef4444' } },

    { id: 'h2-pipeline', label: 'H2 Transmission Pipeline', icon: 'pipeline',
      description: 'High-pressure H2 pipeline to distribution nodes.',
      status: 'online', flowRate: '120 t H2/day',
      parentId: 'grp-distribution',
      sections: [
        { heading: 'Pressure', content: '100 bar operating' },
        { heading: 'Diameter', content: '24 inch (DN600)' },
        { heading: 'Length', content: '85 km to city gate' },
        { heading: 'Material', content: 'API 5L X70 — H2 compatible' },
        { heading: 'Flow Rate', content: '120 t H2/day' },
      ],
    },

    { id: 'h2-refueling', label: 'H2 Refueling Network', icon: 'h2-refueling',
      description: '20 hydrogen refueling stations across the region.',
      status: 'online', flowRate: '40 t H2/day',
      parentId: 'grp-distribution',
      sections: [
        { heading: 'Stations', content: '20 HRS across NEOM' },
        { heading: 'Dispensing', content: '700 bar for FCEV' },
        { heading: 'Daily Throughput', content: '40 t H2/day' },
        { heading: 'Vehicles Served', content: '~400 FCEVs/day' },
        { heading: 'Dispensing Rate', content: '3-5 min per vehicle' },
      ],
    },

    { id: 'fuel-cell-power', label: 'Fuel Cell Power Plants', icon: 'fuel-cell',
      description: 'Distributed H2 fuel cell plants — 200 MW total.',
      status: 'online', progress: 76, flowRate: '152 MW',
      parentId: 'grp-distribution',
      sections: [
        { heading: 'Total Capacity', content: '200 MW (40x 5 MW PAFC)' },
        { heading: 'Current Output', content: '152 MW (76% load)' },
        { heading: 'Efficiency', content: '48% LHV (electrical)' },
        { heading: 'H2 Consumption', content: '~80 t/day' },
        { heading: 'Heat Recovery', content: 'CHP — district heating integration' },
      ],
    },

    { id: 'h2-scada', label: 'Hydrogen SCADA', icon: 'layout-dashboard',
      description: 'Integrated control and monitoring for the green H2 facility.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Total H2 Production', content: '**550 t/day** (PEM + ALK)' },
        { heading: 'NH3 Export', content: '1200 t/day' },
        { heading: 'Renewable Input', content: '2132 MW' },
        { heading: 'Storage Level', content: 'H2 cavern 54% / NH3 61%' },
        { heading: 'CO2 Avoided', content: '~5,500 t CO2/day vs SMR' },
        { heading: 'Water Consumption', content: '4,950 m3/hr' },
      ],
    },
  ],
  edges: [
    // Renewable power flows (green)
    { id: 'h1', source: 'solar-farm', target: 'grid-battery', color: '#22c55e', flowAnimation: true, annotation: '1820 MW', thickness: 4, label: 'AC power' },
    { id: 'h2', source: 'wind-farm', target: 'grid-battery', color: '#22c55e', flowAnimation: true, annotation: '312 MW', thickness: 2 },
    { id: 'h3', source: 'grid-battery', target: 'power-conditioning', color: '#22c55e', flowAnimation: true, annotation: '2132 MW', thickness: 5, label: 'AC to rectifiers' },

    // Water flows (cyan)
    { id: 'h4', source: 'seawater-intake', target: 'desalination', color: '#06b6d4', flowAnimation: true, annotation: '15,000 m3/hr', thickness: 3 },
    { id: 'h5', source: 'desalination', target: 'water-storage', color: '#06b6d4', flowAnimation: true, annotation: '12,000 m3/hr', thickness: 3, label: 'DI water' },
    { id: 'h6', source: 'water-storage', target: 'pem-electrolyzer', color: '#06b6d4', flowAnimation: true, annotation: '3,000 m3/hr', thickness: 2 },
    { id: 'h7', source: 'water-storage', target: 'alk-electrolyzer', color: '#06b6d4', flowAnimation: true, annotation: '1,950 m3/hr', thickness: 2, showJunction: true },

    // DC power to electrolyzers (amber)
    { id: 'h8', source: 'power-conditioning', target: 'pem-electrolyzer', color: '#f59e0b', flowAnimation: true, annotation: '500 MW DC', thickness: 3, label: '1000V DC' },
    { id: 'h9', source: 'power-conditioning', target: 'alk-electrolyzer', color: '#f59e0b', flowAnimation: true, annotation: '1600 MW DC', thickness: 4, showJunction: true },

    // H2 gas flows (purple)
    { id: 'h10', source: 'pem-electrolyzer', target: 'h2-compression', color: '#8b5cf6', flowAnimation: true, annotation: '30 bar H2', thickness: 2 },
    { id: 'h11', source: 'alk-electrolyzer', target: 'h2-compression', color: '#8b5cf6', flowAnimation: true, annotation: '10 bar H2', thickness: 3, showJunction: true },
    { id: 'h12', source: 'h2-compression', target: 'h2-purification', color: '#8b5cf6', flowAnimation: true, annotation: '200 bar', thickness: 3 },
    { id: 'h13', source: 'h2-purification', target: 'h2-storage-tank', color: '#8b5cf6', flowAnimation: true, annotation: '99.999% H2', thickness: 3, label: 'Pure H2' },

    // H2 to ammonia (blue)
    { id: 'h14', source: 'h2-storage-tank', target: 'ammonia-synthesis', color: '#3b82f6', flowAnimation: true, annotation: '214 t H2/day', thickness: 3 },
    { id: 'h15', source: 'n2-supply', target: 'ammonia-synthesis', color: '#94a3b8', flowAnimation: true, annotation: '1254 t N2/day', thickness: 2 },

    // NH3 flow (blue)
    { id: 'h16', source: 'ammonia-synthesis', target: 'nh3-storage', color: '#3b82f6', flowAnimation: true, annotation: '1200 t NH3/day', thickness: 3, label: '-33C liquid' },
    { id: 'h17', source: 'nh3-storage', target: 'export-terminal', color: '#3b82f6', flowAnimation: true, annotation: 'Ship loading', thickness: 3 },

    // H2 distribution (red)
    { id: 'h18', source: 'h2-storage-tank', target: 'h2-pipeline', color: '#ef4444', flowAnimation: true, annotation: '120 t H2/day', thickness: 2, showJunction: true },
    { id: 'h19', source: 'h2-pipeline', target: 'h2-refueling', color: '#ef4444', flowAnimation: true, annotation: '40 t/day', thickness: 2 },
    { id: 'h20', source: 'h2-pipeline', target: 'fuel-cell-power', color: '#ef4444', flowAnimation: true, annotation: '80 t/day', thickness: 2, showJunction: true },

    // SCADA monitoring
    { id: 'h21', source: 'h2-scada', target: 'pem-electrolyzer', color: '#8b5cf6', type: 'dashed', annotation: 'Control' },
    { id: 'h22', source: 'h2-scada', target: 'alk-electrolyzer', color: '#8b5cf6', type: 'dashed' },
    { id: 'h23', source: 'h2-scada', target: 'h2-storage-tank', color: '#8b5cf6', type: 'dashed', annotation: 'Level/P/T' },
    { id: 'h24', source: 'h2-scada', target: 'ammonia-synthesis', color: '#8b5cf6', type: 'dashed' },
    { id: 'h25', source: 'h2-scada', target: 'grid-battery', color: '#8b5cf6', type: 'dashed', annotation: 'Dispatch' },
  ],
};

const smrDiagram: FlowDiagram = {
  title: 'Small Modular Reactor (SMR) — NuScale / BWRX-300 Class',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    // ===== REACTOR MODULE =====
    { id: 'grp-reactor', type: 'group', label: 'Reactor Module', style: { color: '#ef4444' } },

    { id: 'smr-vessel', label: 'SMR Reactor Vessel', icon: 'smr-reactor',
      description: 'Integral pressurized water SMR — 300 MWe class.',
      status: 'online', progress: 97, flowRate: '900 MWt',
      parentId: 'grp-reactor',
      style: { color: '#ef4444' },
      sections: [
        { heading: 'Type', content: 'Integral PWR — iPWR' },
        { heading: 'Thermal Power', content: '900 MWt' },
        { heading: 'Electric Output', content: '300 MWe' },
        { heading: 'Fuel', content: 'UO2 enriched 4.95%' },
        { heading: 'Enrichment', content: '<5% LEU' },
        { heading: 'Refueling Interval', content: '24 months' },
        { heading: 'Core Inlet Temp', content: '258 C' },
        { heading: 'Core Outlet Temp', content: '310 C' },
        { heading: 'System Pressure', content: '127 bar' },
      ],
      detail: {
        content: 'The SMR vessel integrates the reactor core, primary coolant pumps, and integral steam generators in a single compact pressure vessel. Passive safety systems provide 72-hour grace period without operator action or AC power.',
        sections: [
          { type: 'keyvalue', title: 'Reactor Specifications', data: {
            'Reactor Type': 'Integral PWR (iPWR)',
            'Thermal Power': '900 MWt',
            'Electric Output': '300 MWe net',
            'Fuel Type': 'UO2 ceramic pellets',
            'Enrichment': '4.95% U-235',
            'Fuel Assemblies': '37 assemblies',
            'Refueling Interval': '24 months',
            'Design Lifetime': '60 years',
            'Seismic Design': '0.5g PGA (IBC Zone 4)',
            'Coolant': 'Light water (pressurized)',
            'Moderator': 'Light water + soluble boron',
            'Control': 'CRDM + chemical shim',
          }},
          { type: 'chart', title: 'Load Following Capability (% rated power vs hour)', data: {
            type: 'line',
            values: [100, 100, 80, 60, 50, 60, 80, 100, 100, 100, 90, 75, 60, 75, 90, 100, 100, 100, 95, 80, 70, 80, 95, 100],
            labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
            color: '#ef4444',
          }},
          { type: 'timeline', title: 'Commissioning Milestones', data: [
            { time: '2026-Q1', event: 'First criticality achieved', status: 'success' },
            { time: '2026-Q2', event: 'Power ascension testing complete', status: 'success' },
            { time: '2026-Q3', event: 'Commercial operation declared', status: 'info' },
            { time: '2028-Q1', event: 'First refueling outage scheduled', status: 'info' },
          ]},
        ],
      },
    },

    { id: 'ctrl-rod-drive', label: 'Control Rod Drive Mechanism', icon: 'control-rod',
      description: 'Magnetic jack CRDM — 16 assemblies.',
      status: 'online', progress: 15, flowRate: '15% inserted',
      parentId: 'grp-reactor',
      sections: [
        { heading: 'Type', content: 'Magnetic jack (bottom-mounted)' },
        { heading: 'Assemblies', content: '16 RCCA clusters' },
        { heading: 'Insertion', content: '15% (at power)' },
        { heading: 'Trip Time', content: '<2.2s full insertion' },
        { heading: 'Function', content: 'Reactivity control + shutdown' },
      ],
    },

    { id: 'passive-safety-sys', label: 'Passive Safety Systems', icon: 'passive-safety',
      description: 'Gravity-driven ECCS and passive decay heat removal.',
      status: 'online',
      parentId: 'grp-reactor',
      sections: [
        { heading: 'ECCS', content: 'Gravity-driven core makeup tanks' },
        { heading: 'DHRS', content: 'Passive decay heat removal — natural circulation' },
        { heading: 'Grace Period', content: '72 hours — no AC power or operator action' },
        { heading: 'Containment Cooling', content: 'Passive containment cooling system (PCCS)' },
        { heading: 'Safety Category', content: 'Safety Class 1 — seismically qualified' },
      ],
    },

    { id: 'seismic-isolator', label: 'Seismic Isolation System', icon: 'heat-sink',
      description: 'Lead-rubber bearing isolators beneath reactor building.',
      status: 'online',
      parentId: 'grp-reactor',
      sections: [
        { heading: 'Type', content: 'Lead-rubber bearing (LRB)' },
        { heading: 'Design Basis', content: '0.5g PGA — SSE' },
        { heading: 'Natural Frequency', content: '0.5 Hz (isolated)' },
        { heading: 'Bearings', content: '64 isolator pads' },
      ],
    },

    // ===== PRIMARY HEAT TRANSPORT =====
    { id: 'grp-primary', type: 'group', label: 'Primary Heat Transport', style: { color: '#f59e0b' } },

    { id: 'integral-sg', label: 'Integral Steam Generator', icon: 'steam-generator',
      description: 'Helical coil once-through SG — inside reactor vessel.',
      status: 'online', progress: 94, flowRate: '900 MWt',
      parentId: 'grp-primary',
      sections: [
        { heading: 'Type', content: 'Helical coil once-through' },
        { heading: 'Primary Inlet', content: '310 C' },
        { heading: 'Primary Outlet', content: '258 C' },
        { heading: 'Steam Outlet', content: '295 C / 34 bar' },
        { heading: 'Heat Transfer', content: '900 MWt' },
        { heading: 'Location', content: 'Inside RPV annulus' },
      ],
    },

    { id: 'pressurizer-smr', label: 'Integral Pressurizer', icon: 'pressurizer',
      description: 'Integrated pressurizer at top of reactor vessel.',
      status: 'online', flowRate: '127 bar',
      parentId: 'grp-primary',
      sections: [
        { heading: 'Type', content: 'Integral — top of RPV' },
        { heading: 'Pressure', content: '127 bar operating' },
        { heading: 'Heaters', content: '6x electric immersion heaters' },
        { heading: 'Spray', content: 'Passive spray system' },
      ],
    },

    { id: 'primary-pump', label: 'Primary Coolant Pumps', icon: 'pump',
      description: 'Canned motor pumps — no seals, integrated in vessel.',
      status: 'online', progress: 88,
      parentId: 'grp-primary',
      sections: [
        { heading: 'Type', content: 'Canned motor — no shaft seals' },
        { heading: 'Quantity', content: '4 pumps' },
        { heading: 'Flow', content: '4,700 kg/s total' },
        { heading: 'Head', content: '35 m' },
        { heading: 'Power', content: '1.4 MW per pump' },
      ],
    },

    // ===== POWER CONVERSION =====
    { id: 'grp-power', type: 'group', label: 'Power Conversion', style: { color: '#3b82f6' } },

    { id: 'steam-drum-smr', label: 'Steam Drum', icon: 'steam-drum',
      description: 'Steam / moisture separation before turbine.',
      status: 'online', flowRate: '34 bar',
      parentId: 'grp-power',
      sections: [
        { heading: 'Steam Pressure', content: '34 bar saturated' },
        { heading: 'Steam Temp', content: '240 C' },
        { heading: 'Moisture', content: '<0.1% carryover' },
        { heading: 'Flow', content: '480 kg/s' },
      ],
    },

    { id: 'hp-turbine-smr', label: 'HP Turbine', icon: 'turbine',
      description: 'High pressure impulse-reaction turbine stage.',
      status: 'online', progress: 92,
      parentId: 'grp-power',
      sections: [
        { heading: 'Inlet Pressure', content: '34 bar' },
        { heading: 'Inlet Temp', content: '240 C (wet steam)' },
        { heading: 'Outlet Pressure', content: '8 bar' },
        { heading: 'Speed', content: '1500 rpm (50 Hz)' },
      ],
    },

    { id: 'lp-turbine-smr', label: 'LP Turbine', icon: 'turbine',
      description: 'Low pressure condensing turbine stage.',
      status: 'online', progress: 90,
      parentId: 'grp-power',
      sections: [
        { heading: 'Inlet Pressure', content: '8 bar' },
        { heading: 'Exhaust Pressure', content: '0.06 bar' },
        { heading: 'Last Stage Blade', content: '1.2 m' },
        { heading: 'Speed', content: '1500 rpm' },
      ],
    },

    { id: 'generator-smr', label: 'Generator', icon: 'generator',
      description: 'Air-cooled turbo-generator — 300 MWe.',
      status: 'online', flowRate: '300 MWe', progress: 97,
      parentId: 'grp-power',
      style: { color: '#22c55e' },
      sections: [
        { heading: 'Rated Output', content: '300 MWe' },
        { heading: 'Terminal Voltage', content: '15 kV' },
        { heading: 'Power Factor', content: '0.95 lagging' },
        { heading: 'Frequency', content: '50 Hz' },
        { heading: 'Cooling', content: 'Air cooled (TEWAC)' },
        { heading: 'Speed', content: '1500 rpm (4-pole)' },
      ],
    },

    { id: 'condenser-smr', label: 'Condenser', icon: 'condenser',
      description: 'Surface condenser — air-cooled indirect cycle.',
      status: 'online',
      parentId: 'grp-power',
      sections: [
        { heading: 'Type', content: 'Surface condenser — shell and tube' },
        { heading: 'Vacuum', content: '0.06 bar absolute' },
        { heading: 'Condensate Temp', content: '36 C' },
        { heading: 'Cooling', content: 'Secondary water circuit' },
      ],
    },

    { id: 'feedwater', label: 'Feedwater System', icon: 'pump',
      description: 'Condensate extraction, deaeration, and high-pressure feed.',
      status: 'online',
      parentId: 'grp-power',
      sections: [
        { heading: 'Condensate Flow', content: '480 kg/s' },
        { heading: 'Deaerator', content: '3.5 bar (oxygen removal)' },
        { heading: 'Feed Temp', content: '180 C (to SG inlet)' },
        { heading: 'HP Heaters', content: '3 stages' },
      ],
    },

    // ===== AUXILIARY SYSTEMS =====
    { id: 'grp-aux', type: 'group', label: 'Auxiliary Systems', style: { color: '#8b5cf6' } },

    { id: 'passive-cooling', label: 'Passive Containment Cooling', icon: 'passive-safety',
      description: 'Natural-circulation air cooling — ultimate heat sink.',
      status: 'online',
      parentId: 'grp-aux',
      sections: [
        { heading: 'Mechanism', content: 'Natural air convection — no pumps' },
        { heading: 'Heat Removal', content: 'Up to 15 MWt decay heat' },
        { heading: 'Capacity', content: '72 hours autonomous operation' },
        { heading: 'Activation', content: 'Passive — no signals required' },
      ],
    },

    { id: 'emerg-water', label: 'Emergency Core Makeup', icon: 'heat-sink',
      description: 'Gravity-fed borated water tanks — passive injection.',
      status: 'online',
      parentId: 'grp-aux',
      sections: [
        { heading: 'Volume', content: '2x 200 m3 tanks' },
        { heading: 'Boron', content: '2500 ppm' },
        { heading: 'Driving Force', content: 'Gravity (elevated tanks)' },
        { heading: 'Injection Pressure', content: 'Differential — no pump needed' },
        { heading: 'Coverage', content: '72 hours injection' },
      ],
    },

    { id: 'diesel-gen-smr', label: 'Emergency Diesel Generators', icon: 'fuel',
      description: 'Class 1E diesels for non-passive loads.',
      status: 'idle',
      parentId: 'grp-aux',
      sections: [
        { heading: 'Units', content: '2x 2 MVA (N+1)' },
        { heading: 'Fuel Supply', content: 'Diesel — 7 days' },
        { heading: 'Start Time', content: '<10s' },
        { heading: 'Last Test', content: '2026-03-15 — PASS' },
        { heading: 'Note', content: 'Non-safety loads only — passive systems require no AC' },
      ],
    },

    { id: 'spent-fuel-pool', label: 'Spent Fuel Pool', icon: 'pressurizer',
      description: 'Elevated pool — passive cooling by natural convection.',
      status: 'online',
      parentId: 'grp-aux',
      sections: [
        { heading: 'Capacity', content: '600 assemblies (10 years)' },
        { heading: 'Occupancy', content: '37 assemblies (1 cycle)' },
        { heading: 'Cooling', content: 'Passive convection — no pump needed' },
        { heading: 'Water Depth', content: '6 m above top of fuel' },
        { heading: 'Temp', content: '28 C' },
        { heading: 'Boron', content: '2200 ppm' },
      ],
    },

    // ===== COOLING TOWER =====
    { id: 'cooling-tower-smr', label: 'Dry Cooling Towers', icon: 'cooling-tower',
      description: 'Air-cooled heat rejection — no river or sea water required.',
      status: 'online', progress: 70,
      sections: [
        { heading: 'Type', content: 'Induced-draft dry cooling (ACC)' },
        { heading: 'Capacity', content: '620 MWt rejection' },
        { heading: 'Water Use', content: 'Zero process water discharge' },
        { heading: 'Fan Power', content: '8 MW total' },
        { heading: 'Design Temp', content: '45 C ambient (max)' },
      ],
    },

    // ===== GRID & HYDROGEN =====
    { id: 'grp-grid', type: 'group', label: 'Grid and Hydrogen Coproduction', style: { color: '#22c55e' } },

    { id: 'main-transformer', label: 'Main Step-Up Transformer', icon: 'transformer',
      description: '15kV to 400kV generator step-up.',
      status: 'online', flowRate: '300 MWe',
      parentId: 'grp-grid',
      sections: [
        { heading: 'Rating', content: '330 MVA ONAN' },
        { heading: 'HV', content: '400 kV' },
        { heading: 'LV', content: '15 kV' },
        { heading: 'Vector Group', content: 'YNd11' },
        { heading: 'Tap Changer', content: 'OLTC +/-10%' },
      ],
    },

    { id: 'switchyard', label: 'Switchyard — 400kV', icon: 'git-branch',
      description: 'AIS double-busbar 400kV switchyard.',
      status: 'online', flowRate: '300 MWe',
      parentId: 'grp-grid',
      sections: [
        { heading: 'Configuration', content: 'Double busbar' },
        { heading: 'Voltage', content: '400 kV' },
        { heading: 'Fault Level', content: '40 kA' },
        { heading: 'Outgoing Feeders', content: '2x 400kV circuits' },
      ],
    },

    { id: 'grid-connection', label: 'Grid Connection Point', icon: 'zap',
      description: '400kV point of common coupling.',
      status: 'online', flowRate: '298 MWe',
      style: { color: '#22c55e' },
      parentId: 'grp-grid',
      sections: [
        { heading: 'Voltage', content: '400 kV' },
        { heading: 'Export', content: '298 MW (net after auxiliaries)' },
        { heading: 'Grid Code', content: 'GB Grid Code 2023' },
        { heading: 'Frequency Response', content: 'FFR + DDRR capable' },
      ],
    },

    { id: 'pem-electrolyzer-smr', label: 'PEM Electrolyzer — H2', icon: 'pem-electrolyzer',
      description: 'Proton exchange membrane electrolyzer for hydrogen coproduction.',
      status: 'online', progress: 65, flowRate: '50 MWe input',
      parentId: 'grp-grid',
      style: { color: '#22c55e' },
      sections: [
        { heading: 'Type', content: 'PEM — proton exchange membrane' },
        { heading: 'Power Input', content: '50 MW electric' },
        { heading: 'H2 Production', content: '~1000 kg/hr' },
        { heading: 'Efficiency', content: '68% LHV (HHV 80%)' },
        { heading: 'H2 Pressure', content: '30 bar outlet' },
        { heading: 'H2 Purity', content: '>99.999%' },
        { heading: 'Application', content: 'Green hydrogen for industry / fuel' },
      ],
    },

    { id: 'h2-storage-smr', label: 'Hydrogen Storage', icon: 'h2-storage',
      description: 'Compressed gaseous hydrogen buffer storage.',
      status: 'online',
      parentId: 'grp-grid',
      sections: [
        { heading: 'Pressure', content: '200 bar compressed gas' },
        { heading: 'Capacity', content: '5,000 kg H2 (buffer)' },
        { heading: 'Vessels', content: '20x pressure vessels' },
        { heading: 'Standard', content: 'EN 13322-1' },
      ],
    },

    // ===== CONTROL ROOM =====
    { id: 'control-room-smr', label: 'Main Control Room', icon: 'layout-dashboard',
      description: 'Fully digital I&C — licensed operators 24/7.',
      status: 'online', style: { color: '#8b5cf6', glow: true },
      sections: [
        { heading: 'Power Level', content: '97% FP' },
        { heading: 'Reactor Period', content: 'Stable (infinity)' },
        { heading: 'Keff', content: '1.0000' },
        { heading: 'Boron', content: '900 ppm' },
        { heading: 'CRDM Position', content: '15% (all rods out — power ops)' },
        { heading: 'Passive Safety', content: 'All trains available' },
        { heading: 'H2 Production', content: '1,020 kg/hr' },
      ],
    },
  ],
  edges: [
    // Reactor to steam generator (primary loop — red)
    { id: 'smr1', source: 'smr-vessel', target: 'integral-sg', color: '#ef4444', flowAnimation: true, annotation: '310 C hot leg', thickness: 4,
      measurements: [{ label: 'T', value: '310', unit: 'C' }, { label: 'P', value: '127', unit: 'bar' }],
    },
    { id: 'smr2', source: 'integral-sg', target: 'primary-pump', color: '#f97316', flowAnimation: true, annotation: '258 C cold leg', thickness: 3 },
    { id: 'smr3', source: 'primary-pump', target: 'smr-vessel', color: '#f97316', flowAnimation: true, thickness: 3 },
    { id: 'smr4', source: 'pressurizer-smr', target: 'smr-vessel', color: '#ef4444', type: 'dashed', annotation: '127 bar' },
    { id: 'smr5', source: 'ctrl-rod-drive', target: 'smr-vessel', color: '#94a3b8', type: 'dashed', annotation: 'Reactivity ctrl' },

    // Steam path — amber
    { id: 'smr6', source: 'integral-sg', target: 'steam-drum-smr', color: '#f59e0b', flowAnimation: true, annotation: 'Steam 295 C', thickness: 3,
      measurements: [{ label: 'T', value: '295', unit: 'C' }, { label: 'P', value: '34', unit: 'bar' }],
    },
    { id: 'smr7', source: 'steam-drum-smr', target: 'hp-turbine-smr', color: '#f59e0b', flowAnimation: true, thickness: 3, annotation: '34 bar' },
    { id: 'smr8', source: 'hp-turbine-smr', target: 'lp-turbine-smr', color: '#3b82f6', flowAnimation: true, thickness: 3 },
    { id: 'smr9', source: 'lp-turbine-smr', target: 'generator-smr', color: '#22c55e', flowAnimation: true, annotation: '300 MWe', thickness: 4,
      measurements: [{ label: 'P', value: '300', unit: 'MWe' }, { label: 'f', value: '50.0', unit: 'Hz' }],
    },
    { id: 'smr10', source: 'lp-turbine-smr', target: 'condenser-smr', color: '#06b6d4', flowAnimation: true, annotation: 'Exhaust' },
    { id: 'smr11', source: 'condenser-smr', target: 'feedwater', color: '#06b6d4', flowAnimation: true },
    { id: 'smr12', source: 'feedwater', target: 'integral-sg', color: '#3b82f6', flowAnimation: true, annotation: 'Feedwater 180 C' },

    // Cooling tower — cyan
    { id: 'smr13', source: 'condenser-smr', target: 'cooling-tower-smr', color: '#06b6d4', flowAnimation: true, annotation: 'Heat rejection 620 MWt' },

    // Electrical path — blue/green
    { id: 'smr14', source: 'generator-smr', target: 'main-transformer', color: '#22c55e', flowAnimation: true, annotation: '15 kV', thickness: 4,
      measurements: [{ label: 'P', value: '300', unit: 'MW' }, { label: 'V', value: '15', unit: 'kV' }],
    },
    { id: 'smr15', source: 'main-transformer', target: 'switchyard', color: '#22c55e', flowAnimation: true, annotation: '400 kV', thickness: 4 },
    { id: 'smr16', source: 'switchyard', target: 'grid-connection', color: '#22c55e', flowAnimation: true, annotation: '298 MWe', thickness: 4, label: 'National Grid' },

    // Hydrogen coproduction — green
    { id: 'smr17', source: 'switchyard', target: 'pem-electrolyzer-smr', color: '#22c55e', flowAnimation: true, annotation: '50 MW', thickness: 2, label: 'H2 offtake' },
    { id: 'smr18', source: 'pem-electrolyzer-smr', target: 'h2-storage-smr', color: '#22c55e', flowAnimation: true, annotation: '1000 kg/hr H2', thickness: 2 },

    // Safety systems — purple
    { id: 'smr19', source: 'passive-safety-sys', target: 'smr-vessel', color: '#8b5cf6', type: 'dashed', annotation: 'ECCS injection' },
    { id: 'smr20', source: 'emerg-water', target: 'smr-vessel', color: '#8b5cf6', type: 'dashed', annotation: 'Gravity makeup' },
    { id: 'smr21', source: 'passive-cooling', target: 'smr-vessel', color: '#8b5cf6', type: 'dashed', annotation: 'Decay heat removal' },
    { id: 'smr22', source: 'seismic-isolator', target: 'smr-vessel', color: '#8b5cf6', type: 'dashed', annotation: 'Seismic isolation' },
    { id: 'smr23', source: 'diesel-gen-smr', target: 'control-room-smr', color: '#94a3b8', type: 'dashed', annotation: 'Backup power' },

    // Spent fuel
    { id: 'smr24', source: 'spent-fuel-pool', target: 'smr-vessel', color: '#f59e0b', type: 'dashed', annotation: 'Spent fuel transfer' },

    // Control room monitoring
    { id: 'smr25', source: 'control-room-smr', target: 'smr-vessel', color: '#8b5cf6', type: 'dashed', annotation: 'I&C monitoring' },
    { id: 'smr26', source: 'control-room-smr', target: 'generator-smr', color: '#8b5cf6', type: 'dashed' },
    { id: 'smr27', source: 'control-room-smr', target: 'pem-electrolyzer-smr', color: '#22c55e', type: 'dashed', annotation: 'H2 dispatch' },
  ],
};

const sampleProject: ProjectData = {
  title: 'HVDC Converter Station Build',
  tasks: [
    { id: 't1', title: 'Site Preparation', status: 'complete', startDate: '2026-01-06', endDate: '2026-02-28', progress: 100, assignee: 'Team Alpha', priority: 'high', isGroup: true, children: ['t1a', 't1b', 't1c'], color: '#22c55e' },
    { id: 't1a', title: 'Land clearing & grading', status: 'complete', startDate: '2026-01-06', endDate: '2026-01-31', progress: 100, assignee: 'J. Smith', groupId: 't1', nodeId: 'gen-solar' },
    { id: 't1b', title: 'Foundation excavation', status: 'complete', startDate: '2026-01-20', endDate: '2026-02-14', progress: 100, assignee: 'M. Chen', groupId: 't1', dependencies: [{ taskId: 't1a', type: 'FS' as const, lag: -10 }] },
    { id: 't1c', title: 'Concrete pour & cure', status: 'complete', startDate: '2026-02-10', endDate: '2026-02-28', progress: 100, assignee: 'R. Patel', groupId: 't1', dependencies: [{ taskId: 't1b', type: 'FS' as const }] },

    { id: 't2', title: 'Equipment Procurement', status: 'complete', startDate: '2026-01-13', endDate: '2026-04-30', progress: 100, assignee: 'Procurement', priority: 'critical', isGroup: true, children: ['t2a', 't2b', 't2c'], color: '#3b82f6' },
    { id: 't2a', title: 'Converter transformers (x4)', status: 'complete', startDate: '2026-01-13', endDate: '2026-03-31', progress: 100, assignee: 'ABB Supply', priority: 'critical', groupId: 't2', nodeId: 'xfmr-main' },
    { id: 't2b', title: 'Thyristor valve halls', status: 'complete', startDate: '2026-02-01', endDate: '2026-04-15', progress: 100, assignee: 'Siemens', groupId: 't2', dependencies: [{ taskId: 't2a', type: 'SS' as const, lag: 14 }] },
    { id: 't2c', title: 'DC switchgear & breakers', status: 'complete', startDate: '2026-02-15', endDate: '2026-04-30', progress: 100, assignee: 'GE Grid', groupId: 't2' },

    { id: 't3', title: 'Civil & Structural', status: 'in-progress', startDate: '2026-03-01', endDate: '2026-06-30', progress: 72, assignee: 'Team Beta', priority: 'high', isGroup: true, children: ['t3a', 't3b', 't3c'], color: '#f59e0b' },
    { id: 't3a', title: 'Valve hall building', status: 'complete', startDate: '2026-03-01', endDate: '2026-05-15', progress: 100, assignee: 'K. Tanaka', groupId: 't3', dependencies: [{ taskId: 't1c', type: 'FS' as const }] },
    { id: 't3b', title: 'Control building', status: 'in-progress', startDate: '2026-04-01', endDate: '2026-06-15', progress: 65, assignee: 'A. Johansson', groupId: 't3', dependencies: [{ taskId: 't1c', type: 'FS' as const }], nodeId: 'scada' },
    { id: 't3c', title: 'Cooling system installation', status: 'in-progress', startDate: '2026-05-01', endDate: '2026-06-30', progress: 40, assignee: 'L. Garcia', groupId: 't3', dependencies: [{ taskId: 't3a', type: 'FS' as const }] },

    { id: 't4', title: 'Electrical Installation', status: 'in-progress', startDate: '2026-05-01', endDate: '2026-09-30', progress: 35, assignee: 'Team Gamma', priority: 'critical', isGroup: true, children: ['t4a', 't4b', 't4c', 't4d'], color: '#8b5cf6' },
    { id: 't4a', title: 'Transformer installation', status: 'in-progress', startDate: '2026-05-01', endDate: '2026-06-30', progress: 55, assignee: 'P. Mueller', priority: 'critical', groupId: 't4', dependencies: [{ taskId: 't2a', type: 'FS' as const }, { taskId: 't3a', type: 'FS' as const }], baselineStart: '2026-04-15', baselineEnd: '2026-06-15' },
    { id: 't4b', title: 'Valve assembly & testing', status: 'todo', startDate: '2026-06-01', endDate: '2026-08-31', progress: 0, assignee: 'D. Kim', priority: 'critical', groupId: 't4', dependencies: [{ taskId: 't2b', type: 'FS' as const }, { taskId: 't3a', type: 'FS' as const }] },
    { id: 't4c', title: 'DC yard equipment', status: 'todo', startDate: '2026-07-01', endDate: '2026-08-31', progress: 0, assignee: 'S. Okonkwo', groupId: 't4', dependencies: [{ taskId: 't2c', type: 'FS' as const }] },
    { id: 't4d', title: 'SCADA & protection systems', status: 'backlog', startDate: '2026-08-01', endDate: '2026-09-30', progress: 0, assignee: 'N. Larsson', groupId: 't4', dependencies: [{ taskId: 't4b', type: 'FS' as const }] },

    { id: 't5', title: 'Commissioning', status: 'backlog', startDate: '2026-09-01', endDate: '2026-11-30', progress: 0, assignee: 'Commissioning Team', priority: 'high', isGroup: true, children: ['t5a', 't5b', 't5c'], color: '#06b6d4' },
    { id: 't5a', title: 'Individual equipment tests', status: 'backlog', startDate: '2026-09-01', endDate: '2026-10-15', progress: 0, assignee: 'Test Lead', groupId: 't5', dependencies: [{ taskId: 't4a', type: 'FS' as const }] },
    { id: 't5b', title: 'System integration tests', status: 'backlog', startDate: '2026-10-01', endDate: '2026-11-15', progress: 0, assignee: 'Test Lead', groupId: 't5', dependencies: [{ taskId: 't5a', type: 'FS' as const }, { taskId: 't4d', type: 'FS' as const }] },
    { id: 't5c', title: 'Grid connection & energization', status: 'backlog', startDate: '2026-11-01', endDate: '2026-11-30', progress: 0, assignee: 'Grid Ops', groupId: 't5', dependencies: [{ taskId: 't5b', type: 'FS' as const }], isMilestone: true },

    { id: 't6', title: 'Commercial Operation', status: 'backlog', startDate: '2026-12-01', endDate: '2026-12-01', progress: 0, priority: 'critical', isMilestone: true, dependencies: [{ taskId: 't5c', type: 'FS' as const }], color: '#ef4444' },
  ],
};

const nodeTemplates: SidebarNodeTemplate[] = [
  { type: 'default', label: 'Process', description: 'A process step' },
  { type: 'decision', label: 'Decision', description: 'A branch point' },
  { type: 'start', label: 'Start', description: 'Entry point' },
  { type: 'end', label: 'End', description: 'Exit point' },
];

export function App() {
  const [activeDemo, setActiveDemo] = React.useState<string>('showcase');
  const [currentDiagram, setCurrentDiagram] = useState<FlowDiagram>(sampleDiagram);
  const demoMap: Record<string, FlowDiagram> = { vertical: sampleDiagram, 'wind-farm': windFarmDiagram, 'solar-plant': solarPlantDiagram, datacenter: datacenterDiagram, 'power-supply': powerSupplyDiagram, hvdc: hvdcDiagram, showcase: showcaseDiagram, 'dc-facility': dcFacilityDiagram, nuclear: nuclearDiagram, 'gas-pipeline': gasPipelineDiagram, 'hydro-plant': hydroPlantDiagram, hydrogen: hydrogenDiagram, smr: smrDiagram };
  const baseDiagram = demoMap[activeDemo] || sampleDiagram;
  const diagram = (activeDemo === 'vertical' || activeDemo === 'showcase') ? currentDiagram : baseDiagram;
  const canvasRef = useRef<FlowCanvasRef>(null);

  const handleNodeCollapse = (nodeId: string, collapsed: boolean) => {
    setCurrentDiagram(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, branchCollapsed: collapsed } : n),
    }));
  };

  const handleDemoChange = (demo: string) => {
    setActiveDemo(demo);
    if (demo === 'vertical') setCurrentDiagram(sampleDiagram);
    if (demo === 'showcase') setCurrentDiagram(showcaseDiagram);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      <Sidebar activeDemo={activeDemo} onDemoChange={handleDemoChange} />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
      {activeDemo === 'project' ? (
        <div style={{ width: '100%', height: '100%' }}>
          <ProjectView
            project={sampleProject}
            diagram={showcaseDiagram}
            onTaskClick={(id) => console.log('Task clicked:', id)}
            onTaskStatusChange={(id, status) => console.log('Status change:', id, status)}
          />
        </div>
      ) : (
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
      )}
      </div>
    </div>
  );
}
