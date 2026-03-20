import React from 'react';
import type { FlowNode } from '../types';
import defaultStyles from './DefaultNode.module.css';
import styles from './StartEndNode.module.css';
import { NodeIcon } from './NodeIcon';

interface StartEndNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function StartEndNode({ node, editable }: StartEndNodeProps) {
  const isStart = node.type === 'start';

  return (
    <div
      className={defaultStyles.node}
      data-testid={`node-${node.id}`}
      data-editable={editable}
    >
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleTop} />
      <div className={defaultStyles.handle + ' ' + defaultStyles.handleBottom} />
      <div className={styles.header}>
        {node.icon ? (
          <span style={{ flexShrink: 0 }}>
            <NodeIcon icon={node.icon} size={16} color={node.style?.color || '#666'} />
          </span>
        ) : (
          <div
            className={`${styles.indicator} ${isStart ? styles.indicatorStart : styles.indicatorEnd}`}
            data-testid={isStart ? 'start-indicator' : 'end-indicator'}
          >
            <div className={`${styles.dot} ${isStart ? styles.dotStart : styles.dotEnd}`} />
          </div>
        )}
        <div className={defaultStyles.label}>{node.label}</div>
      </div>
      {node.description && <div className={defaultStyles.description}>{node.description}</div>}
    </div>
  );
}
