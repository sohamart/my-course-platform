import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable GlassCard adhering to the Liquid Glass design guidelines:
 * - Transparent glass surface
 * - 20px-30px rounded corners
 * - Inner highlights & subtle shadows
 * - Variants: default, lavender, mint, iceblue
 */
const GlassCard = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  onClick,
  ...props
}) => {
  const variantStyles = {
    default: 'glass-card',
    lavender: 'glass-card glass-lavender',
    mint: 'glass-card glass-mint',
    iceblue: 'glass-card glass-iceblue',
  };

  const hoverClass = hover ? 'glass-card-hover cursor-pointer' : '';
  const baseClass = `${variantStyles[variant] || 'glass-card'} ${hoverClass} ${className}`;

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        whileTap={{ scale: 0.99 }}
        className={baseClass}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClass} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export default GlassCard;

