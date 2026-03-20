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
