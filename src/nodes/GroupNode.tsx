import React from 'react';
import type { FlowNode } from '../types';
import styles from './GroupNode.module.css';

interface GroupNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function GroupNode({ node, editable }: GroupNodeProps) {
  return (
    <div
      className={styles.group}
      data-testid={`node-${node.id}`}
      data-editable={editable}
    >
      <div className={styles.groupLabel}>{node.label}</div>
      {node.description && <div className={styles.groupDescription}>{node.description}</div>}
    </div>
  );
}
