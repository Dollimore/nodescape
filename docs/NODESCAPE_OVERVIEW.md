# Nodescape — Complete Feature Overview

A React + TypeScript diagramming library for building interactive decision charts, flow diagrams, electrical schematics, and system visualizations from declarative JSON. Designed for AI agents, engineering applications, educational content, and real-time monitoring dashboards.

**Repository:** https://github.com/Dollimore/nodescape
**Stack:** React 18, TypeScript, Vite (library mode), CSS Modules
**Dependencies:** dagre (layout), d3-force (optional), lucide-react (icons)
**Size:** 81 source files, ~8,000 lines of code, 107 commits

---

## Architecture

- **DOM-first rendering** — nodes are React components positioned via CSS transforms on an infinite pannable/zoomable canvas
- **SVG edge layer** — edges rendered as SVG bezier/orthogonal paths in an overlay
- **dagre auto-layout** — hierarchical directed graph layout, compound graph support for groups
- **8px universal grid** — all dimensions, positions, and snap points are multiples of 8px
- **CSS custom properties** — full theming via 25+ CSS variables
- **Declarative JSON schema** — AI agents write JSON, the library renders it

---

## Core Component

```tsx
import { FlowCanvas } from 'nodescape';

<FlowCanvas
  diagram={myDiagram}           // JSON schema (required)
  mode="edit"                    // 'view' | 'edit'
  theme="dark"                   // 'light' | 'dark'
  background="dots"              // 'dots' | 'isometric' | 'plain'
  minimap                        // show minimap overlay
  themeToggle                    // show light/dark toggle
  zoomControls                   // show +/- and fit-to-view buttons
  detailPanel                    // enable detail sidebar on click
  contextMenu                    // right-click context menu
  legend                         // auto-generated color/symbol key
  contextualZoom                 // hide detail when zoomed out
  story={storyConfig}            // guided walkthrough mode
  sidebar={nodeTemplates}        // drag-and-drop node palette
  displayMode="standard"         // 'standard' | 'single-line'
  alarms={alarmList}             // SCADA alarm banner
  onDiagramChange={...}          // position change callback
  onNodeClick={...}              // node click handler
  onNodeLabelChange={...}        // inline label edit
  onSelectionChange={...}        // multi-select callback
  onNodesDelete={...}            // delete selected nodes
  onNodesCopy={...}              // Cmd+C handler
  onNodesPaste={...}             // Cmd+V handler
  onEdgeCreate={...}             // drag between handles
  onContextMenu={...}            // custom context menu
  onNodeCollapse={...}           // branch collapse
  onNodeDrop={...}               // sidebar drop handler
  onStoryStepChange={...}        // story navigation
  onAlarmClick={...}             // alarm click handler
  onUndo={...}                   // undo callback
  onRedo={...}                   // redo callback
/>
```

---

## JSON Schema

