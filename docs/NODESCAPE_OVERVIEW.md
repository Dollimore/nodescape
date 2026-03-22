# Nodescape — Complete Feature Overview

## What is Nodescape?

Nodescape is a React + TypeScript diagramming library that renders interactive, professional-grade diagrams from declarative JSON. It was built to solve a specific problem: existing tools like React Flow and Excalidraw don't combine text-rich process visualization with AI-agent-friendly declarative layout generation in a way that works for engineering applications, educational content, and real-time monitoring.

Nodescape sits at the intersection of three worlds:
- **Diagramming tools** (like React Flow, Excalidraw) — infinite canvas, drag-and-drop, pan/zoom
- **Engineering schematic tools** (like AutoCAD Electrical, ETAP) — standardized symbols, measurements, power flow
- **Dashboard/monitoring tools** (like Grafana, SCADA systems) — real-time data, alarms, trend charts

The library is designed so that an AI agent can produce a JSON configuration and get a beautiful, auto-laid-out diagram with no manual positioning. A human can then enter edit mode to drag nodes, tweak the layout, and export the result.

**Repository:** https://github.com/Dollimore/nodescape
**Stack:** React 18, TypeScript, Vite (library mode), CSS Modules
**Runtime Dependencies:** dagre (layout engine, ~15KB)
**Optional Dependencies:** d3-force (force layout), lucide-react (icon library)
**Size:** 81 source files, ~8,000 lines of code, 20+ modules

---

## Who is it for?

### Engineers
- Electrical engineers creating single-line diagrams, circuit schematics, protection coordination diagrams
- Power systems engineers visualizing HVDC transmission networks, grid topology, contingency analysis
- Nuclear engineers monitoring reactor systems, safety interlocks, radiation zones
- Data center engineers mapping power distribution, cooling systems, network topology

### Educators & Content Creators
- Building interactive explainers for how power plants work, how HVDC transmission operates, how data centers are designed
- Creating step-by-step guided walkthroughs (Story Mode) that pan the camera to each component and explain it
- Producing course materials with collapsible detail, inline measurements, and rich detail panels

### Software Developers
- Building monitoring dashboards with real-time data binding and alarm systems
- Creating flow charts for software architecture, decision trees, process documentation
- Embedding interactive diagrams in documentation or training portals

### AI Agent Applications
- Agents generate JSON schema and the library auto-layouts it into a professional diagram
- No manual positioning needed — dagre computes all positions from node relationships
- The JSON schema is simple enough for any LLM to produce reliably

---

## Architecture

### Rendering Approach: DOM + SVG Hybrid

Nodescape uses a **DOM-first** approach where nodes are standard React components positioned via CSS `transform: translate()` on an infinite canvas. This gives us:
- Native HTML text rendering — wrapping, formatting, flexible sizing handled by the browser
- React component model — nodes are just components, easy to customize
- Accessibility — standard DOM elements for screen readers

Edges are rendered as **SVG paths** in a separate overlay layer. This gives us:
- Smooth bezier curves and orthogonal paths with rounded corners
- Arrowheads, flow pulse animations, junction dots
- Crisp rendering at any zoom level

### Layout Engine: dagre with Compound Graph Support

The auto-layout uses dagre's hierarchical directed graph algorithm with compound graph support:
1. The library renders nodes invisibly (one frame)
2. Measures each node's actual DOM dimensions
3. Feeds dimensions + edge relationships into dagre (with parent-child grouping)
4. dagre computes x/y positions for every node
5. All positions are snapped to the 8px grid
6. The library applies positions via CSS transforms and renders SVG edges

### Universal 8px Grid System

Everything in Nodescape is built on an 8px grid:
- Node positions snap to 8px multiples when dragged
- Node dimensions are rounded up to 8px multiples
- Background grid lines are drawn every 8px (minor) and 32px (major)
- Layout spacing (node gaps, rank spacing, margins) are all 8px multiples
- Node padding is 8px
- The background grid and node edges align perfectly — node borders sit ON grid lines

### CSS Custom Properties Theming

The entire visual system is built on 25+ CSS custom properties:
```css
--fc-bg                        /* Canvas background */
--fc-node-bg                   /* Node card background */
--fc-node-border               /* Node border color */
--fc-node-shadow               /* Node box shadow */
--fc-node-label                /* Label text color */
--fc-node-desc                 /* Description text color */
--fc-node-section-border       /* Section divider color */
--fc-edge                      /* Edge/wire color */
--fc-dot                       /* Grid dot color */
--fc-grid-line                 /* Minor grid line opacity */
--fc-grid-line-major           /* Major grid line opacity */
--fc-handle-bg                 /* Connection handle fill */
--fc-edge-label-bg             /* Edge label background */
--fc-group-halo                /* Group label text shadow */
/* ... and more */
```

Light and dark themes are defined as CSS class overrides. Switching themes is instant — no re-render needed.

### Z-Index Layering System

