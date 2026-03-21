import React from 'react';
import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onResetZoom, onFitView }: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);

  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={onZoomOut} title="Zoom out">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button className={styles.percentage} onClick={onResetZoom} title="Reset to 100%">
        {percentage}%
      </button>
      <button className={styles.button} onClick={onZoomIn} title="Zoom in">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div className={styles.divider} />
      <button className={styles.button} onClick={onFitView} title="Fit to view">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </button>
    </div>
  );
}
