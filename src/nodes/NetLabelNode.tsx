import React from 'react';
import type { FlowNode } from '../types';
import styles from './NetLabelNode.module.css';

interface NetLabelNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function NetLabelNode({ node, editable }: NetLabelNodeProps) {
  return (
    <div
      className={styles.netlabel}
      data-testid={`node-${node.id}`}
      data-editable={editable}
      style={node.style?.color ? { borderColor: node.style.color, color: node.style.color } : undefined}
    >
      <div className={styles.label}>{node.label}</div>
      <div className={styles.flag} />
    </div>
  );
}