| Layer | Z-Index | Content |
|-------|---------|---------|
| Background | - | 8px/32px grid dots and lines |
| Groups | 0 | Dashed containers, group labels with halo |
| Edges + Nodes | 1 | SVG paths, arrowheads, flow pulses, node cards |
| Labels & Annotations | 2 | Edge labels, annotations, inline measurements |
| Helper lines | 5 | Alignment snap guides (during drag) |
| Controls | 10 | Minimap, zoom controls, theme toggle |
| Sidebar | 15 | Drag-and-drop node palette |
| Legend | 15 | Auto-generated color/symbol key |
| Alarm banner | 25 | SCADA alarm notifications |
| Story overlay | 25 | Walkthrough controls |
| Detail panel | 30 | Right sidebar with rich content |
| Context menu | 100 | Right-click menu |
| Lasso selection | 9999 | Selection rectangle overlay |

---

## Core Component API

```tsx
import { FlowCanvas } from 'nodescape';
import type { FlowCanvasRef } from 'nodescape';

const canvasRef = useRef<FlowCanvasRef>(null);

<FlowCanvas
  ref={canvasRef}
  diagram={myDiagram}
  mode="edit"
  // ... 30+ optional props
/>

// Programmatic API via ref
await canvasRef.current.downloadPng({ filename: 'diagram.png' });
await canvasRef.current.downloadSvg({ filename: 'diagram.svg' });
const dataUrl = await canvasRef.current.exportPng();
```

### All Props

| Category | Prop | Type | Default | Description |
|----------|------|------|---------|-------------|
| **Core** | `diagram` | `FlowDiagram` | required | The declarative JSON schema |
| | `mode` | `'view' \| 'edit'` | `'view'` | Readonly or editable |
| | `className` | `string` | - | CSS class on root container |
| | `fitView` | `boolean` | `true` | Auto-zoom to fit on mount |
| **Visual** | `theme` | `'light' \| 'dark'` | `'light'` | Color scheme |
| | `background` | `'dots' \| 'isometric' \| 'plain'` | `'dots'` | Canvas background pattern |
| | `displayMode` | `'standard' \| 'single-line'` | `'standard'` | Node rendering style |
| | `contextualZoom` | `boolean` | `false` | Hide detail when zoomed out |
| **UI Controls** | `minimap` | `boolean \| object` | `false` | Show minimap overlay |
| | `themeToggle` | `boolean` | `false` | Show light/dark toggle button |
| | `zoomControls` | `boolean` | `false` | Show zoom +/- and fit buttons |
| | `legend` | `boolean \| { position }` | `false` | Show auto-generated legend |
| | `detailPanel` | `boolean \| { width }` | `false` | Enable detail sidebar on click |
| | `contextMenu` | `boolean \| { items }` | `false` | Right-click context menu |
| | `sidebar` | `SidebarNodeTemplate[]` | - | Drag-and-drop node palette |
| **Story Mode** | `story` | `StoryConfig` | - | Guided walkthrough config |
| | `onStoryStepChange` | `(index, step) => void` | - | Step change callback |
| **SCADA** | `alarms` | `Alarm[]` | - | Alarm banner data |
| | `onAlarmClick` | `(alarm) => void` | - | Alarm click handler |
| | `onAlarmAcknowledge` | `(id) => void` | - | Alarm acknowledge handler |
| **Callbacks** | `onDiagramChange` | `(diagram) => void` | - | Position change after drag |
| | `onNodeClick` | `(id, node) => void` | - | Node click handler |
| | `onNodeLabelChange` | `(id, label) => void` | - | Inline label edit |
| | `onSelectionChange` | `(ids) => void` | - | Multi-select callback |
| | `onNodesDelete` | `(ids) => void` | - | Delete selected nodes |
| | `onNodesCopy` | `(nodes) => void` | - | Copy handler |
| | `onNodesPaste` | `(position) => void` | - | Paste handler |
| | `onEdgeCreate` | `(source, target) => void` | - | Edge creation by drag |
| | `onContextMenu` | `(id, node, pos) => void` | - | Custom context menu |
| | `onNodeCollapse` | `(id, collapsed) => void` | - | Branch collapse |
| | `onNodeDrop` | `(template, pos) => void` | - | Sidebar drop handler |
| | `onThemeChange` | `(theme) => void` | - | Theme toggle callback |
| **Extensibility** | `nodeRenderers` | `Record<string, Component>` | - | Custom node components |
| | `renderDetailSection` | `(section, node) => ReactNode` | - | Custom detail sections |
| **Undo/Redo** | `onUndo` / `onRedo` | `() => void` | - | History callbacks |
| | `canUndo` / `canRedo` | `boolean` | - | Button enabled state |

---

## JSON Schema — Full Reference

### FlowDiagram