```typescript
interface FlowDiagram {
  title?: string;
  layout?: {
    engine?: 'dagre' | 'force';
    direction?: 'TB' | 'LR' | 'BT' | 'RL';
    nodeSpacing?: number;
    rankSpacing?: number;
    routing?: 'curved' | 'orthogonal' | 'straight';
    cornerRadius?: number;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

---

## Node Types (7)

| Type | Description |
|------|-------------|
| `default` | Standard card with label, description, sections, icons |
| `decision` | Diamond badge, four-sided handles for branching |
| `start` | Green dot indicator |
| `end` | Red dot indicator |
| `group` | Dashed container that wraps child nodes, colored border |
| `bus` | Thin bar representing shared electrical connections |
| `netlabel` | Flag-shaped named connection point (VCC, GND, CLK) |

### Node Features

| Feature | Schema Field | Description |
|---------|-------------|-------------|
| Icons | `icon: string` | 69 built-in SVG symbols + all Lucide icons |
| Status badges | `status: 'online' \| 'offline' \| 'warning' \| 'error' \| 'idle'` | Colored dot in top-right corner |
| Progress bars | `progress: number` | 0-100% fill bar at bottom |
| Setpoint markers | `setpoint: number` | Red tick on progress bar showing target |
| Flow rate badges | `flowRate: string` | Monospace blue badge (e.g., "1200 MW") |
| Sections | `sections: [{heading, content}]` | Collapsible detail sections with markdown |
| Markdown | In `description` and `sections` | **bold**, *italic*, `code`, [links](url) |
| Multi-port | `ports: [{id, label, side, position}]` | Labeled connection pins (E/B/C) |
| Rotation | `rotation: 0 \| 90 \| 180 \| 270` | Component rotation |
| Glow effect | `style.glow: true` | Subtle blue box-shadow highlight |
| Color variants | `style.color`, `style.variant` | Outlined, filled, or ghost styling |
| Collapsible | `collapsed: true` | Start with sections collapsed |
| Branch collapse | `branchCollapsed: true` | Hide all downstream nodes |
| Parent groups | `parentId: string` | Assign node to a group container |
| Detail panel | `detail: NodeDetail` | Rich sidebar content on click |
| Custom renderers | `nodeRenderers` prop | Register custom React components per type |

---

## Edge Types & Features

| Feature | Schema Field | Description |
|---------|-------------|-------------|
| Routing | `routing: 'curved' \| 'orthogonal' \| 'straight'` | Per-edge or diagram-level default |
| Corner radius | `cornerRadius: number` | Rounded bends for orthogonal edges |
| Custom color | `color: string` | Any CSS color |
| Thickness | `thickness: number` | Custom stroke width |
| Animated dashes | `animated: true` | Moving dashed pattern |
| Flow pulse | `flowAnimation: true` | Bright segment traveling along path |
| Labels | `label: string` | Pill badge at midpoint (Yes/No, Feed A/B) |
| Annotations | `annotation: string` | Monospace value near edge (10K, 240V AC) |
| Junction dots | `showJunction: true` | Solid dots at connection points |
| Wire type | `type: 'wire'` | Thick, no arrowhead, forced orthogonal |
| Dashed | `type: 'dashed'` | Dashed line for standby/backup paths |
| Success/failure | `type: 'success' \| 'failure'` | Green/red label styling |
| Port connections | `sourcePort`, `targetPort` | Connect to specific node ports |
| Measurements | `measurements: EdgeMeasurement[]` | Inline V/A/W readouts on wire |
| Crossover hops | `showHops: true` | Auto-detect and render wire crossing arcs |

---

## SVG Symbol Library (69 symbols)

### Electrical Engineering (21)
Resistor, Capacitor, Inductor, Transformer, Diode, LED, Transistor NPN, Switch, Fuse, Motor, Generator, Ground, Voltage Source, Current Source, Op-Amp, Battery, Speaker, Antenna, Crystal Oscillator, Connector, Relay

### Nuclear Power (12)
Reactor Vessel, Steam Generator, Turbine, Condenser, Cooling Tower, Control Rod, Pump, Valve, Containment Building, Radiation Symbol, Pressurizer, Heat Exchanger

### Data Center (12)
Server Rack, Network Switch, Firewall, Router, Load Balancer, Chiller, ATS, STS, Patch Panel, PDU Rack, CRAH, UPS Unit

### Protection & Measurement (10)
Voltmeter, Ammeter, Wattmeter, Frequency Meter, Current Transformer (CT), Potential Transformer (PT), Protection Relay (87), Surge Arrester, Circuit Breaker (IEC), Disconnector

### Natural Gas (5)
Gas Turbine, Pipeline, Compressor, LNG Terminal, Flow Meter

### Renewables (3)
Wind Turbine, Solar Panel, Inverter

### Hydro (4)
Hydro Dam, Water Turbine, Penstock, Reservoir

---

## Canvas & Interaction

### Navigation
- **Two-finger scroll** (trackpad) = pan
- **Pinch** (trackpad) = zoom (native listener with passive:false)
- **Ctrl/Cmd + scroll wheel** = zoom
- **Click + drag background** = pan
- **Touch devices:** one-finger pan, two-finger pinch zoom
- **Keyboard shortcuts:** Cmd+0 fit view, Cmd+/- zoom, Cmd+1 reset
- **Fit view:** auto-zoom to show all content on mount

### Edit Mode
- **Drag nodes** to reposition (snap to 8px grid)
- **Shift+click** for multi-select (blue highlight)
- **Alt+drag** background for lasso selection
- **Backspace/Delete** to remove selected nodes
- **Cmd+C/V** for copy/paste
- **Double-click** label to edit inline
- **Right-click** for context menu (duplicate, delete, collapse)
- **Drag between handles** to create new edges
- **Helper/snap lines** when aligning with other nodes
- **Collision detection** (red outline when overlapping)
- **Group drag** moves all children together

### Canvas Features
- **Dot grid background** with major/minor hierarchy (8px/32px)
- **Background scales with zoom** (static relative to content)
- **Minimap** with viewport indicator
- **Zoom controls** (+/-, percentage, fit-to-view, undo/redo buttons)
- **Theme toggle** (sun/moon button, bottom-left)
- **Legend** (auto-generated from diagram colors/symbols)
- **Contextual zoom** (hide detail when zoomed out: minimal/compact/full)
- **Alarm banner** (scrolling alerts at top with severity styling)

---

## Detail Panel (Right Sidebar)

Opens when clicking a node with `detail` data. Slide-in animation, close button, dark mode support.

### Built-in Section Types

| Type | Component | Description |
|------|-----------|-------------|
| `text` | SimpleMarkdown | Rich markdown content |
| `keyvalue` | KeyValueTable | Two-column specification table |
| `chart` | MiniChart | SVG bar or line chart (no dependencies) |
| `timeline` | Timeline | Vertical event timeline with status dots |
| `trend` | TrendChart | Time-series with setpoint line and area fill |
| `loadprofile` | LoadProfile | Daily/weekly/monthly load patterns with toggle |
| `meritorder` | MeritOrder | Generation dispatch stacked bars with demand line |
| `table` | KeyValueTable | Same as keyvalue |
| `gallery` | Custom | Via `renderDetailSection` prop |
| `custom` | Custom | Via `renderDetailSection` prop |

---

## Story Mode (Guided Walkthrough)

```typescript
story={{
  steps: [
    { nodeId: 'solar', title: 'Solar Generation', content: 'Generates **1440 MW**...' },
    { nodeId: 'grid', title: 'Grid Connection', content: 'Feeds into **400kV bus**...' },
  ],
  autoPlay: true,
  autoPlayInterval: 5000,
}}
```

- Bottom overlay with prev/next/play controls and dot pagination
- Auto-pans camera to center on each node
- Opens detail panel for the active node
- Auto-play with configurable interval per step
- Markdown content per step

---

## Utilities & Analysis

### Power Systems
| Utility | Description |
|---------|-------------|
| `computePowerFlow(diagram)` | Walk graph from generators to loads, apply per-edge losses, annotate edges |
| `powerFlowSummary(result)` | Format as node sections (generation, load, losses) |
| `applyVoltageColoring(diagram)` | Auto-color edges by voltage level (HV red, MV amber, LV blue) |
| `applyCurrentThickness(diagram)` | Scale edge width by current magnitude |
| `applyLoadFlowArrows(diagram)` | Auto-set thickness proportional to power flow |
| `applyGridHealthOverlay(diagram, metrics)` | Color nodes by voltage/frequency/loading health |
| `analyzeContingencies(diagram)` | N-1 analysis for every component |
| `applyContingencyHighlight(diagram, result)` | Visualize contingency impact (red/amber) |

### Nuclear
| Utility | Description |
|---------|-------------|
| `applyRadiationZones(diagram, reactorId)` | BFS-based zone coloring from reactor outward |
| `reactorStatusSections(status)` | Format reactor parameters as node sections |

### Data Center
| Utility | Description |
|---------|-------------|
| `calculatePUE(diagram)` | Compute Power Usage Effectiveness from node data |
| `analyzeRedundancy(diagram)` | Find single points of failure and A/B feed paths |
| `applyHeatmap(diagram, options)` | Color nodes by utilization (green/amber/red/critical) |

### Simulation
| Utility | Description |
|---------|-------------|
| `applyWhatIf(diagram, state)` | Toggle components off, see cascade failures |
| `createWhatIfState()` / `toggleWhatIfNode()` | State management for what-if mode |

### General
| Utility | Description |
|---------|-------------|
| `analyzeDiagram(diagram)` | Node/edge counts, root/leaf/isolated detection, max depth |
| `computeForceLayout(diagram, w, h)` | d3-force alternative to dagre |
| `serializeDiagram()` / `deserializeDiagram()` | JSON serialization |
| `saveDiagramToStorage()` / `loadDiagramFromStorage()` | localStorage persistence |

### Hooks
| Hook | Description |
|------|-------------|
| `useHistory<T>` | Generic undo/redo (past/present/future, 50-entry cap) |
| `useRealtimeBinding(diagram, options)` | Live-update nodes from data source with polling |
| `useStory(config)` | Story mode state management |

---

## Export

```typescript
const canvasRef = useRef<FlowCanvasRef>(null);

