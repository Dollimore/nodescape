import React from 'react';
import styles from './AlarmBanner.module.css';

export interface Alarm {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  nodeId?: string;
  acknowledged?: boolean;
}

interface AlarmBannerProps {
  alarms: Alarm[];
  onAlarmClick?: (alarm: Alarm) => void;
  onAcknowledge?: (alarmId: string) => void;
}

export function AlarmBanner({ alarms, onAlarmClick, onAcknowledge }: AlarmBannerProps) {
  if (alarms.length === 0) return null;

  const activeAlarms = alarms.filter(a => !a.acknowledged);
  const criticalCount = activeAlarms.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlarms.filter(a => a.severity === 'warning').length;

  return (
    <div className={`${styles.banner} ${criticalCount > 0 ? styles.critical : warningCount > 0 ? styles.warning : styles.info}`}>
      <div className={styles.summary}>
        {criticalCount > 0 && <span className={styles.countCritical}>{criticalCount}</span>}
        {warningCount > 0 && <span className={styles.countWarning}>{warningCount}</span>}
        <span className={styles.totalText}>{activeAlarms.length} active alarm{activeAlarms.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.alarmList}>
        {activeAlarms.slice(0, 5).map(alarm => (
          <div
            key={alarm.id}
            className={`${styles.alarm} ${styles[alarm.severity]}`}
            onClick={() => onAlarmClick?.(alarm)}
          >
            <span className={styles.alarmTime}>{alarm.timestamp}</span>
            <span className={styles.alarmMsg}>{alarm.message}</span>
            {onAcknowledge && (
              <button
                className={styles.ackBtn}
                onClick={(e) => { e.stopPropagation(); onAcknowledge(alarm.id); }}
              >
                ACK
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
