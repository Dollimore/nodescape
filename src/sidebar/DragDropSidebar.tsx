import React from 'react';
import type { SidebarNodeTemplate } from '../types';
import styles from './DragDropSidebar.module.css';

export type { SidebarNodeTemplate };

interface DragDropSidebarProps {
  templates: SidebarNodeTemplate[];
  onDrop?: (template: SidebarNodeTemplate, position: { x: number; y: number }) => void;
}

export function DragDropSidebar({ templates }: DragDropSidebarProps) {
  const handleDragStart = (e: React.DragEvent, template: SidebarNodeTemplate) => {
    e.dataTransfer.setData('application/nodescape-node', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.title}>Add Nodes</div>
      {templates.map((template, i) => (
        <div
          key={i}
          className={styles.item}
          draggable
          onDragStart={(e) => handleDragStart(e, template)}
        >
          <div className={styles.itemLabel}>{template.label}</div>
          {template.description && (
            <div className={styles.itemDesc}>{template.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
