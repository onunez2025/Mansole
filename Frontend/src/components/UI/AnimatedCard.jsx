import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedCard({ children, className = '', delay = 0, elevated = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        ease: 'easeOut',
      }}
      whileHover={elevated ? { y: -4, boxShadow: '0 12px 28px rgba(5, 15, 26, 0.12)' } : {}}
      className={`bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 transition-smooth ${
        elevated ? 'shadow-md cursor-pointer' : 'shadow-sm'
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedContainer({ children, stagger = false, className = '' }) {
  const containerVariants = stagger ? {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } : {};

  const itemVariants = stagger ? {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  } : {};

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {stagger ? React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      )) : children}
    </motion.div>
  );
}