// Programmatic export
const dataUrl = await canvasRef.current.exportPng();
const svgUrl = await canvasRef.current.exportSvg();

// Download
await canvasRef.current.downloadPng({ filename: 'diagram.png' });
await canvasRef.current.downloadSvg({ filename: 'diagram.svg' });
```

---

## Layout Engines

### dagre (default)
- Hierarchical directed graph layout
- Compound graph support (groups cluster children)
- TB, LR, BT, RL directions
- Grid-snapped output (8px)
- Measure-then-layout (reads DOM sizes)

### d3-force (optional)
- Force-directed physics simulation
- `computeForceLayout(diagram, width, height)`
- Collision avoidance built in
- Grid-snapped output

---

## Demos (9 interactive diagrams)

| Demo | Description | Key Features Shown |
|------|-------------|-------------------|
| **Showcase** | Feature overview with all node types | Every feature in one diagram, story mode |
| **Vertical (TB)** | User auth flow chart | Groups, collapsible sections, markdown |
| **Wind Farm** | Offshore wind with OSS and grid | Turbine strings, export cable, power curves |
| **Solar Plant** | Utility-scale PV with BESS | PV blocks, inverters, battery storage, weather |
| **Power Supply** | Multi-stage SMPS circuit | Multi-port ICs, signal/power paths, 5 groups |
| **Data Center** | Full facility layout | Racks, cooling, network, monitoring, security |
| **HVDC** | Multi-terminal super grid | 40+ nodes, DC corridors, SCADA, merit order |
| **Nuclear** | PWR power plant | Primary/secondary loops, safety systems, neutron flux |
| **Gas Pipeline** | Natural gas transmission | Wells, compressors, storage, LNG, metering |
| **Hydro Plant** | Hydroelectric facility | Reservoir, dam, turbines, fish ladder, spillway |
| **DC Facility** | Data center infrastructure | Power/cooling/IT/network groups, PUE |
| **Circuit** | Audio amplifier schematic | Transistor ports, resistors, capacitors |

---

## Theming

25+ CSS custom properties for complete visual customization:

```css
--fc-bg, --fc-node-bg, --fc-node-border, --fc-node-shadow,
--fc-node-label, --fc-node-desc, --fc-edge, --fc-dot,
--fc-grid-line, --fc-grid-line-major, --fc-handle-bg,
--fc-edge-label-bg, --fc-group-halo, ...
```

Light and dark mode with smooth toggle. All components respect theme variables.

---

## Z-Index Layering

| Layer | Z-Index | Content |
|-------|---------|---------|
| Background | - | Grid dots and lines |
| Groups | 0 | Dashed containers, group labels |
| Edges + Nodes | 1 | SVG paths, node cards |
| Labels | 2 | Edge labels, annotations, measurements |
| Helper lines | 5 | Alignment snap guides |
| Controls | 10 | Minimap, zoom controls, theme toggle |
| Sidebar | 15 | Drag-and-drop node palette |
| Legend | 15 | Auto-generated color key |
| Alarm banner | 25 | SCADA alarm notifications |
| Story overlay | 25 | Walkthrough controls |
| Detail panel | 30 | Right sidebar with rich content |
| Context menu | 100 | Right-click menu |

---

## Target Use Cases

1. **AI Agent Diagrams** — agents write JSON, get beautiful auto-laid-out diagrams
2. **Educational Content** — story mode walkthroughs for courses and explainers
3. **Engineering Schematics** — 69 symbols covering EE, nuclear, gas, hydro, solar, wind, data center
4. **SCADA/Monitoring** — real-time data binding, alarms, trend charts, status indicators
5. **System Architecture** — software flow charts, decision trees, process diagrams
6. **Power Systems** — HVDC transmission, grid analysis, contingency studies, power flow
7. **Data Center Operations** — facility layout, PUE monitoring, redundancy analysis
8. **Nuclear Plant Visualization** — reactor monitoring, radiation zones, safety systems
