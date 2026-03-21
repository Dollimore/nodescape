import React from 'react';
import type { FlowNode } from '../types';
import styles from './GroupNode.module.css';

interface GroupNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function GroupNode({ node, editable }: GroupNodeProps) {
  const color = node.style?.color;

  const groupStyle: React.CSSProperties = {};
  if (color) {
    groupStyle.borderColor = color;
    groupStyle.backgroundColor = `${color}08`; // very subtle tint
  }

  return (
    <div
      className={styles.group}
      data-testid={`node-${node.id}`}
      data-editable={editable}
      style={groupStyle}
    >
      <div className={styles.groupLabel} style={color ? { color } : undefined}>
        {node.label}
      </div>
      {node.description && <div className={styles.groupDescription}>{node.description}</div>}
    </div>
  );
}
