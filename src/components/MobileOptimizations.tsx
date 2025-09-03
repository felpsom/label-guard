import React, { useEffect } from 'react';

const MobileOptimizations: React.FC = () => {
  useEffect(() => {
    // Prevent zoom on double tap for mobile
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent pull-to-refresh on mobile
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].pageY;
      if (startY < currentY && window.scrollY === 0) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return null;
};

export default MobileOptimizations;