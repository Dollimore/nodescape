import React from 'react';
import type { FlowNode } from '../types';
import defaultStyles from './DefaultNode.module.css';
import styles from './DecisionNode.module.css';
import { NodeIcon } from './NodeIcon';

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
        {node.icon ? (
          <span style={{ flexShrink: 0 }}>
            <NodeIcon icon={node.icon} size={16} color={node.style?.color || '#666'} />
          </span>
        ) : (
          <div className={styles.badge} data-testid="decision-badge">
            <div className={styles.diamond} />
          </div>
        )}
        <div className={defaultStyles.label}>{node.label}</div>
      </div>
      {node.description && <div className={defaultStyles.description}>{node.description}</div>}
    </div>
  );
}
