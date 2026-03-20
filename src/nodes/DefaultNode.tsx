import React from 'react';
import type { FlowNode } from '../types';
import styles from './DefaultNode.module.css';

interface DefaultNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function DefaultNode({ node, editable }: DefaultNodeProps) {
  const customColor = node.style?.color;
  const variant = node.style?.variant || 'outlined';

  const nodeStyle: React.CSSProperties = {};
  if (customColor && variant === 'outlined') {
    nodeStyle.borderColor = customColor;
  } else if (customColor && variant === 'filled') {
    nodeStyle.borderColor = customColor;
    nodeStyle.backgroundColor = customColor;
    nodeStyle.color = '#fff';
  } else if (variant === 'ghost') {
    nodeStyle.border = 'none';
    nodeStyle.boxShadow = 'none';
  }

  return (
    <div
      className={styles.node}
      data-testid={`node-${node.id}`}
      data-editable={editable}
      style={nodeStyle}
    >
      <div className={styles.handle + ' ' + styles.handleTop} />
      <div className={styles.handle + ' ' + styles.handleBottom} />
      <div className={styles.label}>{node.label}</div>
      {node.description && <div className={styles.description}>{node.description}</div>}
      {node.sections && node.sections.length > 0 && (
        <div className={styles.sections}>
          {node.sections.map((section, i) => (
            <div key={i} className={styles.section}>
              {section.heading && (
                <div className={styles.sectionHeading}>{section.heading}</div>
              )}
              <div className={styles.sectionContent}>{section.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
