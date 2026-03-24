import { useState, useCallback, useEffect, useRef } from 'react';
import type { StoryConfig, StoryStep } from '../types';

export function useStory(config: StoryConfig | undefined, onStepChange?: (index: number, step: StoryStep) => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config?.autoPlay ?? false);
  const [isActive, setIsActive] = useState(!!config);
  const [progress, setProgress] = useState(0);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [pausedElapsed, setPausedElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  const [zoomTrigger, setZoomTrigger] = useState(0);

  const steps = config?.steps || [];
  const interval = config?.autoPlayInterval ?? 8000;
  const currentStepDuration = steps[currentStep]?.duration ?? interval;

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
    setProgress(0);
    setPausedElapsed(0);
    setStepStartTime(Date.now());
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
    setIsPlaying(prev => {
      if (!prev) {
        // Resuming — adjust start time to account for paused elapsed
        setStepStartTime(Date.now() - pausedElapsed);
        setZoomTrigger(t => t + 1);
        return true;
      } else {
        // Pausing — save elapsed time
        setPausedElapsed(Date.now() - stepStartTime);
        return false;
      }
    });
  }, [pausedElapsed, stepStartTime]);

  const close = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && isActive) {
      const elapsed = Date.now() - stepStartTime;
      const remaining = Math.max(0, currentStepDuration - elapsed);
      intervalRef.current = window.setTimeout(() => {
        next();
      }, remaining);
      return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }
  }, [isPlaying, isActive, currentStep, currentStepDuration, next, stepStartTime]);

  // Progress bar animation
  useEffect(() => {
    if (isPlaying && isActive) {
      const tick = () => {
        const elapsed = Date.now() - stepStartTime;
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
  }, [isPlaying, isActive, currentStep, currentStepDuration, stepStartTime]);

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
