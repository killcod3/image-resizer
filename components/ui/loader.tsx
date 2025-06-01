"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  showPercentage?: boolean;
}

export function Loader({ className, showPercentage = false }: LoaderProps) {
  const [visible, setVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        // Slow down progress as it approaches 100%
        const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
        const nextProgress = Math.min(prev + increment, 99);
        return nextProgress;
      });
    }, 300);

    // Consider the page loaded when:
    // 1. DOM is fully loaded
    // 2. All resources (images, scripts, etc.) are loaded
    const handleLoad = () => {
      clearInterval(interval);
      setLoadingProgress(100);
      
      // Add a small delay before hiding to ensure animations complete
      setTimeout(() => {
        setVisible(false);
      }, 600);
    };

    // Listen for window load event
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Error handling - ensure loader eventually disappears even if some resources fail
    const fallbackTimeout = setTimeout(() => {
      clearInterval(interval);
      setLoadingProgress(100);
      setTimeout(() => setVisible(false), 600);
    }, 10000); // 10 seconds max loading time

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        loadingProgress === 100 ? "opacity-0" : "opacity-100",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 h-full w-full animate-spin">
          <div className="h-full w-full rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-background animate-pulse"></div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-foreground font-medium">
          Loading your experience
          {showPercentage && <span> ({loadingProgress}%)</span>}
        </p>
        <div className="w-48 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}