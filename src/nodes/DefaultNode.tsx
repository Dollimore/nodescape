import React, { useState } from 'react';
import type { FlowNode, NodePort } from '../types';
import styles from './DefaultNode.module.css';
import { NodeIcon } from './NodeIcon';
import { SimpleMarkdown } from './SimpleMarkdown';

function getPortLabelStyle(port: NodePort): React.CSSProperties {
  const pos = port.position ?? 0.5;
  const base: React.CSSProperties = { position: 'absolute' };

  switch (port.side) {
    case 'top':
      return { ...base, left: `${pos * 100}%`, top: 0, transform: 'translate(-50%, -100%) translateY(-2px)' };
    case 'bottom':
      return { ...base, left: `${pos * 100}%`, bottom: 0, transform: 'translate(-50%, 100%) translateY(2px)' };
    case 'left':
      return { ...base, top: `${pos * 100}%`, left: 0, transform: 'translate(-100%, -50%) translateX(-2px)' };
    case 'right':
      return { ...base, top: `${pos * 100}%`, right: 0, transform: 'translate(100%, -50%) translateX(2px)' };
  }
}

interface DefaultNodeProps {
  node: FlowNode;
  editable: boolean;
  onCollapseToggle?: (nodeId: string, collapsed: boolean) => void;
  onHandleDrag?: (nodeId: string, side: string, e: React.MouseEvent) => void;
}

export function DefaultNode({ node, editable, onCollapseToggle, onHandleDrag }: DefaultNodeProps) {
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
      <div
        className={styles.handle + ' ' + styles.handleTop}
        onMouseDown={(e) => {
          if (editable && onHandleDrag) {
            e.stopPropagation();
            onHandleDrag(node.id, 'top', e);
          }
        }}
      />
      <div
        className={styles.handle + ' ' + styles.handleBottom}
        onMouseDown={(e) => {
          if (editable && onHandleDrag) {
            e.stopPropagation();
            onHandleDrag(node.id, 'bottom', e);
          }
        }}
      />
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
              const next = !isCollapsed;
              setIsCollapsed(next);
              // Trigger re-layout after DOM updates with new height
              if (onCollapseToggle) {
                requestAnimationFrame(() => onCollapseToggle(node.id, next));
              }
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
      {node.ports && node.ports.map(port => (
        <div
          key={port.id}
          className={styles.portLabel}
          style={getPortLabelStyle(port)}
        >
          {port.label || port.id}
        </div>
      ))}
    </div>
  );
}
