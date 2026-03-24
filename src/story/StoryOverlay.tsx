import React from 'react';
import type { StoryStep } from '../types';
import { SimpleMarkdown } from '../nodes/SimpleMarkdown';
import styles from './StoryOverlay.module.css';

interface StoryOverlayProps {
  steps: StoryStep[];
  currentStep: number;
  isPlaying: boolean;
  progress: number;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onClose: () => void;
  onGoToStep: (index: number) => void;
}

export function StoryOverlay({ steps, currentStep, isPlaying, progress, onPrev, onNext, onTogglePlay, onClose, onGoToStep }: StoryOverlayProps) {
  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className={styles.overlay}>
      {/* Progress bar at top of overlay */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${isPlaying ? progress : 0}%` }} />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.stepInfo}>
            <span className={styles.stepNumber}>Step {currentStep + 1} of {steps.length}</span>
            {step.title && <span className={styles.stepTitle}>{step.title}</span>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {step.content && (
          <div className={styles.text}>
            <SimpleMarkdown text={step.content} />
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.dots}>
            {steps.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === currentStep ? styles.dotActive : i < currentStep ? styles.dotCompleted : ''}`}
                onClick={() => onGoToStep(i)}
              />
            ))}
          </div>
          <div className={styles.buttons}>
            <button className={styles.navBtn} onClick={onPrev} disabled={currentStep === 0}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <button className={styles.playBtn} onClick={onTogglePlay}>
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              )}
            </button>
            <button className={styles.navBtn} onClick={onNext} disabled={currentStep === steps.length - 1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
