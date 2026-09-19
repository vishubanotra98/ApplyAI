import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  steps: string[];
  stepIntervalMs?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  steps,
  stepIntervalMs = 1800,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, stepIntervalMs);
    return () => clearInterval(interval);
  }, [steps, stepIntervalMs]);

  return (
    <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-3">
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-neutral-300 animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-neutral-200 tracking-tight">
          {steps[currentStepIndex]}
        </p>
        <div className="flex justify-center gap-1 mt-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? 'w-4 bg-neutral-300'
                  : i < currentStepIndex
                  ? 'w-1.5 bg-neutral-600'
                  : 'w-1.5 bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
