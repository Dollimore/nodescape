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
  type?: 'default' | 'decision' | 'start' | 'end';
  label: string;
  description?: string;
  sections?: NodeSection[];
  icon?: string | ComponentType<{ size?: number; color?: string }>;
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
  routing?: EdgeRouting;
}

export type CanvasBackground = 'dots' | 'isometric' | 'plain';

export interface FlowCanvasProps {
  diagram: FlowDiagram;
  mode?: 'view' | 'edit';
  onDiagramChange?: (diagram: FlowDiagram) => void;
  className?: string;
  fitView?: boolean;
  background?: CanvasBackground;
  minimap?: boolean | { width?: number; height?: number; position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' };
  theme?: 'light' | 'dark';
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
