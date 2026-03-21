import React, { useState } from 'react';
import type { FlowNode } from '../types';
import styles from './DefaultNode.module.css';
import { NodeIcon } from './NodeIcon';
import { SimpleMarkdown } from './SimpleMarkdown';

interface DefaultNodeProps {
  node: FlowNode;
  editable: boolean;
}

export function DefaultNode({ node, editable }: DefaultNodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(node.collapsed ?? false);

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

  const hasSections = node.sections && node.sections.length > 0;

  return (
    <div
      className={`${styles.node} ${node.style?.glow ? styles.nodeGlow : ''}`}
      data-testid={`node-${node.id}`}
      data-editable={editable}
      style={{ ...nodeStyle, position: 'relative' }}
    >
      {node.status && (
        <div className={styles.statusBadge} data-status={node.status} />
      )}
      <div className={styles.handle + ' ' + styles.handleTop} />
      <div className={styles.handle + ' ' + styles.handleBottom} />
      <div className={styles.labelRow}>
        {node.icon ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ flexShrink: 0 }}>
              <NodeIcon icon={node.icon} size={16} color={node.style?.color || '#666'} />
            </span>
            <div className={styles.label} style={{ marginBottom: 0 }}>{node.label}</div>
          </div>
        ) : (
          <div className={styles.label} style={{ marginBottom: 0 }}>{node.label}</div>
        )}
        {hasSections && (
          <button
            className={styles.collapseToggle}
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            aria-label={isCollapsed ? 'Expand sections' : 'Collapse sections'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" style={{
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>
              <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {node.description && <SimpleMarkdown text={node.description} className={styles.description} />}
      {node.flowRate && (
        <div className={styles.flowRate}>{node.flowRate}</div>
      )}
      {node.progress !== undefined && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, node.progress))}%` }} />
        </div>
      )}
      {hasSections && !isCollapsed && (
        <div className={styles.sections}>
          {node.sections!.map((section, i) => (
            <div key={i} className={styles.section}>
              {section.heading && (
                <div className={styles.sectionHeading}>{section.heading}</div>
              )}
              <SimpleMarkdown text={section.content} className={styles.sectionContent} />
            </div>
          ))}
        </div>
      )}
      {isCollapsed && hasSections && (
        <div className={styles.collapsedIndicator}>
          {node.sections!.length} section{node.sections!.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
