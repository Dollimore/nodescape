import { useState, useCallback, useEffect, useRef } from 'react';
import type { StoryConfig, StoryStep } from '../types';

export function useStory(config: StoryConfig | undefined, onStepChange?: (index: number, step: StoryStep) => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config?.autoPlay ?? false);
  const [isActive, setIsActive] = useState(!!config);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);

  const steps = config?.steps || [];
  const interval = config?.autoPlayInterval ?? 8000;

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
    setProgress(0);
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
    setIsPlaying(p => !p);
    setProgress(0);
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
  }, []);

  const currentStepDuration = steps[currentStep]?.duration ?? interval;

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && isActive) {
      intervalRef.current = window.setTimeout(() => {
        next();
      }, currentStepDuration);
      return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }
  }, [isPlaying, isActive, currentStep, currentStepDuration, next]);

  // Progress bar animation (updates every 50ms)
  useEffect(() => {
    if (isPlaying && isActive) {
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
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
    } else {
      setProgress(0);
    }
  }, [isPlaying, isActive, currentStep, currentStepDuration]);

  return {
    currentStep,
    isPlaying,
    isActive,
    progress,
    currentStepDuration,
    activeNodeId: isActive ? steps[currentStep]?.nodeId : null,
    goToStep,
    next,
    prev,
    togglePlay,
    close,
  };
}
