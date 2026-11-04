import React from 'react';
import { motion } from 'framer-motion';

/**
 * Realistic 3D water droplets with specular highlights,
 * inner refractions, and gentle floating physics.
 */
const WaterDroplets = ({ count = 5, className = '' }) => {
  // Preset organic positions and sizes to look naturally dispersed
  const droplets = [
    { id: 1, size: 28, top: '15%', left: '12%', duration: 7, delay: 0 },
    { id: 2, size: 42, top: '65%', left: '88%', duration: 9, delay: 1.2 },
    { id: 3, size: 18, top: '25%', left: '82%', duration: 6, delay: 0.5 },
    { id: 4, size: 34, top: '80%', left: '18%', duration: 8.5, delay: 2 },
    { id: 5, size: 22, top: '48%', left: '4%', duration: 6.8, delay: 1.7 },
    { id: 6, size: 36, top: '12%', left: '60%', duration: 8, delay: 0.8 },
  ].slice(0, count);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {droplets.map((d) => (
        <motion.div
          key={d.id}
          className="water-droplet"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
          }}
          animate={{
            y: [0, -12, 0],
            scale: [1, 1.05, 1],
            rotate: [0, 3, -2, 0],
          }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: d.delay,
          }}
        />
      ))}
    </div>
  );
};

export default WaterDroplets;