```typescript
interface FlowDiagram {
  title?: string;
  layout?: {
    engine?: 'dagre' | 'force';           // Layout algorithm
    direction?: 'TB' | 'LR' | 'BT' | 'RL'; // Flow direction
    nodeSpacing?: number;                   // Horizontal gap (default 96)
    rankSpacing?: number;                   // Vertical gap (default 104)
    routing?: 'curved' | 'orthogonal' | 'straight'; // Edge style
    cornerRadius?: number;                  // Orthogonal bend radius (default 12)
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

### FlowNode

```typescript
interface FlowNode {
  id: string;                              // Unique identifier
  type?: 'default' | 'decision' | 'start' | 'end' | 'group' | 'bus' | 'netlabel';
  label: string;                           // Primary display text
  description?: string;                    // Supporting text (markdown)
  parentId?: string;                       // Group membership
  icon?: string | ComponentType;           // Lucide name, symbol name, or custom component
  sections?: NodeSection[];                // Collapsible detail sections
  ports?: NodePort[];                      // Multi-port connection points
  rotation?: 0 | 90 | 180 | 270;          // Component rotation
  collapsed?: boolean;                     // Start with sections collapsed
  collapsible?: boolean;                   // Whether sections can collapse
  branchCollapsed?: boolean;               // Hide downstream nodes
  status?: 'online' | 'offline' | 'warning' | 'error' | 'idle';
  progress?: number;                       // 0-100 progress bar
  setpoint?: number;                       // 0-100 target marker on progress bar
  flowRate?: string;                       // Badge text (e.g., "1200 MW")
  style?: {
    color?: string;                        // Accent color for border/icon
    variant?: 'filled' | 'outlined' | 'ghost';
    glow?: boolean;                        // Subtle blue highlight
  };
  detail?: NodeDetail;                     // Rich sidebar content
}
```

### FlowEdge

```typescript
interface FlowEdge {
  id: string;
  source: string;                          // Source node ID
  target: string;                          // Target node ID
  sourcePort?: string;                     // Connect to specific port
  targetPort?: string;                     // Connect to specific port
  label?: string;                          // Pill label at midpoint
  type?: 'default' | 'success' | 'failure' | 'dashed' | 'wire';
  routing?: 'curved' | 'orthogonal' | 'straight'; // Per-edge override
  color?: string;                          // Custom stroke color
  thickness?: number;                      // Custom stroke width
  animated?: boolean;                      // Moving dashed pattern
  flowAnimation?: boolean;                 // Bright pulse along path
  showJunction?: boolean;                  // Dots at connection points
  showHops?: boolean;                      // Auto wire crossover arcs
  annotation?: string;                     // Monospace value label
  annotationPosition?: number;             // 0-1 along path
  measurements?: EdgeMeasurement[];        // Inline instrument readouts
}
```

### NodeDetail (for Detail Panel)

```typescript
interface NodeDetail {
  title?: string;
  content?: string;                        // Markdown body text
  sections?: DetailSection[];
}

