import React from 'react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  items: { label: string; onClick: () => void }[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div className={styles.menu} style={{ left: x, top: y }}>
        {items.map((item, i) => (
          <button
            key={i}
            className={styles.menuItem}
            onClick={() => { item.onClick(); onClose(); }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
