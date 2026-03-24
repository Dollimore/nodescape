import { useState, useCallback, useEffect, useRef } from 'react';
import type { StoryConfig, StoryStep } from '../types';

export function useStory(config: StoryConfig | undefined, onStepChange?: (index: number, step: StoryStep) => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config?.autoPlay ?? false);
  const [isActive, setIsActive] = useState(!!config);
  const [progress, setProgress] = useState(0);
  // Track how much time was already elapsed when paused
  const elapsedWhenPausedRef = useRef(0);
  const stepStartRef = useRef(Date.now());
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  // Bump this to trigger a re-zoom to the current node
  const [zoomTrigger, setZoomTrigger] = useState(0);

  const steps = config?.steps || [];
  const interval = config?.autoPlayInterval ?? 8000;
  const currentStepDuration = steps[currentStep]?.duration ?? interval;

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
    setProgress(0);
    elapsedWhenPausedRef.current = 0;
    stepStartRef.current = Date.now();
    setZoomTrigger(t => t + 1);
    if (onStepChange && steps[clamped]) {
      onStepChange(clamped, steps[clamped]);
    }
  }, [steps, onStepChange]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, steps.length, goToStep]);

  const prev = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const togglePlay = useCallback(() => {
    setIsPlaying(p => {
      if (!p) {
        // Resuming — record start time accounting for already elapsed
        stepStartRef.current = Date.now() - elapsedWhenPausedRef.current;
        // Also zoom to current node
        setZoomTrigger(t => t + 1);
      } else {
        // Pausing — save how much time has elapsed
        elapsedWhenPausedRef.current = Date.now() - stepStartRef.current;
      }
      return !p;
    });
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
  }, []);

  // Auto-play timer — accounts for time already elapsed (pause/resume)
  useEffect(() => {
    if (isPlaying && isActive) {
      const remaining = currentStepDuration - (Date.now() - stepStartRef.current);
      if (remaining <= 0) {
        next();
        return;
      }
      intervalRef.current = window.setTimeout(() => {
        next();
      }, remaining);
      return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }
  }, [isPlaying, isActive, currentStep, currentStepDuration, next]);

  // Progress bar animation
  useEffect(() => {
    if (isPlaying && isActive) {
      const tick = () => {
        const elapsed = Date.now() - stepStartRef.current;
        const pct = Math.min(100, (elapsed / currentStepDuration) * 100);
        setProgress(pct);
        if (pct < 100) {
          progressRef.current = window.requestAnimationFrame(tick);
        }
      };
      progressRef.current = window.requestAnimationFrame(tick);
      return () => {
        if (progressRef.current) cancelAnimationFrame(progressRef.current);
      };
    }
    // When paused, keep showing the current progress (don't reset)
  }, [isPlaying, isActive, currentStep, currentStepDuration]);

  // Build a composite ID that changes when we want to re-trigger zoom
  const activeNodeId = isActive ? steps[currentStep]?.nodeId : null;
  const zoomNodeId = activeNodeId ? `${activeNodeId}__${zoomTrigger}` : null;

  return {
    currentStep,
    isPlaying,
    isActive,
    progress,
    currentStepDuration,
    activeNodeId,
    zoomNodeId,
    goToStep,
    next,
    prev,
    togglePlay,
    close,
  };
}