interface DetailSection {
  type: 'text' | 'keyvalue' | 'chart' | 'table' | 'timeline' |
        'trend' | 'loadprofile' | 'meritorder' | 'gallery' | 'custom';
  title?: string;
  data?: any;                              // Section-specific data
}
```

---

## Node Types — Detailed

### Default Node
The workhorse node. White card with rounded corners, optional icon, label, description (markdown), collapsible sections, status badge, progress bar, flow rate badge, port labels. Supports inline label editing on double-click.

### Decision Node
Same card shape as default but with a small amber diamond badge next to the label. Has connection handles on all four sides to support branching (Yes/No paths). Used for conditional logic in flow charts and decision points in engineering diagrams.

### Start / End Nodes
Same card shape with a small indicator dot — green for start, red for end. Used to mark entry and exit points of a process or system.

### Group Node
A transparent dashed container that visually groups child nodes. Uses dagre's compound graph to cluster children together and space groups apart. Features:
- Colored dashed border (`style.color`)
- Uppercase label with text-shadow halo (black in light mode, white in dark mode)
- Dragging a group moves all children
- Children can be dragged independently within the group
- 48px padding around children, 40px header space

### Bus Node
A thin horizontal or vertical bar representing a shared electrical connection (busbar). Used in power system single-line diagrams. Orientation controlled by `description: 'vertical'`.

### Net Label Node
A flag-shaped label indicating a named electrical connection point (VCC, GND, CLK, DATA). Implies a wire connection without drawing one — standard EE notation. Respects `style.color` for custom tinting.

---

## Edge Routing — Detailed

### Curved (Bezier)
S-shaped curves between nodes. The path uses cubic bezier curves with control points at the midpoint. Best for flow charts and process diagrams where the visual flow is more important than precise routing.

### Orthogonal (Right-Angle with Rounded Bends)
Horizontal and vertical segments with rounded corners at each bend. The routing system:
1. Exits the source handle with a 30px straight stub
2. Bends horizontally or vertically to reach the target
3. Enters the target handle with a 30px straight stub
4. Corner radius configurable (default 12px, up to 24px for softer bends)
5. Automatically avoids routing through connected nodes
6. When an edge needs to go "backwards" (e.g., bottom exit to a node above), it wraps around via the shortest side
7. Handles are locked based on initial layout positions to prevent jumping during drag
8. Nearly-aligned nodes (within 5px) snap to perfectly straight lines

### Straight
Direct point-to-point lines. No curves, no bends. Used when the spatial relationship is the message.

### Smart Handle Selection
The library automatically picks which side of each node to use for edge exit/entry:
- In TB layout: default bottom->top, but switches to side handles when the cross-axis distance is 1.5x the main axis
- When a target port is specified: source side is computed to point most directly at the target port
- Handle sides are locked from the initial layout to prevent jumping during drag

---

## SVG Symbol Library — 69 Symbols

All symbols are pure SVG React components accepting `size` and `color` props. They're automatically resolved when used as `icon` strings on nodes (e.g., `icon: 'transformer'`). The NodeIcon component checks Lucide first, then falls back to the electrical/engineering symbol library.

### Electrical Engineering (21 symbols)
**Passive:** Resistor (zigzag), Capacitor (parallel lines), Inductor (coils), Fuse (inline rectangle)
**Active:** Diode (triangle+line), LED (diode+arrows), Transistor NPN (with emitter arrow), Op-Amp (triangle+/-/output)
**Sources:** Voltage Source (circle +/-), Current Source (circle+arrow), Battery (stacked plates), Generator (circle G)
**Switching:** Switch (open contact), Relay (coil+switch in dashed box)
**Other:** Transformer (dual coils+core), Motor (circle M), Ground (decreasing lines), Speaker (cone), Antenna (Y-shape), Crystal Oscillator (rectangle between plates), Connector (circle+dot)

### Nuclear Power (12 symbols)
Reactor Vessel (ellipse with core), Steam Generator (U-tube), Turbine (converging polygon), Condenser (rectangle with tubes), Cooling Tower (hyperbolic shape with vapor), Control Rod (segmented rod), Pump (circle with triangle), Valve (double triangle), Containment Building (dome), Radiation Symbol (trefoil), Pressurizer (tall vessel with heaters), Heat Exchanger (circle with parallel tubes)

### Data Center Infrastructure (12 symbols)
Server Rack (rectangle with LED indicators and blank panels), Network Switch (rectangle with port circles and uplinks), Firewall (divided square with dashed rules), Router (circle with crosshairs), Load Balancer (rectangle with arrow), Chiller (rectangle with snowflake pattern), ATS (rectangle labeled ATS with leads), STS (rectangle labeled STS), Patch Panel (rectangle with port dots), PDU Rack (tall rectangle with outlets), CRAH (rectangle with fan spiral), UPS Unit (rectangle labeled UPS)

### Protection & Measurement (10 symbols)
Voltmeter (circle V), Ammeter (circle A), Wattmeter (circle W), Frequency Meter (circle Hz), Current Transformer CT (overlapping circles), Potential Transformer PT (overlapping circles with dots), Protection Relay (rectangle with relay code), Surge Arrester (chevron with ground bars), Circuit Breaker IEC (open contact with mechanism), Disconnector (knife switch)

### Natural Gas (5 symbols)
Gas Turbine (polygon with exhaust circle), Pipeline (double parallel lines with flanges), Compressor Station (circle with arrow), LNG Terminal (domed rectangle), Flow Meter (circle with pointer)

### Renewables (3 symbols)
Wind Turbine (three-blade hub on tower), Solar Panel (gridded rectangle on stand), Inverter (rectangle with AC/DC symbols)

### Hydro Power (4 symbols)
Hydro Dam (trapezoidal wall with water waves), Water Turbine (circle with curved blades), Penstock (curved pipe with flow lines), Reservoir (curved surface with water body)

---

## Detail Panel — Rich Sidebar

When `detailPanel` is enabled and a user clicks a node that has a `detail` field, a panel slides in from the right side. It shows:

### Header
- Node label (large, bold)
- Status badge (colored pill: ONLINE, WARNING, ERROR, etc.)
- Close button

### Automatic Content
- Description (markdown rendered)
- Flow rate metric (label + monospace value)
- Utilization progress bar with percentage
- All node sections (from `node.sections`)

### Detail Sections (from `node.detail.sections`)

**Text** — Rendered markdown content

**Key-Value Table** — Two-column specification table
```json
{ "type": "keyvalue", "title": "Specs", "data": { "Panel Type": "Bifacial N-type", "Capacity": "2000 MW" } }
```

**Bar/Line Chart** — Lightweight SVG chart (no chart library dependency)
```json
{ "type": "chart", "title": "Output", "data": { "type": "bar", "values": [800, 1200, 1400], "labels": ["9am", "12pm", "3pm"], "color": "#f59e0b" } }
```

**Timeline** — Vertical event log with colored status dots
```json
{ "type": "timeline", "title": "Events", "data": [
  { "time": "14:32", "event": "Cloud cover clearing", "status": "success" },
  { "time": "13:15", "event": "Output reduced to 70%", "status": "warning" }
]}
```

**Trend Chart** — Time-series with setpoint line, area fill, and grid
```json
{ "type": "trend", "title": "Temperature", "data": { "series": [{"time": "00:00", "value": 290}, ...], "setpoint": 325, "unit": "C", "color": "#ef4444" } }
```

**Load Profile** — Daily/weekly/monthly load patterns with tab toggle
```json
{ "type": "loadprofile", "data": { "daily": [{"hour": 0, "load": 200}, ...], "peakLoad": 1800, "unit": "MW" } }
```

**Merit Order** — Generation dispatch visualization with stacked bars and demand line
```json
{ "type": "meritorder", "data": { "sources": [{"name": "Nuclear", "capacity": 3200, "dispatched": 3200, "marginalCost": 10, "color": "#8b5cf6"}], "totalDemand": 4000 } }
```

**Custom** — Any React component via `renderDetailSection` prop

---

## Story Mode — Guided Walkthroughs

Story mode transforms a diagram into an interactive presentation. A bottom overlay provides navigation controls while the camera auto-pans to highlight each component in sequence.

```typescript
<FlowCanvas
  story={{
    steps: [
      { nodeId: 'reactor', title: 'Reactor Core', content: 'The **PWR** reactor generates 3400 MWt...' },
      { nodeId: 'turbine', title: 'Turbine Hall', content: 'Steam drives the HP and LP turbines...' },
      { nodeId: 'grid', title: 'Grid Export', content: '1200 MWe exported at **400kV**.' },
    ],
    autoPlay: true,
    autoPlayInterval: 5000,
  }}
