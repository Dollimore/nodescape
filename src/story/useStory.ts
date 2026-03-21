import { useState, useCallback, useEffect, useRef } from 'react';
import type { StoryConfig, StoryStep } from '../types';

export function useStory(config: StoryConfig | undefined, onStepChange?: (index: number, step: StoryStep) => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config?.autoPlay ?? false);
  const [isActive, setIsActive] = useState(!!config);
  const intervalRef = useRef<number | null>(null);

  const steps = config?.steps || [];
  const interval = config?.autoPlayInterval ?? 5000;

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
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
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPlaying && isActive) {
      const stepDuration = steps[currentStep]?.duration ?? interval;
      intervalRef.current = window.setTimeout(() => {
        next();
      }, stepDuration);
      return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }
  }, [isPlaying, isActive, currentStep, interval, next, steps]);

  return {
    currentStep,
    isPlaying,
    isActive,
    activeNodeId: isActive ? steps[currentStep]?.nodeId : null,
    goToStep,
    next,
    prev,
    togglePlay,
    close,
  };
}
