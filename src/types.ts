import type { ComponentType, MouseEvent, ReactNode } from 'react';
import type { Alarm } from './scada/AlarmBanner';

export type EdgeRouting = 'curved' | 'orthogonal' | 'straight';

export interface FlowDiagram {
  title?: string;
  layout?: {
    engine?: 'dagre' | 'force';
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

export interface NodePort {
  id: string;           // unique port identifier within the node
  label?: string;       // displayed label (e.g., "E", "B", "C", "VCC")
  side: 'top' | 'bottom' | 'left' | 'right';
  position?: number;    // 0-1, position along that side (0.5 = center, default)
}

export interface FlowNode {
  id: string;
  type?: 'default' | 'decision' | 'start' | 'end' | 'group' | 'bus' | 'netlabel';
  label: string;
  description?: string;
  parentId?: string; // ID of the group node this node belongs to
  sections?: NodeSection[];
  icon?: string | ComponentType<{ size?: number; color?: string }>;
  collapsed?: boolean;
  collapsible?: boolean;
  ports?: NodePort[];
  rotation?: 0 | 90 | 180 | 270;
  style?: {
    color?: string;
    variant?: 'filled' | 'outlined' | 'ghost';
    glow?: boolean; // animated gradient border
  };
  status?: 'online' | 'offline' | 'warning' | 'error' | 'idle';
  progress?: number; // 0-100, renders a progress bar
  setpoint?: number; // 0-100, shows target marker on progress bar
  flowRate?: string; // e.g., "1.2 MW", "340 Gbps" — displayed as a badge
  branchCollapsed?: boolean; // if true, hide all downstream nodes
  detail?: NodeDetail;
}

export interface NodeDetail {
  title?: string;
  content?: string; // markdown content
  sections?: DetailSection[];
}

export interface DetailSection {
  type: 'text' | 'keyvalue' | 'chart' | 'table' | 'timeline' | 'gallery' | 'trend' | 'loadprofile' | 'meritorder' | 'custom';
  title?: string;
  data?: any;
}

export interface NodeSection {
  heading?: string;
  content: string;
}

export interface EdgeMeasurement {
  label: string;     // "V", "A", "W", "Hz", "MW", custom
  value: string | number;
  unit?: string;
  position?: number; // 0-1 along edge, default 0.5
  status?: 'normal' | 'warning' | 'critical';
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;  // port ID on the source node
  targetPort?: string;  // port ID on the target node
  label?: string;
  type?: 'default' | 'success' | 'failure' | 'dashed' | 'wire';
  routing?: EdgeRouting;
  animated?: boolean;
  color?: string;
  flowAnimation?: boolean; // directional pulse traveling along the edge
  showJunction?: boolean; // show a filled dot at source/target connection points
  showHops?: boolean; // render small semicircle hops to indicate crossovers with other wires
  annotation?: string;          // component value displayed near the edge (e.g., "10K", "22uF")
  annotationPosition?: number;  // 0-1, where along the edge to place it (default 0.5)
  thickness?: number;           // override stroke width (for current-based thickness)
  measurements?: EdgeMeasurement[];
}

export type CanvasBackground = 'dots' | 'isometric' | 'plain';

export interface CustomNodeProps {
  node: FlowNode;
  editable: boolean;
  onCollapseToggle?: (nodeId: string, collapsed: boolean) => void;
  onHandleDrag?: (nodeId: string, side: string, e: MouseEvent) => void;
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
  themeToggle?: boolean;
  onThemeChange?: (theme: 'light' | 'dark') => void;
  zoomControls?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  onNodesDelete?: (nodeIds: string[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onNodesCopy?: (nodes: FlowNode[]) => void;
  onNodesPaste?: (position: { x: number; y: number }) => void;
  onEdgeCreate?: (source: string, target: string) => void;
  onNodeLabelChange?: (nodeId: string, newLabel: string) => void;
  contextualZoom?: boolean;
  displayMode?: 'standard' | 'single-line';
  detailPanel?: boolean | { width?: number; position?: 'right' | 'left' };
  renderDetailSection?: (section: DetailSection, node: FlowNode) => ReactNode;
  legend?: boolean | { position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' };
  story?: StoryConfig;
  onStoryStepChange?: (stepIndex: number, step: StoryStep) => void;
  alarms?: Alarm[];
  onAlarmClick?: (alarm: Alarm) => void;
  onAlarmAcknowledge?: (alarmId: string) => void;
}

export interface StoryStep {
  nodeId: string;
  title?: string;
  content?: string; // markdown
  duration?: number; // auto-advance after ms (optional)
}

export interface StoryConfig {
  steps: StoryStep[];
  autoPlay?: boolean;
  autoPlayInterval?: number; // ms between steps, default 5000
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