/>
```

**Features:**
- Previous / Next / Play/Pause controls
- Dot pagination (click to jump to any step)
- Auto-play with per-step duration override
- Camera auto-pans to center on the active node
- Active node gets selected (blue highlight)
- Detail panel opens for nodes that have detail data
- Markdown content rendered per step
- Close button to exit story mode

**Use cases:**
- Online courses explaining how a power plant works
- Training materials walking through emergency procedures
- Product demos highlighting key system components
- Documentation walkthroughs for complex architectures

---

## SCADA / Control Room Features

### Alarm Banner
A scrolling alarm bar at the top of the canvas:
- Severity-based styling (critical red, warning amber, info blue)
- Count badges for critical and warning alarms
- Per-alarm acknowledge (ACK) button
- Click handler to navigate to the alarming node
- Auto-hides when no active alarms

### Trend Charts
Time-series visualization in the detail panel:
- SVG line chart with area fill
- Configurable setpoint line (dashed red)
- Y-axis grid with value labels
- Time-axis labels
- Custom color and range

### Setpoint Indicators
Red tick markers on progress bars showing target vs actual:
- Shows where the current value (blue fill) is relative to the setpoint (red tick)
- Immediately visible gap between actual and target

### Real-Time Data Binding
```typescript
const { diagram, updateNode } = useRealtimeBinding(baseDiagram, {
  pollInterval: 5000,
  dataSource: async () => fetchSCADAData(),
});

// Manual update
updateNode('reactor', { progress: 95, flowRate: '3400 MWt', status: 'online' });
```

---

## Simulation & Analysis Utilities

### Contingency Analysis (N-1)
```typescript
const results = analyzeContingencies(diagram);
// For each node: what disconnects if it's removed, severity, lost capacity

