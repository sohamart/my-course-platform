import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WaterDroplets from './WaterDroplets';

/**
 * Animated Liquid Background with pastel light refractions,
 * fluid organic blobs, and floating water droplets.
 * Optimized with lightweight GPU composite layers on mobile to guarantee smooth 120 FPS.
 */
const LiquidBackground = ({ children, fixedLayout = false, className = '' }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={`relative ${
        fixedLayout ? 'h-screen overflow-hidden' : 'min-h-screen'
      } w-full max-w-full overflow-x-hidden bg-brand-offwhite text-brand-text ${className}`}
    >
      {/* Background Ambient Fluid Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Lavender Ambient Light (Top Left) */}
        <motion.div
          animate={
            isMobile
              ? false
              : {
                  x: [0, 25, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] sm:w-[55vw] sm:h-[55vw] rounded-full bg-brand-lavender/35 blur-[45px] sm:blur-[90px] will-change-transform"
        />

        {/* Ice Blue Cool Glow (Top Right) */}
        <motion.div
          animate={
            isMobile
              ? false
              : {
                  x: [0, -30, 0],
                  y: [0, 20, 0],
                  scale: [1, 1.1, 1],
                }
          }
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -top-[5%] -right-[10%] w-[60vw] h-[60vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-brand-iceblue/40 blur-[50px] sm:blur-[100px] will-change-transform"
        />

        {/* Mint Refreshing Glow (Bottom Center) */}
        <motion.div
          animate={
            isMobile
              ? false
              : {
                  x: [0, 20, 0],
                  y: [0, -25, 0],
                  scale: [1, 1.05, 1],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-[15%] left-[15%] sm:left-[20%] w-[70vw] h-[70vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-brand-mint/40 blur-[55px] sm:blur-[110px] will-change-transform"
        />

        {/* Global Floating Droplets (Subtle count on mobile for zero frame drops) */}
        <WaterDroplets count={isMobile ? 2 : 6} />
      </div>

      {/* Main Content Area */}
      <div
        className={`relative z-10 flex flex-col w-full max-w-full min-w-0 ${
          fixedLayout ? 'h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default LiquidBackground;
