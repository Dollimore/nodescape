# Drawing MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + TypeScript npm library that renders decision/flow charts from declarative JSON with auto-layout, pan/zoom canvas, and drag-to-reposition edit mode.

**Architecture:** DOM nodes positioned via CSS transforms on an infinite canvas. SVG bezier edges in an overlay layer. dagre computes layout from node dimensions + edge relationships. Two modes: view (readonly) and edit (drag reposition).

**Tech Stack:** React 18, TypeScript, Vite (library mode), dagre, CSS Modules, Playwright (testing)

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Package config, dependencies, scripts |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite library mode build config |
| `src/index.ts` | Public exports |
| `src/types.ts` | FlowDiagram, FlowNode, FlowEdge, FlowCanvasProps interfaces |
| `src/FlowCanvas.tsx` | Main component — orchestrates layout, renders canvas + nodes + edges |
| `src/FlowCanvas.module.css` | Root container styles |
| `src/layout/useAutoLayout.ts` | dagre integration — measure nodes, compute positions |
| `src/canvas/CanvasView.tsx` | Infinite canvas with pan/zoom via CSS transforms |
| `src/canvas/CanvasView.module.css` | Canvas styles |
| `src/nodes/FlowNodeRenderer.tsx` | Routes node.type to correct node component |
| `src/nodes/DefaultNode.tsx` | Default node — label, description, sections |
| `src/nodes/DefaultNode.module.css` | Default node styles |
| `src/nodes/DecisionNode.tsx` | Decision node — diamond badge, four-sided handles |
| `src/nodes/DecisionNode.module.css` | Decision node styles |
| `src/nodes/StartEndNode.tsx` | Start/end nodes — green/red dot indicators |
| `src/nodes/StartEndNode.module.css` | Start/end node styles |
| `src/edges/EdgeRenderer.tsx` | SVG layer — renders all edges as bezier curves |
| `src/edges/Edge.module.css` | Edge and label styles |
| `src/edges/pathUtils.ts` | Bezier curve calculation, arrowhead points |
| `src/hooks/usePanZoom.ts` | Pan/zoom state + mouse/wheel handlers |
| `src/hooks/useDragNode.ts` | Node drag handlers for edit mode |
| `demo/index.html` | Dev server HTML entry |
| `demo/App.tsx` | Demo app with sample diagram for visual testing |
| `demo/main.tsx` | Demo React entry point |
| `tests/e2e/setup.ts` | Playwright test config and helpers |
| `tests/e2e/render.spec.ts` | Tests: nodes and edges render from JSON |
| `tests/e2e/canvas.spec.ts` | Tests: pan, zoom, fitView |
| `tests/e2e/edit-mode.spec.ts` | Tests: drag nodes, onDiagramChange fires |
| `playwright.config.ts` | Playwright configuration |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/index.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd "/Users/mickydollimore/Desktop/Coding/MVPs Micky/Drawing MVP"
npm init -y
```

Then update `package.json`:

```json
{
  "name": "drawing-mvp",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/drawing-mvp.cjs",
  "module": "dist/drawing-mvp.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/drawing-mvp.js",
      "require": "./dist/drawing-mvp.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {},
  "dependencies": {}
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install dagre
npm install -D react react-dom @types/react @types/react-dom @types/dagre typescript vite @vitejs/plugin-react playwright @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationDir": "dist",
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "demo", "tests"]
}
```

- [ ] **Step 4: Create vite.config.ts**

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DrawingMVP',
      fileName: 'drawing-mvp',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    cssCodeSplit: false,
  },
});
```

- [ ] **Step 5: Create types.ts**

Create `src/types.ts`:

```typescript
export interface FlowDiagram {
  title?: string;
  layout?: {
    direction?: 'TB' | 'LR' | 'BT' | 'RL';
    nodeSpacing?: number;
    rankSpacing?: number;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Computed node positions from edit mode. Present in onDiagramChange output. */
  _positions?: { [nodeId: string]: { x: number; y: number } };
}

export interface FlowNode {
  id: string;
  type?: 'default' | 'decision' | 'start' | 'end';
  label: string;
  description?: string;
  sections?: NodeSection[];
  style?: {
    color?: string;
    variant?: 'filled' | 'outlined' | 'ghost';
  };
}

export interface NodeSection {
  heading?: string;
  content: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'success' | 'failure' | 'dashed';
}

export interface FlowCanvasProps {
  diagram: FlowDiagram;
  mode?: 'view' | 'edit';
  onDiagramChange?: (diagram: FlowDiagram) => void;
  className?: string;
  fitView?: boolean;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  points: { x: number; y: number }[];
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}
```

- [ ] **Step 6: Create index.ts with placeholder export**

Create `src/index.ts`:

```typescript
export type {
  FlowDiagram,
  FlowNode,
  FlowEdge,
  FlowCanvasProps,
  NodeSection,
} from './types';
```

- [ ] **Step 7: Verify build works**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts src/
git commit -m "feat: project scaffolding with types, vite config, and dependencies"
```

---

### Task 2: Demo App

**Files:**
- Create: `demo/index.html`
- Create: `demo/main.tsx`
- Create: `demo/App.tsx`
- Create: `demo/tsconfig.json`

The demo app is used for development and Playwright testing. It renders the FlowCanvas component with a sample diagram.

- [ ] **Step 1: Create demo/index.html**

Create `demo/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Drawing MVP Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Create demo/main.tsx**

Create `demo/main.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

- [ ] **Step 3: Create demo/App.tsx with sample diagram**

Create `demo/App.tsx`:

```tsx
import React from 'react';
import { FlowCanvas } from '../src';
import type { FlowDiagram } from '../src';

