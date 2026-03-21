# Nodescape

A React + TypeScript diagramming library for building decision charts, flow diagrams, and system visualizations from declarative JSON.

## Features

- Declarative JSON schema — AI agents can generate diagrams programmatically
- Auto-layout via dagre — no manual positioning needed
- Multiple edge routing: curved, orthogonal (rounded bends), straight
- Edit mode with drag-to-reposition and snap-to-grid (8px)
- Dark/light theme with toggle
- Lucide icons + custom SVG components
- Minimap, keyboard shortcuts, export to PNG/SVG
- Status badges, progress bars, flow rate indicators
- Animated directional flow on edges
- Custom node renderers, context menus, collapsible sections
- Node groups and branch expand/collapse
- Drag-and-drop sidebar for adding nodes

## Quick Start

```bash
npm install nodescape
```

```tsx
import { FlowCanvas } from 'nodescape';
import 'nodescape/style.css';

const diagram = {
  layout: { direction: 'TB', routing: 'orthogonal' },
  nodes: [
    { id: '1', type: 'start', label: 'Begin' },
    { id: '2', label: 'Process', description: 'Do something.' },
    { id: '3', type: 'end', label: 'Done' },
  ],
  edges: [
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
  ],
};

<FlowCanvas diagram={diagram} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `diagram` | `FlowDiagram` | required | The declarative JSON schema |
| `mode` | `'view' \| 'edit'` | `'view'` | Readonly or editable |
| `theme` | `'light' \| 'dark'` | `'light'` | Color scheme |
| `background` | `'dots' \| 'isometric' \| 'plain'` | `'dots'` | Canvas background |
| `minimap` | `boolean` | `false` | Show minimap overlay |
| `themeToggle` | `boolean` | `false` | Show theme toggle button |
| `onDiagramChange` | `(diagram) => void` | — | Called after node drag |
| `onNodeClick` | `(id, node) => void` | — | Node click handler |
| `contextMenu` | `boolean` | `false` | Enable right-click menu |

## License

MIT