const highlighted = applyContingencyHighlight(diagram, results[0]);
// Red node = removed, amber nodes = affected, dashed red edges = broken
```

### What-If Mode
```typescript
let state = createWhatIfState();
state = toggleWhatIfNode(state, 'ups-a');  // "turn off" UPS A
const simulated = applyWhatIf(diagram, state);
// UPS A goes offline, downstream nodes go warning if all feeds are down
```

### Power Flow
```typescript
const result = computePowerFlow(diagram, { lossPerEdge: 0.5, unit: 'MW' });
// Walks from generators to loads, applies losses, annotates edges
// result.totalGeneration, result.totalLoad, result.totalLosses, result.warnings
```

### Grid Health Overlay
```typescript
const monitored = applyGridHealthOverlay(diagram, {
  'bus-400': { voltage: 0.97, frequency: 49.8, loading: 85 },
});
// Nodes colored green/amber/red based on voltage, frequency, or loading thresholds
```

### Heatmap Coloring
```typescript
const heatmapped = applyHeatmap(diagram, { metric: 'progress' });
// Nodes colored by utilization: green < 50%, amber < 75%, red < 90%, dark red >= 90%
```

### Data Center PUE
```typescript
const pue = calculatePUE(diagram);
// { pue: 1.15, totalIT: 800, totalFacility: 920, cooling: 100, ... }
```

### Redundancy Analysis
```typescript
const { singlePoints, redundantPaths } = analyzeRedundancy(diagram);
// singlePoints: nodes with only one incoming edge (single point of failure)
// redundantPaths: nodes with 2+ incoming feeds (A/B redundancy)
```

### Radiation Zones
```typescript
const zoned = applyRadiationZones(diagram, 'reactor');
// BFS from reactor: red (distance 0), amber (1-2), green (3-4), blue (5+)
```

---

## Canvas & Interaction — Detailed

### Navigation Controls
| Action | Desktop | Trackpad | Touch |
|--------|---------|----------|-------|
| Pan | Click+drag background | Two-finger scroll | One-finger drag |
| Zoom | Ctrl/Cmd + scroll | Pinch | Two-finger pinch |
| Fit view | Cmd+0 or fit button | Same | Same |
| Reset zoom | Cmd+1 or click percentage | Same | Same |
| Zoom in/out | Cmd+=/- or +/- buttons | Same | Same |

### Edit Mode Actions
| Action | Shortcut | Description |
|--------|----------|-------------|
| Drag node | Click+drag on node | Snaps to 8px grid |
| Multi-select | Shift+click | Toggle add/remove from selection |
| Lasso select | Alt+drag background | Rectangle selection |
| Delete | Backspace / Delete | Remove selected nodes |
| Copy | Cmd+C | Copy selected nodes |
| Paste | Cmd+V | Paste at default position |
| Undo | Cmd+Z | Undo last action |
| Redo | Cmd+Shift+Z | Redo last undone action |
| Edit label | Double-click label | Inline text editing |
| Create edge | Drag from handle | Connect two nodes |
| Context menu | Right-click node | Duplicate, Delete, Collapse |
| Collapse sections | Click chevron | Toggle section visibility |

### Smart Features
- **Snap alignment lines** — blue guides appear when dragging near aligned nodes
- **Collision detection** — red border when dragging over another node
- **Group drag** — moving a group moves all children
- **Edge lag prevention** — transitions disabled during drag for instant response
- **Backwards edge routing** — edges wrap around nodes when going against flow direction
- **Dynamic edge computation** — edges recompute in real-time during drag

---

## Interactive Demos (12 diagrams)

### 1. Showcase
Every feature in one diagram. 30+ nodes across 3 colored groups (Generation, Transmission, Load). Solar farm, nuclear plant, grid battery, transformers, DC breakers, HVDC link, data center load, SCADA control center. Story mode with 6-step walkthrough.

### 2. Wind Farm
Offshore wind farm with turbine strings, collection platform, offshore substation (transformer + SVC + switchgear), 95km subsea export cable, onshore substation, 400kV grid connection, O&M base, met mast, SCADA. Power curve charts and operational timelines.

### 3. Solar Plant
2GW utility-scale PV with 4x 100MW blocks, string inverters, DC combiners, MV switchgear, step-up transformer, plant controller, 100MW/400MWh BESS with BMS and thermal management, revenue meter, weather station. Daily generation charts and irradiance data.

### 4. Power Supply
Multi-stage SMPS circuit with 5 groups: AC input (fuse, EMI filter, bridge rectifier), PFC stage (boost converter, controller IC), DC-DC (half-bridge LLC with multi-port connections), output (sync rectifier, LC filter), control/feedback (PWM controller, optocoupler, TL431). Efficiency curves and transformer specifications.

### 5. Data Center Facility
Full facility with power infrastructure (utility feed, generators, ATS, UPS A/B, PDUs), cooling systems (chillers, CRAH), IT infrastructure (rack rows, top-of-rack switches), network (ISPs, firewall, load balancer, core switch), monitoring (DCIM, environmental sensors, CCTV, fire suppression). CPU utilization charts and battery voltage trends.

### 6. HVDC Super Grid
Multi-terminal HVDC network with 4 regions: North-West offshore wind (1760 MW), North-East nuclear+hydro (4400 MW), South-West industrial loads (2800 MW), South-East solar+BESS (1700 MW). Central DC switching hub with 3 hybrid breakers, STATCOM/SVC reactive compensation, DC fault protection, SCADA with merit order dispatch and load profiles. Inline voltage/current measurements on DC corridors.

### 7. Nuclear PWR
Complete pressurized water reactor: primary loop (reactor vessel, pressurizer, 2x RCPs, control rods), steam generation (2x steam generators), secondary loop (HP/LP turbines, generator, condenser, feedwater pump), cooling (2x cooling towers, circulation pump), safety systems (ECCS, containment, spray, diesel generators, accumulators), chemistry control (CVCS/boron), radiation monitors, spent fuel pool. Neutron flux trend charts, reactor parameter tables, 24h output trends.

### 8. Gas Pipeline
Natural gas transmission network: production zone (3 wells, gas processing plant with H2S/NGL sections, TEG dehydration), high-pressure transmission (3 compressor stations, 2 pipeline segments with diameter/grade specs), city gate distribution (pressure reduction, local network), gas storage (underground storage at 61% fill, LNG peak shaving at 94% fill). Daily throughput charts and operational timelines.

### 9. Hydro Plant
Hydroelectric facility: reservoir (73% level, 850 Mm3 storage), concrete arch dam (180m height), gated spillway (6 radial gates), power intake/penstock (5.8m diameter, 142.5m net head), 3x Francis turbines (Unit 3 offline for maintenance), 3x generators, step-up transformer, 220kV switchyard. Environmental systems: fish ladder (4820 fish YTD), minimum flow valve (12.6 m3/s), downstream water quality station. Water level trend charts.

### 10. DC Facility
Data center infrastructure: power (utility, generators, ATS, UPS, PDUs), cooling (chillers, CRAH with temperature alerts), IT (rack rows with server specs), network (ISPs, firewall, load balancer, core switch with port utilization).

### 11. Vertical (TB)
User authentication flow chart with decision branching, group node, collapsible sections, markdown descriptions, Lucide icons. The original demo that started it all.

### 12. Circuit
Audio amplifier with transistor (multi-port B/C/E connections), bias resistors with values, coupling capacitors, speaker output, VCC/GND net labels, color-coded signal/power/feedback paths.

---

## Sector-Specific Capabilities

### Electrical Engineering
- 21 standard circuit symbols
- Multi-port nodes for IC pin connections
- Component rotation (0/90/180/270)
- Wire-type edges (no arrowhead, thick stroke)
- Net labels for named connections (VCC, GND)
- Bus bars for shared connections
- Junction dots at wire junctions
- Wire crossover hop detection
- Component value annotations on edges
- Voltage auto-coloring utility
- Current-based wire thickness

### HVDC / Power Transmission
- Converter station nodes with sections (type, voltage, rating)
- DC corridor visualization with polarity coloring (+red/-blue)
- Protection coordination (DC breakers, fault detection)
- Reactive compensation nodes (SVC, STATCOM)
- N-1 contingency analysis
- Grid health overlays (voltage, frequency, loading)
- Load flow arrow scaling
- Power flow calculations with loss estimation
- Merit order generation dispatch
- Load profile visualization

### Nuclear Power
- 12 nuclear-specific symbols
- Primary/secondary/tertiary loop visualization
- Radiation zone coloring (BFS from reactor)
- Reactor status parameter formatting
- Control rod position indicators
- Safety system monitoring (ECCS, containment, spray)
- Neutron flux trending
- Spent fuel pool monitoring
- Emergency diesel generator status
- Coolant chemistry tracking (boron concentration)

### Data Centers
- 12 data center symbols
- PUE calculation utility
- Redundancy analysis (single points of failure, A/B feeds)
- Heatmap coloring by utilization
- Rack power density visualization
- Cooling system monitoring (supply/return temperatures)
- Network topology (spine/leaf, ToR switches)
- Environmental monitoring (temperature, humidity)
- Physical security (access control, CCTV, fire suppression)

### Natural Gas
- 5 gas-specific symbols
- Pipeline segment visualization with diameter and grade
- Compressor station utilization monitoring
- Underground storage fill level tracking
- LNG peak shaving plant status
- Flow metering and fiscal measurement
- Production gathering networks

### Hydroelectric
- 4 hydro-specific symbols
- Reservoir level monitoring with capacity metrics
- Dam structure specifications
- Spillway gate status
- Penstock flow and head pressure
- Turbine efficiency tracking (per-unit monitoring)
- Fish ladder monitoring (passage counting)
- Minimum environmental flow compliance
- Water quality downstream monitoring

### Renewables (Solar & Wind)
- 3 renewable-specific symbols
- Solar: PV block output, irradiance tracking, inverter status, BESS state-of-charge
- Wind: turbine string availability, met mast data, collection platform
- Shared: plant controller, revenue metering, grid connection POI

---

## Exports & Public API

52 public exports from `nodescape`:

### Components (12)
`FlowCanvas`, `DetailPanel`, `KeyValueTable`, `MiniChart`, `Timeline`, `TrendChart`, `LoadProfile`, `MeritOrder`, `InlineMeasurement`, `AlarmBanner`, `Legend`, `StoryOverlay`, `DragDropSidebar`, `ThemeToggle`, `WireCrossover`

### Hooks (3)
`useHistory`, `useRealtimeBinding`, `useStory`

### Utilities (14)
`serializeDiagram`, `deserializeDiagram`, `saveDiagramToStorage`, `loadDiagramFromStorage`, `computeForceLayout`, `computePowerFlow`, `powerFlowSummary`, `analyzeDiagram`, `applyHeatmap`, `calculatePUE`, `analyzeRedundancy`, `applyRadiationZones`, `reactorStatusSections`, `applyVoltageColoring`, `applyCurrentThickness`, `applyLoadFlowArrows`, `applyGridHealthOverlay`, `analyzeContingencies`, `applyContingencyHighlight`, `applyWhatIf`, `createWhatIfState`, `toggleWhatIfNode`

### Data (2)
`electricalSymbols` (69 symbol components), `DEFAULT_VOLTAGE_LEVELS`

### Types (20+)
`FlowDiagram`, `FlowNode`, `FlowEdge`, `FlowCanvasProps`, `FlowCanvasRef`, `NodePort`, `NodeSection`, `NodeDetail`, `DetailSection`, `EdgeMeasurement`, `EdgeRouting`, `CanvasBackground`, `CustomNodeProps`, `ContextMenuItem`, `SidebarNodeTemplate`, `StoryStep`, `StoryConfig`, `Alarm`, `TrendPoint`, `ExportOptions`, `PowerFlowResult`, `PowerFlowOptions`, `DiagramStats`, `HeatmapOptions`, `PUEResult`, `ReactorStatus`, `ContingencyResult`, `GridHealthMetrics`, `WhatIfState`, `VoltageLevel`, `NodeDataUpdate`, `RealtimeBindingOptions`, `LoadProfileData`, `GenerationSource`, `SymbolProps`

---

## Project Structure

```
nodescape/
  src/
    FlowCanvas.tsx              # Main component (orchestrator)
    FlowCanvas.module.css       # Theme CSS variables
    types.ts                    # All TypeScript interfaces
    index.ts                    # Public exports (52)
    canvas/
      CanvasView.tsx            # Infinite canvas with pan/zoom
      CanvasView.module.css     # Grid background patterns
    nodes/
      FlowNodeRenderer.tsx      # Routes node type to component
      DefaultNode.tsx           # Standard card node
      DecisionNode.tsx          # Diamond badge node
      StartEndNode.tsx          # Start/end indicator nodes
      GroupNode.tsx              # Dashed container node
      BusNode.tsx                # Electrical bus bar
      NetLabelNode.tsx           # Named connection label
      SingleLineNode.tsx         # Minimal single-line display
      NodeIcon.tsx               # Icon resolver (Lucide + symbols)
      SimpleMarkdown.tsx         # Inline markdown renderer
    edges/
      EdgeRenderer.tsx           # SVG edge rendering
      computeEdges.ts            # Dynamic edge waypoint computation
      pathUtils.ts               # Bezier/orthogonal/straight path builders
      crossoverDetection.ts      # Wire crossing detection
      InlineMeasurement.tsx      # V/A/W readouts on edges
      WireCrossover.tsx          # Semicircle hop component
    layout/
      useAutoLayout.ts           # dagre integration
      useForceLayout.ts          # d3-force alternative
    hooks/
      usePanZoom.ts              # Pan/zoom with touch + trackpad
      useDragNode.ts             # Node drag with grid snap + groups
      useKeyboardShortcuts.ts    # Keyboard event handling
      useHistory.ts              # Undo/redo state machine
      useRealtimeBinding.ts      # Live data polling
    canvas controls/
      ZoomControls.tsx           # +/- and fit buttons
      ThemeToggle.tsx            # Light/dark toggle
    detail/
      DetailPanel.tsx            # Right sidebar
      KeyValueTable.tsx          # Specification tables
      MiniChart.tsx              # Bar/line charts
      Timeline.tsx               # Event timeline
      TrendChart.tsx             # Time-series with setpoint
      LoadProfile.tsx            # Daily/weekly/monthly patterns
      MeritOrder.tsx             # Generation dispatch
    symbols/
      electrical.tsx             # 69 SVG symbol components
    story/
      StoryOverlay.tsx           # Walkthrough UI
      useStory.ts                # Story state management
    legend/
      Legend.tsx                  # Auto-generated diagram key
    minimap/
      Minimap.tsx                # Overview panel
    contextmenu/
      ContextMenu.tsx            # Right-click menu
    sidebar/
      DragDropSidebar.tsx        # Node palette
    scada/
      AlarmBanner.tsx            # SCADA alarm bar
    helpers/
      HelperLines.tsx            # Snap alignment guides
    export/
      exportUtils.ts             # PNG/SVG export
    utils/
      serialization.ts           # JSON save/load
      powerFlow.ts               # Power flow calculations
      contingency.ts             # N-1 analysis
      gridHealth.ts              # Voltage/frequency/loading overlay
      loadFlowArrows.ts          # Auto edge thickness
      voltageColoring.ts         # Voltage-level coloring
      heatmap.ts                 # Utilization heatmap
      nuclearUtils.ts            # Radiation zones, reactor status
      datacenterUtils.ts         # PUE, redundancy analysis
      diagramAnalysis.ts         # Graph structure analysis
      whatIf.ts                  # What-if simulation
      collisionUtils.ts          # Overlap detection
  demo/
    App.tsx                      # 12 interactive demo diagrams
    index.html                   # Entry point
    main.tsx                     # React root
  tests/
    e2e/                         # 17 Playwright tests
  docs/
    NODESCAPE_OVERVIEW.md        # This document
```

---

## Quick Start

```bash
npm install nodescape
```

```tsx
import { FlowCanvas } from 'nodescape';
import 'nodescape/style.css';

const diagram = {
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    { id: '1', type: 'start', label: 'Begin', icon: 'play' },
    { id: '2', label: 'Process', description: 'Do something useful.', icon: 'cog' },
    { id: '3', type: 'decision', label: 'Success?', icon: 'help-circle' },
    { id: '4', type: 'end', label: 'Done', icon: 'check' },
    { id: '5', type: 'end', label: 'Retry', icon: 'rotate-ccw' },
  ],
  edges: [
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
    { id: 'e3', source: '3', target: '4', label: 'Yes', type: 'success' },
    { id: 'e4', source: '3', target: '5', label: 'No', type: 'failure' },
  ],
};

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <FlowCanvas
        diagram={diagram}
        mode="edit"
        minimap
        themeToggle
        zoomControls
        detailPanel
        legend
        background="dots"
      />
    </div>
  );
}
```

---

*Built by Micky Dollimore. Designed for HVDC World, Data Center Atlas, and the energy sector.*
