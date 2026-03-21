import React from 'react';
import type { FlowDiagram } from '../types';
import styles from './Legend.module.css';

interface LegendProps {
  diagram: FlowDiagram;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function Legend({ diagram, position = 'top-right' }: LegendProps) {
  // Collect unique node colors
  const nodeColors = new Map<string, string>();
  for (const node of diagram.nodes) {
    if (node.style?.color && node.type !== 'group' && node.type !== 'netlabel') {
      const label = node.label.split(' ').slice(0, 2).join(' ');
      if (!nodeColors.has(node.style.color)) {
        nodeColors.set(node.style.color, label);
      }
    }
  }

  // Collect unique edge colors
  const edgeColors = new Map<string, string>();
  for (const edge of diagram.edges) {
    if (edge.color && !edgeColors.has(edge.color)) {
      const label = edge.label || edge.annotation || edge.id;
      edgeColors.set(edge.color, label);
    }
  }

  // Collect unique statuses
  const statuses = new Set<string>();
  for (const node of diagram.nodes) {
    if (node.status) statuses.add(node.status);
  }

  // Collect edge types
  const edgeTypes = new Set<string>();
  for (const edge of diagram.edges) {
    if (edge.type && edge.type !== 'default') edgeTypes.add(edge.type);
    if (edge.animated) edgeTypes.add('animated');
    if (edge.flowAnimation) edgeTypes.add('flow');
  }

  // Collect group colors
  const groupColors = new Map<string, string>();
  for (const node of diagram.nodes) {
    if (node.type === 'group' && node.style?.color) {
      groupColors.set(node.style.color, node.label);
    }
  }

  const positionClass = styles[position.replace('-', '')] || styles.topright;

  return (
    <div className={`${styles.legend} ${positionClass}`}>
      <div className={styles.title}>Legend</div>

      {groupColors.size > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Zones</div>
          {Array.from(groupColors).map(([color, label]) => (
            <div key={color} className={styles.item}>
              <div className={styles.groupSwatch} style={{ borderColor: color }} />
              <span className={styles.label}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {nodeColors.size > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Components</div>
          {Array.from(nodeColors).map(([color, label]) => (
            <div key={color} className={styles.item}>
              <div className={styles.nodeSwatch} style={{ backgroundColor: color }} />
              <span className={styles.label}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {edgeColors.size > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Connections</div>
          {Array.from(edgeColors).map(([color, label]) => (
            <div key={color} className={styles.item}>
              <div className={styles.edgeSwatch}>
                <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={color} strokeWidth="2" /></svg>
              </div>
              <span className={styles.label}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {statuses.size > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Status</div>
          {Array.from(statuses).map(status => (
            <div key={status} className={styles.item}>
              <div className={styles.statusDot} data-status={status} />
              <span className={styles.label}>{status}</span>
            </div>
          ))}
        </div>
      )}

      {edgeTypes.size > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Line Types</div>
          {edgeTypes.has('dashed') && (
            <div className={styles.item}>
              <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="var(--fc-edge)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
              <span className={styles.label}>Standby / Backup</span>
            </div>
          )}
          {(edgeTypes.has('animated') || edgeTypes.has('flow')) && (
            <div className={styles.item}>
              <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="var(--fc-edge)" strokeWidth="2" strokeDasharray="4 3" /></svg>
              <span className={styles.label}>Active Flow</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
