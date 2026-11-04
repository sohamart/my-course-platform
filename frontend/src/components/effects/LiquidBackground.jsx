import React from 'react';
import { motion } from 'framer-motion';
import WaterDroplets from './WaterDroplets';

/**
 * Animated Liquid Background with pastel light refractions,
 * fluid organic blobs, and floating water droplets.
 */
const LiquidBackground = ({ children, fixedLayout = false, className = '' }) => {
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
          animate={{
            x: [0, 25, 0],
            y: [0, -20, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-brand-lavender/40 blur-[90px]"
        />

        {/* Ice Blue Cool Glow (Top Right) */}
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -top-[5%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-brand-iceblue/50 blur-[100px]"
        />

        {/* Mint Refreshing Glow (Bottom Center) */}
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -25, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-[15%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-brand-mint/45 blur-[110px]"
        />

        {/* Global Floating Droplets */}
        <WaterDroplets count={6} />
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

