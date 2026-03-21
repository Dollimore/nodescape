import React from 'react';
import type { FlowNode, DetailSection } from '../types';
import { SimpleMarkdown } from '../nodes/SimpleMarkdown';
import { KeyValueTable } from './KeyValueTable';
import { MiniChart } from './MiniChart';
import { Timeline } from './Timeline';
import styles from './DetailPanel.module.css';

interface DetailPanelProps {
  node: FlowNode;
  onClose: () => void;
  width?: number;
  renderSection?: (section: DetailSection, node: FlowNode) => React.ReactNode;
}

export function DetailPanel({ node, onClose, width = 360, renderSection }: DetailPanelProps) {
  const detail = node.detail;

  return (
    <div className={styles.panel} style={{ width }}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.title}>{detail?.title || node.label}</div>
          {node.status && <span className={styles.status} data-status={node.status}>{node.status}</span>}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className={styles.body}>
        {node.description && (
          <div className={styles.description}>
            <SimpleMarkdown text={node.description} />
          </div>
        )}

        {node.flowRate && (
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Flow Rate</span>
            <span className={styles.metricValue}>{node.flowRate}</span>
          </div>
        )}

        {node.progress !== undefined && (
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Utilization</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${node.progress}%` }} />
            </div>
            <span className={styles.metricValue}>{node.progress}%</span>
          </div>
        )}

        {detail?.content && (
          <div className={styles.richContent}>
            <SimpleMarkdown text={detail.content} />
          </div>
        )}

        {node.sections && node.sections.length > 0 && (
          <div className={styles.infoSections}>
            {node.sections.map((section, i) => (
              <div key={i} className={styles.infoSection}>
                {section.heading && <div className={styles.sectionHeading}>{section.heading}</div>}
                <SimpleMarkdown text={section.content} className={styles.sectionContent} />
              </div>
            ))}
          </div>
        )}

        {detail?.sections?.map((section, i) => {
          // Try custom renderer first
          if (renderSection) {
            const custom = renderSection(section, node);
            if (custom) return <div key={i} className={styles.detailSection}>{section.title && <div className={styles.sectionHeading}>{section.title}</div>}{custom}</div>;
          }

          return (
            <div key={i} className={styles.detailSection}>
              {section.title && <div className={styles.sectionHeading}>{section.title}</div>}
              {section.type === 'text' && section.data && <SimpleMarkdown text={section.data} />}
              {section.type === 'keyvalue' && <KeyValueTable data={section.data} />}
              {section.type === 'chart' && <MiniChart data={section.data} />}
              {section.type === 'timeline' && <Timeline data={section.data} />}
              {section.type === 'table' && <KeyValueTable data={section.data} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
