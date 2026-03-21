import React from 'react';
import type { FlowNode } from '../types';
import styles from './BusNode.module.css';

interface BusNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function BusNode({ node, editable }: BusNodeProps) {
  const orientation = node.description === 'vertical' ? 'vertical' : 'horizontal';

  return (
    <div
      className={`${styles.bus} ${orientation === 'vertical' ? styles.vertical : styles.horizontal}`}
      data-testid={`node-${node.id}`}
      data-editable={editable}
      style={node.style?.color ? { backgroundColor: node.style.color } : undefined}
    >
      {node.label && <div className={styles.label}>{node.label}</div>}
    </div>
  );
}