const sampleDiagram: FlowDiagram = {
  title: 'User Authentication Flow',
  layout: { direction: 'TB' },
  nodes: [
    { id: 'start', type: 'start', label: 'User visits login page' },
    { id: 'input', label: 'Enter credentials', description: 'User provides email and password.' },
    {
      id: 'validate',
      type: 'decision',
      label: 'Valid credentials?',
      description: 'Check against stored hash.',
    },
    {
      id: 'grant',
      label: 'Grant access',
      description: 'Create session and redirect to dashboard.',
      sections: [
        { heading: 'Session', content: 'JWT token with 24h expiry.' },
        { heading: 'Redirect', content: 'Send to /dashboard.' },
      ],
    },
    { id: 'deny', label: 'Show error', description: 'Display invalid credentials message.' },
    { id: 'end-success', type: 'end', label: 'Dashboard' },
    { id: 'end-fail', type: 'end', label: 'Login page (retry)' },
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

export function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <FlowCanvas diagram={sampleDiagram} mode="edit" onDiagramChange={console.log} />
    </div>
  );
}
```

- [ ] **Step 4: Create demo/tsconfig.json**

Create `demo/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["."],
  "references": [{ "path": ".." }]
}
```

- [ ] **Step 5: Update vite.config.ts to serve demo in dev mode**

Add to `vite.config.ts` — the `root` for dev server should point to demo:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  root: command === 'serve' ? 'demo' : undefined,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DrawingMVP',
      fileName: 'drawing-mvp',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    cssCodeSplit: false,
  },
}));
```

- [ ] **Step 6: Create a stub FlowCanvas so the demo can render**

Create `src/FlowCanvas.tsx`:

```tsx
import React from 'react';
import type { FlowCanvasProps } from './types';

export function FlowCanvas({ diagram, className }: FlowCanvasProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', background: '#f5f5f5' }}>
      <p>FlowCanvas: {diagram.nodes.length} nodes, {diagram.edges.length} edges</p>
    </div>
  );
}
```

Update `src/index.ts` to export it:

```typescript
export { FlowCanvas } from './FlowCanvas';
export type {
  FlowDiagram,
  FlowNode,
  FlowEdge,
  FlowCanvasProps,
  NodeSection,
} from './types';
```

- [ ] **Step 7: Verify dev server starts**

```bash
npx vite dev --port 5173
```

Open http://localhost:5173 — should show "FlowCanvas: 7 nodes, 6 edges". Stop the server.

- [ ] **Step 8: Commit**

```bash
git add demo/ src/FlowCanvas.tsx src/index.ts vite.config.ts
git commit -m "feat: demo app with sample diagram and stub FlowCanvas"
```

---

### Task 3: Playwright Test Setup

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/setup.ts`
- Create: `tests/e2e/render.spec.ts`

- [ ] **Step 1: Create playwright.config.ts**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npx vite dev --port 5173',
    port: 5173,
    reuseExistingServer: true,
    cwd: '.',
  },
});
```

- [ ] **Step 2: Create test setup helper**

Create `tests/e2e/setup.ts`:

```typescript
import { test as base, expect } from '@playwright/test';

export const test = base;
export { expect };
```

- [ ] **Step 3: Write first failing render test**

Create `tests/e2e/render.spec.ts`:

```typescript
import { test, expect } from './setup';

test.describe('FlowCanvas rendering', () => {
  test('renders all nodes from diagram JSON', async ({ page }) => {
    await page.goto('/');
    // The stub shows node count — this test will evolve as we build real nodes
    await expect(page.locator('[data-testid="flow-canvas"]')).toBeVisible();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npx playwright test tests/e2e/render.spec.ts
```

Expected: FAIL — `data-testid="flow-canvas"` not found on stub.

- [ ] **Step 5: Add data-testid to stub FlowCanvas**

Update `src/FlowCanvas.tsx` — add `data-testid="flow-canvas"` to the root div.

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx playwright test tests/e2e/render.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/
git commit -m "feat: Playwright test setup with initial render test"
```

---

### Task 4: Node Components

**Files:**
- Create: `src/nodes/DefaultNode.tsx`
- Create: `src/nodes/DefaultNode.module.css`
- Create: `src/nodes/DecisionNode.tsx`
- Create: `src/nodes/DecisionNode.module.css`
- Create: `src/nodes/StartEndNode.tsx`
- Create: `src/nodes/StartEndNode.module.css`
- Create: `src/nodes/FlowNodeRenderer.tsx`

- [ ] **Step 1: Write Playwright tests for node rendering**

Add to `tests/e2e/render.spec.ts`:

```typescript
test('renders default node with label and description', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('[data-testid="node-input"]');
  await expect(node).toBeVisible();
  await expect(node).toContainText('Enter credentials');
  await expect(node).toContainText('User provides email and password.');
});

test('renders decision node with diamond badge', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('[data-testid="node-validate"]');
  await expect(node).toBeVisible();
  await expect(node).toContainText('Valid credentials?');
  await expect(node.locator('[data-testid="decision-badge"]')).toBeVisible();
});

test('renders start node with green indicator', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('[data-testid="node-start"]');
  await expect(node).toBeVisible();
  await expect(node).toContainText('User visits login page');
  await expect(node.locator('[data-testid="start-indicator"]')).toBeVisible();
});

test('renders end node with red indicator', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('[data-testid="node-end-success"]');
  await expect(node).toBeVisible();
  await expect(node).toContainText('Dashboard');
  await expect(node.locator('[data-testid="end-indicator"]')).toBeVisible();
});

test('renders node sections', async ({ page }) => {
  await page.goto('/');
  const node = page.locator('[data-testid="node-grant"]');
  await expect(node).toContainText('Session');
  await expect(node).toContainText('JWT token with 24h expiry.');
  await expect(node).toContainText('Redirect');
  await expect(node).toContainText('Send to /dashboard.');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test tests/e2e/render.spec.ts
```

Expected: FAIL — node elements don't exist yet.

- [ ] **Step 3: Create DefaultNode.module.css**

Create `src/nodes/DefaultNode.module.css`:

```css
.node {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: system-ui, -apple-system, sans-serif;
  min-width: 160px;
  max-width: 320px;
  position: absolute;
  user-select: none;
}

.node[data-editable="true"]:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: grab;
}

.node[data-editable="true"]:active {
  cursor: grabbing;
}

.label {
  font-weight: 600;
  font-size: 13px;
  color: #1a1a1a;
  margin-bottom: 3px;
}

.description {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}

.sections {
  margin-top: 10px;
}

.section {
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
}

.section:first-child {
  padding-top: 10px;
}

.sectionHeading {
  font-weight: 600;
  font-size: 10.5px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
}

.sectionContent {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}

.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1.5px solid #d0d0d0;
  border-radius: 50%;
}

