import React from 'react';
import type { FlowNode } from '../types';
import defaultStyles from './DefaultNode.module.css';
import styles from './DecisionNode.module.css';

interface DecisionNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function DecisionNode({ node, editable }: DecisionNodeProps) {
  return (
    <div
      className={defaultStyles.node}
      data-testid={`node-${node.id}`}
      data-editable={editable}
    >
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleTop} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleBottom} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleLeft} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleRight} />
      <div className={styles.header}>
        <div className={styles.badge} data-testid="decision-badge">
          <div className={styles.diamond} />
        </div>
        <div className={defaultStyles.label}>{node.label}</div>
      </div>
      {node.description && <div className={defaultStyles.description}>{node.description}</div>}
    </div>
  );
}
