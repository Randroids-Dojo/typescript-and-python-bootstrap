import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      setTransitionStage('fadeOut');
      
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 200); // Match the CSS transition duration
      
      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'fadeIn') {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
      }, 200); // Match the CSS transition duration
      
      return () => clearTimeout(timeout);
    }
  }, [transitionStage]);

  return (
    <div
      className={cn(
        "w-full transition-opacity duration-200 ease-in-out",
        {
          "opacity-0": transitionStage === 'fadeOut',
          "opacity-100": transitionStage === 'fadeIn',
        },
        className
      )}
      style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
    >
      {children}
    </div>
  );
}