.handleTop {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.handleBottom {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.handleLeft {
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
}

.handleRight {
  top: 50%;
  right: -5px;
  transform: translateY(-50%);
}
```

- [ ] **Step 4: Create DefaultNode.tsx**

Create `src/nodes/DefaultNode.tsx`:

```tsx
import React from 'react';
import type { FlowNode } from '../types';
import styles from './DefaultNode.module.css';

interface DefaultNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function DefaultNode({ node, editable }: DefaultNodeProps) {
  const customColor = node.style?.color;
  const variant = node.style?.variant || 'outlined';

  const nodeStyle: React.CSSProperties = {};
  if (customColor && variant === 'outlined') {
    nodeStyle.borderColor = customColor;
  } else if (customColor && variant === 'filled') {
    nodeStyle.borderColor = customColor;
    nodeStyle.backgroundColor = customColor;
    nodeStyle.color = '#fff';
  } else if (variant === 'ghost') {
    nodeStyle.border = 'none';
    nodeStyle.boxShadow = 'none';
  }

  return (
    <div
      className={styles.node}
      data-testid={`node-${node.id}`}
      data-editable={editable}
      style={nodeStyle}
    >
      <div className={styles.handle + ' ' + styles.handleTop} />
      <div className={styles.handle + ' ' + styles.handleBottom} />
      <div className={styles.label}>{node.label}</div>
      {node.description && <div className={styles.description}>{node.description}</div>}
      {node.sections && node.sections.length > 0 && (
        <div className={styles.sections}>
          {node.sections.map((section, i) => (
            <div key={i} className={styles.section}>
              {section.heading && (
                <div className={styles.sectionHeading}>{section.heading}</div>
              )}
              <div className={styles.sectionContent}>{section.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create DecisionNode.module.css**

Create `src/nodes/DecisionNode.module.css`:

```css
.badge {
  width: 18px;
  height: 18px;
  background: #fef3c7;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.diamond {
  width: 8px;
  height: 8px;
  background: #f59e0b;
  transform: rotate(45deg);
}

.header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
```

- [ ] **Step 6: Create DecisionNode.tsx**

Create `src/nodes/DecisionNode.tsx`:

```tsx
import React from 'react';
import type { FlowNode } from '../types';
import defaultStyles from './DefaultNode.module.css';
import styles from './DecisionNode.module.css';

interface DecisionNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function DecisionNode({ node, editable }: DecisionNodeProps) {
  return (
    <div
      className={defaultStyles.node}
      data-testid={`node-${node.id}`}
      data-editable={editable}
    >
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleTop} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleBottom} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleLeft} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleRight} />
      <div className={styles.header}>
        <div className={styles.badge} data-testid="decision-badge">
          <div className={styles.diamond} />
        </div>
        <div className={defaultStyles.label}>{node.label}</div>
      </div>
      {node.description && <div className={defaultStyles.description}>{node.description}</div>}
    </div>
  );
}
```

- [ ] **Step 7: Create StartEndNode.module.css**

Create `src/nodes/StartEndNode.module.css`:

```css
.indicator {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.indicatorStart {
  background: #f0fdf4;
}

.indicatorEnd {
  background: #fef2f2;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dotStart {
  background: #22c55e;
}

.dotEnd {
  background: #ef4444;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 8: Create StartEndNode.tsx**

Create `src/nodes/StartEndNode.tsx`:

```tsx
import React from 'react';
import type { FlowNode } from '../types';
import defaultStyles from './DefaultNode.module.css';
import styles from './StartEndNode.module.css';

interface StartEndNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function StartEndNode({ node, editable }: StartEndNodeProps) {
  const isStart = node.type === 'start';

  return (
    <div
      className={defaultStyles.node}
      data-testid={`node-${node.id}`}
      data-editable={editable}
    >
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleTop} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleBottom} />
      <div className={styles.header}>
        <div
          className={`${styles.indicator} ${isStart ? styles.indicatorStart : styles.indicatorEnd}`}
          data-testid={isStart ? 'start-indicator' : 'end-indicator'}
        >
          <div className={`${styles.dot} ${isStart ? styles.dotStart : styles.dotEnd}`} />
        </div>
        <div className={defaultStyles.label}>{node.label}</div>
      </div>
      {node.description && <div className={defaultStyles.description}>{node.description}</div>}
    </div>
  );
}
```

- [ ] **Step 9: Create FlowNodeRenderer.tsx**

Create `src/nodes/FlowNodeRenderer.tsx`:

```tsx
import React from 'react';
import type { FlowNode } from '../types';
import { DefaultNode } from './DefaultNode';
import { DecisionNode } from './DecisionNode';
import { StartEndNode } from './StartEndNode';

interface FlowNodeRendererProps {
  node: FlowNode;
  editable: boolean;
  position: { x: number; y: number };
  onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
}

export function FlowNodeRenderer({ node, editable, position, onDragStart }: FlowNodeRendererProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    transform: `translate(${position.x}px, ${position.y}px)`,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editable && onDragStart) {
      onDragStart(node.id, e);
    }
  };

  const NodeComponent = getNodeComponent(node.type);

  return (
    <div style={style} onMouseDown={handleMouseDown}>
      <NodeComponent node={node} editable={editable} />
    </div>
  );
}

function getNodeComponent(type?: FlowNode['type']) {
  switch (type) {
    case 'decision':
      return DecisionNode;
    case 'start':
    case 'end':
      return StartEndNode;
    default:
      return DefaultNode;
  }
}
```

- [ ] **Step 10: Update FlowCanvas to render nodes**

Update `src/FlowCanvas.tsx`:

```tsx
import React from 'react';
import type { FlowCanvasProps } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';

  // Temporary: stack nodes vertically with fixed spacing for visual verification
  // Will be replaced by dagre auto-layout in Task 6
  const tempPositions = new Map<string, { x: number; y: number }>();
  diagram.nodes.forEach((node, i) => {
    tempPositions.set(node.id, { x: 100, y: i * 120 });
  });

  return (
    <div
      data-testid="flow-canvas"
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}
    >
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={tempPositions.get(node.id)!}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 11: Run tests**

```bash
npx playwright test tests/e2e/render.spec.ts
```

Expected: ALL PASS.

- [ ] **Step 12: Commit**

```bash
git add src/nodes/ src/FlowCanvas.tsx
git commit -m "feat: node components — default, decision, start/end with FlowNodeRenderer"
```

---

### Task 5: Edge Rendering

**Files:**
- Create: `src/edges/pathUtils.ts`
- Create: `src/edges/EdgeRenderer.tsx`
- Create: `src/edges/Edge.module.css`

- [ ] **Step 1: Write Playwright tests for edges**

Add to `tests/e2e/render.spec.ts`:

```typescript
test('renders edges as SVG paths', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('[data-testid="edge-layer"]');
  await expect(svg).toBeVisible();
  // 6 edges in sample diagram
  const paths = svg.locator('[data-testid^="edge-"]');
  await expect(paths).toHaveCount(6);
});

test('renders edge labels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="edge-label-e3"]')).toContainText('Yes');
  await expect(page.locator('[data-testid="edge-label-e4"]')).toContainText('No');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test tests/e2e/render.spec.ts --grep "edges|edge labels"
```

Expected: FAIL.

- [ ] **Step 3: Create pathUtils.ts**

Create `src/edges/pathUtils.ts`:

```typescript
export interface Point {
  x: number;
  y: number;
}

export function buildBezierPath(points: Point[]): string {
  if (points.length < 2) return '';

  const start = points[0];
  const end = points[points.length - 1];

  if (points.length === 2) {
    const midY = (start.y + end.y) / 2;
    return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
  }

  // Use dagre control points
  let d = `M ${start.x} ${start.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cp = points[i];
    const next = points[i + 1] || end;
    d += ` Q ${cp.x} ${cp.y}, ${(cp.x + next.x) / 2} ${(cp.y + next.y) / 2}`;
  }
  d += ` L ${end.x} ${end.y}`;
  return d;
}

export function getMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const mid = Math.floor(points.length / 2);
  return points[mid];
}

export function getArrowheadPoints(
  target: Point,
  prev: Point,
  size: number = 8
): string {
  const angle = Math.atan2(target.y - prev.y, target.x - prev.x);
  const left = {
    x: target.x - size * Math.cos(angle - Math.PI / 6),
    y: target.y - size * Math.sin(angle - Math.PI / 6),
  };
  const right = {
    x: target.x - size * Math.cos(angle + Math.PI / 6),
    y: target.y - size * Math.sin(angle + Math.PI / 6),
  };
  return `${left.x},${left.y} ${target.x},${target.y} ${right.x},${right.y}`;
}
```

- [ ] **Step 4: Create Edge.module.css**

Create `src/edges/Edge.module.css`:

```css
.edgeLayer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.edgePath {
  fill: none;
  stroke: #d0d0d0;
  stroke-width: 1.5;
}

.edgePathSuccess {
  stroke: #d0d0d0;
}

.edgePathFailure {
  stroke: #d0d0d0;
}

.edgePathDashed {
  stroke-dasharray: 6 4;
}

.arrowhead {
  fill: #d0d0d0;
  stroke: none;
}

.edgeLabel {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
  pointer-events: none;
  user-select: none;
}

.edgeLabelDefault {
  background: #f1f5f9;
  color: #475569;
}

.edgeLabelSuccess {
  background: #f0fdf4;
  color: #15803d;
}

.edgeLabelFailure {
  background: #fef2f2;
  color: #dc2626;
}

.edgeLabelDashed {
  background: #f1f5f9;
  color: #475569;
}
```

- [ ] **Step 5: Create EdgeRenderer.tsx**

Create `src/edges/EdgeRenderer.tsx`:

```tsx
import React from 'react';
import type { FlowEdge } from '../types';
import type { LayoutEdge } from '../types';
import { buildBezierPath, getMidpoint, getArrowheadPoints } from './pathUtils';
import styles from './Edge.module.css';

interface EdgeRendererProps {
  edges: FlowEdge[];
  layoutEdges: LayoutEdge[];
}

export function EdgeRenderer({ edges, layoutEdges }: EdgeRendererProps) {
  const layoutMap = new Map(layoutEdges.map((le) => [le.id, le]));

  return (
    <svg className={styles.edgeLayer} data-testid="edge-layer">
      {edges.map((edge) => {
        const layout = layoutMap.get(edge.id);
        if (!layout || layout.points.length < 2) return null;

        const pathD = buildBezierPath(layout.points);
        const midpoint = getMidpoint(layout.points);
        const lastTwo = layout.points.slice(-2);
        const arrowPoints = getArrowheadPoints(lastTwo[1], lastTwo[0]);

        const pathClass = [
          styles.edgePath,
          edge.type === 'dashed' ? styles.edgePathDashed : '',
        ]
          .filter(Boolean)
          .join(' ');

        const labelClass = [
          styles.edgeLabel,
          edge.type === 'success'
            ? styles.edgeLabelSuccess
            : edge.type === 'failure'
              ? styles.edgeLabelFailure
              : edge.type === 'dashed'
                ? styles.edgeLabelDashed
                : styles.edgeLabelDefault,
        ].join(' ');

        return (
          <g key={edge.id} data-testid={`edge-${edge.id}`}>
            <path d={pathD} className={pathClass} />
            <polygon points={arrowPoints} className={styles.arrowhead} />
            {edge.label && (
              <foreignObject
                x={midpoint.x - 40}
                y={midpoint.y - 12}
                width={80}
                height={24}
                data-testid={`edge-label-${edge.id}`}
              >
                <div className={labelClass}>{edge.label}</div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 6: Update FlowCanvas to render edges with temporary layout**

Update `src/FlowCanvas.tsx` to include EdgeRenderer with temporary edge points computed from node positions:

```tsx
import React from 'react';
import type { FlowCanvasProps, LayoutEdge } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';

  // Temporary: stack nodes vertically for visual verification
  // Will be replaced by dagre auto-layout in Task 6
  const tempPositions = new Map<string, { x: number; y: number }>();
  diagram.nodes.forEach((node, i) => {
    tempPositions.set(node.id, { x: 200, y: i * 120 + 20 });
  });

  // Temporary edge layout: straight lines between node centers
  const tempEdgeLayouts: LayoutEdge[] = diagram.edges.map((edge) => {
    const sourcePos = tempPositions.get(edge.source) || { x: 0, y: 0 };
    const targetPos = tempPositions.get(edge.target) || { x: 0, y: 0 };
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: [
        { x: sourcePos.x + 80, y: sourcePos.y + 50 },
        { x: targetPos.x + 80, y: targetPos.y },
      ],
    };
  });

  return (
    <div
      data-testid="flow-canvas"
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}
    >
      <EdgeRenderer edges={diagram.edges} layoutEdges={tempEdgeLayouts} />
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={tempPositions.get(node.id)!}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
npx playwright test tests/e2e/render.spec.ts
```

Expected: ALL PASS.

- [ ] **Step 8: Commit**

```bash
git add src/edges/ src/FlowCanvas.tsx tests/e2e/render.spec.ts
git commit -m "feat: SVG edge rendering with bezier paths, arrowheads, and labels"
```

---

### Task 6: Auto-Layout with dagre

**Files:**
- Create: `src/layout/useAutoLayout.ts`
- Modify: `src/FlowCanvas.tsx`

- [ ] **Step 1: Write Playwright test for auto-layout**

Add to `tests/e2e/render.spec.ts`:

```typescript
test('nodes are positioned by auto-layout (not stacked)', async ({ page }) => {
  await page.goto('/');
  // Get positions of two nodes that should be at different y positions
  const startBox = await page.locator('[data-testid="node-start"]').boundingBox();
  const inputBox = await page.locator('[data-testid="node-input"]').boundingBox();
  expect(startBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  // Start should be above input in TB layout
  expect(startBox!.y).toBeLessThan(inputBox!.y);
});

test('decision node branches create horizontal spread', async ({ page }) => {
  await page.goto('/');
  const grantBox = await page.locator('[data-testid="node-grant"]').boundingBox();
  const denyBox = await page.locator('[data-testid="node-deny"]').boundingBox();
  expect(grantBox).not.toBeNull();
  expect(denyBox).not.toBeNull();
  // Grant and deny should be at similar y but different x (branching)
  expect(Math.abs(grantBox!.y - denyBox!.y)).toBeLessThan(50);
  expect(Math.abs(grantBox!.x - denyBox!.x)).toBeGreaterThan(50);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test tests/e2e/render.spec.ts --grep "auto-layout|branches"
```

Expected: FAIL — nodes are still in temporary stacked positions.

- [ ] **Step 3: Create useAutoLayout.ts**

Create `src/layout/useAutoLayout.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import dagre from 'dagre';
import type { FlowDiagram, LayoutResult, LayoutNode, LayoutEdge } from '../types';

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 60;

export function useAutoLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult | null {
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const computedRef = useRef(false);

  useEffect(() => {
    // Wait one frame for nodes to render and be measurable
    const rafId = requestAnimationFrame(() => {
      const result = computeLayout(diagram, nodeRefs);
      setLayout(result);
      computedRef.current = true;
    });
    return () => cancelAnimationFrame(rafId);
  }, [diagram, nodeRefs]);

  return layout;
}

export function computeLayout(
  diagram: FlowDiagram,
  nodeRefs: Map<string, HTMLElement | null>
): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  const direction = diagram.layout?.direction || 'TB';
  const nodeSpacing = diagram.layout?.nodeSpacing ?? 60;
  const rankSpacing = diagram.layout?.rankSpacing ?? 80;

  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes with measured or default dimensions
  for (const node of diagram.nodes) {
    const el = nodeRefs.get(node.id);
    const width = el ? el.offsetWidth : DEFAULT_NODE_WIDTH;
    const height = el ? el.offsetHeight : DEFAULT_NODE_HEIGHT;
    g.setNode(node.id, { width, height });
  }

  // Add edges
  for (const edge of diagram.edges) {
    g.setEdge(edge.source, edge.target, { id: edge.id });
  }

  dagre.layout(g);

  const layoutNodes: LayoutNode[] = diagram.nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      id: node.id,
      x: dagreNode.x - dagreNode.width / 2,
      y: dagreNode.y - dagreNode.height / 2,
      width: dagreNode.width,
      height: dagreNode.height,
    };
  });

  const layoutEdges: LayoutEdge[] = diagram.edges.map((edge) => {
    const dagreEdge = g.edge(edge.source, edge.target);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points: dagreEdge.points || [],
    };
  });

  const graphInfo = g.graph();

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: graphInfo.width || 0,
    height: graphInfo.height || 0,
  };
}
```

- [ ] **Step 4: Update FlowCanvas to use auto-layout**

Replace `src/FlowCanvas.tsx`:

```tsx
import React, { useRef, useCallback } from 'react';
import type { FlowCanvasProps } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';
  const nodeRefs = useRef(new Map<string, HTMLElement | null>());

  const setNodeRef = useCallback((id: string, el: HTMLElement | null) => {
    nodeRefs.current.set(id, el);
  }, []);

  const layout = useAutoLayout(diagram, nodeRefs.current);

  const nodePositions = new Map(
    (layout?.nodes || []).map((n) => [n.id, { x: n.x, y: n.y }])
  );

  return (
    <div
      data-testid="flow-canvas"
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}
    >
      {layout && (
        <EdgeRenderer edges={diagram.edges} layoutEdges={layout.edges} />
      )}
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={nodePositions.get(node.id) || { x: 0, y: 0 }}
          ref={(el) => setNodeRef(node.id, el)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Update FlowNodeRenderer to forward ref**

Update `src/nodes/FlowNodeRenderer.tsx` to use `React.forwardRef` so the outer positioning div can be measured:

```tsx
import React from 'react';
import type { FlowNode } from '../types';
import { DefaultNode } from './DefaultNode';
import { DecisionNode } from './DecisionNode';
import { StartEndNode } from './StartEndNode';

interface FlowNodeRendererProps {
  node: FlowNode;
  editable: boolean;
  position: { x: number; y: number };
  onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
}

export const FlowNodeRenderer = React.forwardRef<HTMLDivElement, FlowNodeRendererProps>(
  function FlowNodeRenderer({ node, editable, position, onDragStart }, ref) {
    const style: React.CSSProperties = {
      position: 'absolute',
      transform: `translate(${position.x}px, ${position.y}px)`,
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (editable && onDragStart) {
        onDragStart(node.id, e);
      }
    };

    const NodeComponent = getNodeComponent(node.type);

    return (
      <div ref={ref} style={style} onMouseDown={handleMouseDown} data-node-draggable={editable || undefined}>
        <NodeComponent node={node} editable={editable} />
      </div>
    );
  }
);

function getNodeComponent(type?: FlowNode['type']) {
  switch (type) {
    case 'decision':
      return DecisionNode;
    case 'start':
    case 'end':
      return StartEndNode;
    default:
      return DefaultNode;
  }
}
```

- [ ] **Step 6: Run tests**

```bash
npx playwright test tests/e2e/render.spec.ts
```

Expected: ALL PASS.

- [ ] **Step 7: Commit**

```bash
git add src/layout/ src/FlowCanvas.tsx src/nodes/FlowNodeRenderer.tsx tests/e2e/render.spec.ts
git commit -m "feat: dagre auto-layout — measure-then-layout positions nodes and routes edges"
```

---

### Task 7: Pan & Zoom Canvas

**Files:**
- Create: `src/hooks/usePanZoom.ts`
- Create: `src/canvas/CanvasView.tsx`
- Create: `src/canvas/CanvasView.module.css`
- Modify: `src/FlowCanvas.tsx`

- [ ] **Step 1: Write Playwright tests for canvas interaction**

Create `tests/e2e/canvas.spec.ts`:

```typescript
import { test, expect } from './setup';

test.describe('Canvas interaction', () => {
  test('canvas is pannable by dragging background', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="flow-canvas"]');
    await expect(canvas).toBeVisible();

    const startNode = page.locator('[data-testid="node-start"]');
    const beforeBox = await startNode.boundingBox();

    // Drag the canvas background (not a node)
    await canvas.hover({ position: { x: 10, y: 10 } });
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    const afterBox = await startNode.boundingBox();
    // Node should have moved with the canvas pan
    expect(afterBox!.x).not.toEqual(beforeBox!.x);
  });

  test('canvas is zoomable with scroll wheel', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="flow-canvas"]');

    const startNode = page.locator('[data-testid="node-start"]');
    const beforeBox = await startNode.boundingBox();

    // Zoom out
    await canvas.hover();
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);

    const afterBox = await startNode.boundingBox();
    // Node should appear smaller after zoom out
    expect(afterBox!.width).toBeLessThan(beforeBox!.width);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test tests/e2e/canvas.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Create usePanZoom.ts**

Create `src/hooks/usePanZoom.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';

interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.001;

export function usePanZoom(fitViewTransform?: PanZoomState) {
  const [transform, setTransform] = useState<PanZoomState>(
    fitViewTransform || { x: 0, y: 0, scale: 1 }
  );
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on background (not on nodes)
      if ((e.target as HTMLElement).closest('[data-node-draggable]')) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    },
    [transform.x, transform.y]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
    },
    []
  );

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    setTransform((prev) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta * prev.scale));
      // Zoom toward cursor position
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaleChange = newScale / prev.scale;
      return {
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange,
        scale: newScale,
      };
    });
  }, []);

  const setFitView = useCallback((newTransform: PanZoomState) => {
    setTransform(newTransform);
  }, []);

  return {
    transform,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    setFitView,
  };
}
```

- [ ] **Step 4: Create CanvasView.module.css**

Create `src/canvas/CanvasView.module.css`:

```css
.canvas {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}

.canvasInner {
  transform-origin: 0 0;
  position: absolute;
  top: 0;
  left: 0;
}
```

- [ ] **Step 5: Create CanvasView.tsx**

Create `src/canvas/CanvasView.tsx`:

```tsx
import React from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import styles from './CanvasView.module.css';

interface CanvasViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CanvasView({ children, className }: CanvasViewProps) {
  const { transform, onMouseDown, onMouseMove, onMouseUp, onWheel } = usePanZoom();

  return (
    <div
      data-testid="flow-canvas"
      className={`${styles.canvas} ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        className={styles.canvasInner}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update FlowCanvas to use CanvasView**

Update `src/FlowCanvas.tsx` to wrap content in CanvasView:

```tsx
import React, { useRef, useCallback } from 'react';
import type { FlowCanvasProps } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';
import { CanvasView } from './canvas/CanvasView';

export function FlowCanvas({ diagram, mode = 'view', className }: FlowCanvasProps) {
  const editable = mode === 'edit';
  const nodeRefs = useRef(new Map<string, HTMLElement | null>());

  const setNodeRef = useCallback((id: string, el: HTMLElement | null) => {
    nodeRefs.current.set(id, el);
  }, []);

  const layout = useAutoLayout(diagram, nodeRefs.current);

  const nodePositions = new Map(
    (layout?.nodes || []).map((n) => [n.id, { x: n.x, y: n.y }])
  );

  return (
    <CanvasView className={className}>
      {layout && (
        <EdgeRenderer edges={diagram.edges} layoutEdges={layout.edges} />
      )}
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={nodePositions.get(node.id) || { x: 0, y: 0 }}
          ref={(el) => setNodeRef(node.id, el)}
        />
      ))}
    </CanvasView>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
npx playwright test tests/e2e/canvas.spec.ts tests/e2e/render.spec.ts
```

Expected: ALL PASS.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/usePanZoom.ts src/canvas/ src/FlowCanvas.tsx tests/e2e/canvas.spec.ts
git commit -m "feat: infinite canvas with pan and zoom"
```

---

### Task 8: Drag Nodes (Edit Mode)

**Files:**
- Create: `src/hooks/useDragNode.ts`
- Modify: `src/FlowCanvas.tsx`

- [ ] **Step 1: Write Playwright tests for edit mode**

Create `tests/e2e/edit-mode.spec.ts`:

```typescript
import { test, expect } from './setup';

test.describe('Edit mode', () => {
  test('dragging a node changes its position', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-input"]');
    await expect(node).toBeVisible();

    const beforeBox = await node.boundingBox();

    // Drag the node
    await node.hover();
    await page.mouse.down();
    await page.mouse.move(beforeBox!.x + 100, beforeBox!.y + 50, { steps: 5 });
    await page.mouse.up();

    const afterBox = await node.boundingBox();
    expect(afterBox!.x).not.toEqual(beforeBox!.x);
  });

  test('onDiagramChange fires after drag', async ({ page }) => {
    await page.goto('/');

    // The demo app logs onDiagramChange to console
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });

    const node = page.locator('[data-testid="node-input"]');
    const box = await node.boundingBox();

    await node.hover();
    await page.mouse.down();
    await page.mouse.move(box!.x + 80, box!.y + 40, { steps: 5 });
    await page.mouse.up();

    // Wait for console message from onDiagramChange
    await page.waitForTimeout(200);
    expect(consoleMessages.length).toBeGreaterThan(0);
  });

  test('nodes have data-node-draggable attribute in edit mode', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-input"]');
    const wrapper = node.locator('..');
    await expect(wrapper).toHaveAttribute('data-node-draggable', 'true');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx playwright test tests/e2e/edit-mode.spec.ts
```

Expected: FAIL — drag doesn't change position yet.

- [ ] **Step 3: Create useDragNode.ts**

Create `src/hooks/useDragNode.ts`:

```typescript
import { useCallback, useRef, useState } from 'react';

interface NodePositions {
  [nodeId: string]: { x: number; y: number };
}

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function useDragNode(
  initialPositions: NodePositions,
  scale: number,
  onPositionChange?: (positions: NodePositions) => void
) {
  const [positions, setPositions] = useState<NodePositions>(initialPositions);
  const dragState = useRef<DragState | null>(null);

  // Update positions when layout changes (but not during drag)
  const updatePositions = useCallback((newPositions: NodePositions) => {
    if (!dragState.current) {
      setPositions(newPositions);
    }
  }, []);

  const onDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const pos = positions[nodeId];
      if (!pos) return;
      dragState.current = {
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
      };
    },
    [positions]
  );

  const onDragMove = useCallback(
    (e: React.MouseEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      setPositions((prev) => ({
        ...prev,
        [drag.nodeId]: {
          x: drag.originX + dx,
          y: drag.originY + dy,
        },
      }));
    },
    [scale]
  );

  const onDragEnd = useCallback(() => {
    if (dragState.current) {
      dragState.current = null;
      // Use functional update to read latest positions (avoids stale closure)
      setPositions((current) => {
        if (onPositionChange) {
          onPositionChange(current);
        }
        return current;
      });
    }
  }, [onPositionChange]);

  return {
    positions,
    updatePositions,
    onDragStart,
    onDragMove,
    onDragEnd,
  };
}
```

- [ ] **Step 4: Integrate drag into FlowCanvas**

Update `src/FlowCanvas.tsx` to wire up drag handlers:

```tsx
import React, { useRef, useCallback, useEffect } from 'react';
import type { FlowCanvasProps, FlowDiagram } from './types';
import { FlowNodeRenderer } from './nodes/FlowNodeRenderer';
import { EdgeRenderer } from './edges/EdgeRenderer';
import { useAutoLayout } from './layout/useAutoLayout';
import { CanvasView } from './canvas/CanvasView';
import { useDragNode } from './hooks/useDragNode';

export function FlowCanvas({ diagram, mode = 'view', className, onDiagramChange }: FlowCanvasProps) {
  const editable = mode === 'edit';
  const nodeRefs = useRef(new Map<string, HTMLElement | null>());

  const setNodeRef = useCallback((id: string, el: HTMLElement | null) => {
    nodeRefs.current.set(id, el);
  }, []);

  const layout = useAutoLayout(diagram, nodeRefs.current);

  const layoutPositions: { [id: string]: { x: number; y: number } } = {};
  for (const n of layout?.nodes || []) {
    layoutPositions[n.id] = { x: n.x, y: n.y };
  }

  const handlePositionChange = useCallback(
    (nodePositions: { [id: string]: { x: number; y: number } }) => {
      if (onDiagramChange) {
        onDiagramChange({
          ...diagram,
          _positions: nodePositions,
        } as FlowDiagram);
      }
    },
    [diagram, onDiagramChange]
  );

  const { positions, updatePositions, onDragStart, onDragMove, onDragEnd } = useDragNode(
    layoutPositions,
    1, // scale — will be connected to CanvasView transform in integration
    handlePositionChange
  );

  useEffect(() => {
    updatePositions(layoutPositions);
  }, [layout]);

  return (
    <CanvasView className={className} onDragMove={editable ? onDragMove : undefined} onDragEnd={editable ? onDragEnd : undefined}>
      {layout && (
        <EdgeRenderer edges={diagram.edges} layoutEdges={layout.edges} />
      )}
      {diagram.nodes.map((node) => (
        <FlowNodeRenderer
          key={node.id}
          node={node}
          editable={editable}
          position={positions[node.id] || { x: 0, y: 0 }}
          onDragStart={editable ? onDragStart : undefined}
          ref={(el) => setNodeRef(node.id, el)}
        />
      ))}
    </CanvasView>
  );
}
```

- [ ] **Step 5: Update CanvasView to accept drag event forwarding**

Update `src/canvas/CanvasView.tsx` to pass through drag events:

```tsx
import React from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import styles from './CanvasView.module.css';

interface CanvasViewProps {
  children: React.ReactNode;
  className?: string;
  onDragMove?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
}

export function CanvasView({ children, className, onDragMove, onDragEnd }: CanvasViewProps) {
  const { transform, onMouseDown, onMouseMove, onMouseUp, onWheel } = usePanZoom();

  const handleMouseMove = (e: React.MouseEvent) => {
    onMouseMove(e);
    if (onDragMove) onDragMove(e);
  };

  const handleMouseUp = () => {
    onMouseUp();
    if (onDragEnd) onDragEnd();
  };

  return (
    <div
      data-testid="flow-canvas"
      className={`${styles.canvas} ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={onWheel}
    >
      <div
        className={styles.canvasInner}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
npx playwright test
```

Expected: ALL tests PASS across all spec files.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useDragNode.ts src/canvas/CanvasView.tsx src/FlowCanvas.tsx tests/e2e/edit-mode.spec.ts
git commit -m "feat: edit mode — drag nodes to reposition, fires onDiagramChange"
```

---

### Task 9: Fit View

**Files:**
- Modify: `src/hooks/usePanZoom.ts`
- Modify: `src/canvas/CanvasView.tsx`
- Modify: `src/FlowCanvas.tsx`

- [ ] **Step 1: Write Playwright test for fitView**

Add to `tests/e2e/canvas.spec.ts`:

```typescript
test('fitView makes all nodes visible on load', async ({ page }) => {
  await page.goto('/');
  // All 7 nodes should be visible within the viewport
  for (const id of ['start', 'input', 'validate', 'grant', 'deny', 'end-success', 'end-fail']) {
    const node = page.locator(`[data-testid="node-${id}"]`);
    await expect(node).toBeVisible();
    const box = await node.boundingBox();
    expect(box).not.toBeNull();
    // Node should be within viewport
    expect(box!.x).toBeGreaterThanOrEqual(-10);
    expect(box!.y).toBeGreaterThanOrEqual(-10);
  }
});
```

- [ ] **Step 2: Run test to verify current state**

```bash
npx playwright test tests/e2e/canvas.spec.ts --grep "fitView"
```

This may pass or fail depending on default positioning. If it passes, good. If not, proceed.

- [ ] **Step 3: Add fitView calculation to CanvasView**

Update `src/canvas/CanvasView.tsx` to accept layout dimensions and compute fit transform:

```tsx
import React, { useEffect, useRef } from 'react';
import { usePanZoom } from '../hooks/usePanZoom';
import styles from './CanvasView.module.css';

interface CanvasViewProps {
  children: React.ReactNode;
  className?: string;
  onDragMove?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  fitView?: boolean;
  contentWidth?: number;
  contentHeight?: number;
}

export function CanvasView({
  children,
  className,
  onDragMove,
  onDragEnd,
  fitView = true,
  contentWidth,
  contentHeight,
}: CanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { transform, onMouseDown, onMouseMove, onMouseUp, onWheel, setFitView } = usePanZoom();

  useEffect(() => {
    if (!fitView || !contentWidth || !contentHeight || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 40;
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in past 1x
    const x = (rect.width - contentWidth * scale) / 2;
    const y = (rect.height - contentHeight * scale) / 2;
    setFitView({ x, y, scale });
  }, [fitView, contentWidth, contentHeight, setFitView]);

  const handleMouseMove = (e: React.MouseEvent) => {
    onMouseMove(e);
    if (onDragMove) onDragMove(e);
  };

  const handleMouseUp = () => {
    onMouseUp();
    if (onDragEnd) onDragEnd();
  };

  return (
    <div
      ref={containerRef}
      data-testid="flow-canvas"
      className={`${styles.canvas} ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={onWheel}
    >
      <div
        className={styles.canvasInner}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Pass layout dimensions from FlowCanvas to CanvasView**

Update the `<CanvasView>` usage in `src/FlowCanvas.tsx` to pass `contentWidth` and `contentHeight`:

```tsx
<CanvasView
  className={className}
  onDragMove={editable ? onDragMove : undefined}
  onDragEnd={editable ? onDragEnd : undefined}
  fitView={true}
  contentWidth={layout?.width}
  contentHeight={layout?.height}
>
```

- [ ] **Step 5: Run all tests**

```bash
npx playwright test
```

Expected: ALL PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePanZoom.ts src/canvas/CanvasView.tsx src/FlowCanvas.tsx tests/e2e/canvas.spec.ts
git commit -m "feat: fitView auto-zooms to show all content on mount"
```

---

### Task 10: FlowCanvas.module.css & Polish

**Files:**
- Create: `src/FlowCanvas.module.css`
- Modify: `src/FlowCanvas.tsx`

- [ ] **Step 1: Create FlowCanvas.module.css**

Create `src/FlowCanvas.module.css`:

```css
.root {
  width: 100%;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
}

.root * {
  box-sizing: border-box;
}
```

- [ ] **Step 2: Apply root styles in FlowCanvas.tsx**

Import and apply the CSS module class to the root `<CanvasView>` wrapper.

- [ ] **Step 3: Run all tests one final time**

```bash
npx playwright test
```

Expected: ALL PASS.

- [ ] **Step 4: Verify library builds**

```bash
npx vite build
ls dist/
```

Expected: `drawing-mvp.js`, `drawing-mvp.cjs`, `style.css` present in `dist/`.

- [ ] **Step 5: Commit**

```bash
git add src/FlowCanvas.module.css src/FlowCanvas.tsx
git commit -m "feat: root styles and verified library build output"
```

---

### Task 11: Final Integration Test

**Files:**
- Modify: `tests/e2e/render.spec.ts`

- [ ] **Step 1: Add comprehensive integration test**

Add to `tests/e2e/render.spec.ts`:

```typescript
test('full diagram renders with all node types, edges, and labels', async ({ page }) => {
  await page.goto('/');

  // All 7 nodes visible
  const nodes = page.locator('[data-testid^="node-"]');
  await expect(nodes).toHaveCount(7);

  // All 6 edges rendered
  const edges = page.locator('[data-testid^="edge-e"]');
  await expect(edges).toHaveCount(6);

  // Edge labels present
  await expect(page.locator('[data-testid="edge-label-e3"]')).toContainText('Yes');
  await expect(page.locator('[data-testid="edge-label-e4"]')).toContainText('No');

  // Node types rendered correctly
  await expect(page.locator('[data-testid="start-indicator"]')).toBeVisible();
  await expect(page.locator('[data-testid="decision-badge"]')).toBeVisible();
  const endIndicators = page.locator('[data-testid="end-indicator"]');
  await expect(endIndicators).toHaveCount(2);

  // Sections rendered
  const grantNode = page.locator('[data-testid="node-grant"]');
  await expect(grantNode).toContainText('Session');
  await expect(grantNode).toContainText('Redirect');
});
```

- [ ] **Step 2: Run all tests**

```bash
npx playwright test
```

Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/render.spec.ts
git commit -m "test: comprehensive integration test for full diagram rendering"
```
