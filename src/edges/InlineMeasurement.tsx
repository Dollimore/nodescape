import React from 'react';
import type { EdgeMeasurement } from '../types';
import styles from './InlineMeasurement.module.css';

interface InlineMeasurementProps {
  measurement: EdgeMeasurement;
  x: number;
  y: number;
  isDragging?: boolean;
}

export function InlineMeasurement({ measurement, x, y, isDragging }: InlineMeasurementProps) {
  const statusClass = measurement.status === 'critical' ? styles.critical
    : measurement.status === 'warning' ? styles.warning
    : styles.normal;

  return (
    <div
      className={`${styles.measurement} ${statusClass}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        transition: isDragging ? 'none' : 'left 0.3s ease, top 0.3s ease',
      }}
    >
      <span className={styles.value}>{measurement.value}</span>
      <span className={styles.unit}>{measurement.unit || measurement.label}</span>
    </div>
  );
}
