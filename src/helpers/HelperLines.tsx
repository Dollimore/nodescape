import React from 'react';
import styles from './HelperLines.module.css';

interface HelperLinesProps {
  lines: { type: 'horizontal' | 'vertical'; position: number }[];
}

export function HelperLines({ lines }: HelperLinesProps) {
  if (lines.length === 0) return null;

  return (
    <div className={styles.container}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={line.type === 'horizontal' ? styles.horizontal : styles.vertical}
          style={line.type === 'horizontal'
            ? { top: line.position }
            : { left: line.position }
          }
        />
      ))}
    </div>
  );
}
