import type { ComponentType } from 'react';

export type EdgeRouting = 'curved' | 'orthogonal' | 'straight';

export interface FlowDiagram {
  title?: string;
  layout?: {
    direction?: 'TB' | 'LR' | 'BT' | 'RL';
    nodeSpacing?: number;
    rankSpacing?: number;
    routing?: EdgeRouting;
    cornerRadius?: number;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Computed node positions from edit mode. Present in onDiagramChange output. */
  _positions?: { [nodeId: string]: { x: number; y: number } };
}

export interface FlowNode {
  id: string;
  type?: 'default' | 'decision' | 'start' | 'end' | 'group';
  label: string;
  description?: string;
  parentId?: string; // ID of the group node this node belongs to
  sections?: NodeSection[];
  icon?: string | ComponentType<{ size?: number; color?: string }>;
  collapsed?: boolean;
  collapsible?: boolean;
  style?: {
    color?: string;
    variant?: 'filled' | 'outlined' | 'ghost';
    glow?: boolean; // animated gradient border
  };
  status?: 'online' | 'offline' | 'warning' | 'error' | 'idle';
  progress?: number; // 0-100, renders a progress bar
  flowRate?: string; // e.g., "1.2 MW", "340 Gbps" — displayed as a badge
  branchCollapsed?: boolean; // if true, hide all downstream nodes
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
  routing?: EdgeRouting;
  animated?: boolean;
  color?: string;
  flowAnimation?: boolean; // directional pulse traveling along the edge
}

export type CanvasBackground = 'dots' | 'isometric' | 'plain';

export interface CustomNodeProps {
  node: FlowNode;
  editable: boolean;
}

export interface ContextMenuItem {
  label: string;
  action: (nodeId: string, node: FlowNode) => void;
  icon?: string;
}

export interface SidebarNodeTemplate {
  type: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface FlowCanvasProps {
  diagram: FlowDiagram;
  mode?: 'view' | 'edit';
  onDiagramChange?: (diagram: FlowDiagram) => void;
  className?: string;
  fitView?: boolean;
  background?: CanvasBackground;
  minimap?: boolean | { width?: number; height?: number; position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' };
  theme?: 'light' | 'dark';
  onNodeClick?: (nodeId: string, node: FlowNode) => void;
  nodeRenderers?: Record<string, ComponentType<CustomNodeProps>>;
  onContextMenu?: (nodeId: string, node: FlowNode, position: { x: number; y: number }) => void;
  contextMenu?: boolean | {
    items?: ContextMenuItem[];
  };
  onNodeCollapse?: (nodeId: string, collapsed: boolean) => void;
  sidebar?: SidebarNodeTemplate[];
  onNodeDrop?: (template: SidebarNodeTemplate, position: { x: number; y: number }) => void;
  themeToggle?: boolean; // show built-in theme toggle button
  onThemeChange?: (theme: 'light' | 'dark') => void;
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
