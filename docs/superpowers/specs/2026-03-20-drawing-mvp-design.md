# Drawing MVP — Design Specification

A React + TypeScript npm library for rendering decision/flow charts from declarative JSON. Designed for AI agents to generate structured diagrams that auto-layout into polished, professional visuals.

## Problem

Existing tools (React Flow, Excalidraw) don't combine text-rich process visualization with AI-agent-friendly declarative layout generation. Building learning resources and technical diagrams for apps like HVDC World and Data Center Atlas requires a tool where AI agents can produce a JSON config and get a beautiful diagram — no manual positioning needed.

## Architecture

**DOM-First with SVG Edges.** Nodes are React components positioned via CSS transforms on an infinite pannable/zoomable canvas. Edges are SVG bezier curves rendered in an overlay layer. Auto-layout is powered by dagre.

Why this approach:
- Native HTML text rendering — wrapping, formatting, flexible sizing handled by the browser
- React component model — nodes are just components, easy to customize
- dagre handles hierarchical directed graph layout — exactly what decision/flow charts need
- Performance ceiling (~500-1000 nodes) is fine for the target use case

## Declarative JSON Schema

The core interface. AI agents produce this JSON; the library renders it.

```typescript
interface FlowDiagram {
  title?: string;
  layout?: {
    direction?: 'TB' | 'LR' | 'BT' | 'RL'; // default 'TB'
    nodeSpacing?: number;   // default 60
    rankSpacing?: number;   // default 80
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowNode {
  id: string;
  type?: 'default' | 'decision' | 'start' | 'end' | 'group';
  label: string;
  description?: string;
  sections?: NodeSection[];
  style?: {
    color?: string;
    variant?: 'filled' | 'outlined' | 'ghost';
  };
}

interface NodeSection {
  heading?: string;
  content: string;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'success' | 'failure' | 'dashed';
}
```

Key decisions:
- **No coordinates in the schema** — auto-layout computes positions. This is what makes it AI-friendly.
- **`sections` array** — flexible content from zero extra text to multiple headed paragraphs.
- **`style.color` is opt-in** — nodes default to neutral (white card, light gray border). Color only appears when explicitly set.

## Component API

```tsx
import { FlowCanvas } from 'drawing-mvp';

// Minimal — readonly, auto-layout
<FlowCanvas diagram={myDiagram} />

// Editable with export
<FlowCanvas
  diagram={myDiagram}
  mode="edit"
  onDiagramChange={(updated) => saveSomewhere(updated)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `diagram` | `FlowDiagram` | required | The JSON schema |
| `mode` | `'view' \| 'edit'` | `'view'` | Readonly or editable |
| `onDiagramChange` | `(diagram: FlowDiagram) => void` | — | Called when user modifies diagram in edit mode. Emits full JSON with computed positions. |
| `theme` | `'light' \| 'dark'` | `'light'` | Color scheme |
| `className` | `string` | — | CSS class on root container |
| `fitView` | `boolean` | `true` | Auto-zoom to fit all content |

### Edit mode scope (MVP)

Edit mode enables:
- Drag nodes to reposition
- Pan and zoom the canvas
- Positions baked into exported JSON so manual tweaks persist

Edit mode does NOT include (MVP):
- Adding/deleting nodes via UI
- Drawing new edges via UI
- Inline text editing

The JSON schema is the source of truth for content. Edit mode is purely for spatial arrangement.

## Auto-Layout Engine

Uses dagre for directed graph layout.

### Two-pass measure-then-layout approach

1. Library renders nodes invisibly (off-screen or hidden)
2. Measures each node's actual DOM dimensions (text content varies)
3. Feeds node dimensions + edge relationships into dagre
4. dagre computes x/y positions and edge routing control points
5. Library applies positions via CSS transforms, renders SVG edge paths
6. Reveals the positioned result

This happens fast enough to feel instant for typical decision charts (<100 nodes).

## Visual Design

Inspired by DoubleLoop and TypeForm flow builders.

### Node rendering

- All node types are rounded rectangles — shape is consistent, content differentiates
- White background, 1.5px light gray border (`#e0e0e0`), subtle shadow (`0 1px 3px rgba(0,0,0,0.04)`)
- 10px border radius
- Small circular connection handles (8px dots) on node edges
- No color, gradients, or decoration by default — completely neutral
- No emojis

### Node type differentiation

- **Default:** Title + optional description + optional sections
- **Decision:** Same card shape, small geometric icon badge (diamond indicator) next to title. Connection handles on all four sides for branching.
- **Start:** Same card shape, small green dot indicator
- **End:** Same card shape, small red dot indicator
- **Sections:** Stack below the main content in a light gray (`#fafafa`) band with `1px` dividers. Section headings are small uppercase labels.

### Edge rendering

- SVG bezier curves, rendered in a layer behind nodes
- Smooth path routing
- Small arrowhead at the target end
- Edge labels positioned at curve midpoint — small, quiet pills
- Success edges: green label pill
- Failure edges: red label pill
- Default/dashed: neutral gray

### Customization

- `style.color` tints the node border and icon — opt-in only
- `style.variant`: `outlined` (default), `filled` (color background), `ghost` (no border)
- `theme` prop switches light/dark
- CSS custom properties exposed for full override by consuming apps

## Canvas & Interaction

### Infinite canvas

- Pan: click and drag background
- Zoom: scroll wheel, clamped to min/max bounds
- `fitView`: auto-zoom to show all content on mount

### View mode

- Pan and zoom only
- No node interaction beyond hover states
- Presentation-ready

### Edit mode

- All view mode interactions, plus:
- Drag nodes to reposition (subtle hover state indicates grabbable)
- `onDiagramChange` fires with updated JSON after each drag

## Project Structure

```
drawing-mvp/
  src/
    FlowCanvas.tsx
    FlowCanvas.module.css
    types.ts
    layout/
      useAutoLayout.ts
    canvas/
      CanvasView.tsx
      CanvasView.module.css
    nodes/
      FlowNodeRenderer.tsx
      DefaultNode.tsx
      DefaultNode.module.css
      DecisionNode.tsx
      StartEndNode.tsx
    edges/
      EdgeRenderer.tsx
      Edge.module.css
      pathUtils.ts
    hooks/
      useDragNode.ts
      usePanZoom.ts
  index.ts
  package.json
  tsconfig.json
  vite.config.ts
```

## Build & Dependencies

- **Build:** Vite in library mode — outputs ESM + CJS bundles, handles CSS modules
- **Runtime dependency:** `dagre` (layout engine, ~15KB)
- **Peer dependencies:** `react`, `react-dom` (consumer provides)
- **No other runtime dependencies**

## Public Exports

```typescript
export { FlowCanvas } from './FlowCanvas';
export type { FlowDiagram, FlowNode, FlowEdge, FlowCanvasProps } from './types';
```

## Out of Scope (MVP)

- Node editing UI (add/delete/edit nodes in browser)
- Edge drawing UI (connect nodes by dragging)
- Undo/redo
- Minimap
- Collaboration / real-time sync
- Export to image/PDF
- Custom node component registration (consumers can't provide their own node renderers yet)

These can be added in future iterations.
