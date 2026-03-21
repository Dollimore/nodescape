import React from 'react';
import type { FlowNode } from '../types';
import { NodeIcon } from './NodeIcon';
import styles from './SingleLineNode.module.css';

interface SingleLineNodeProps {
  node: FlowNode;
  editable: boolean;
  // Accept (and ignore) extra props that FlowNodeRenderer may pass
  [key: string]: unknown;
}

export function SingleLineNode({ node, editable }: SingleLineNodeProps) {
  return (
    <div className={styles.node} data-testid={`node-${node.id}`} data-editable={editable}>
      {node.icon && (
        <div className={styles.icon}>
          <NodeIcon icon={node.icon} size={20} />
        </div>
      )}
      <div className={styles.label}>{node.label}</div>
      {node.flowRate && <div className={styles.value}>{node.flowRate}</div>}
      {node.status && <div className={styles.status} data-status={node.status} />}
    </div>
  );
}
