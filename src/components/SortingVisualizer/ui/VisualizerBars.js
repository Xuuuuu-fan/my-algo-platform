import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME = {
  bar: '#1f6feb', compare: '#d29922', swap: '#da3633', sorted: '#2ea043', text: '#c9d1d9'
};

const VisualizerBars = ({ visualState }) => {
  const getBarColor = (idx, val) => {
    if (visualState.sorted?.includes(idx)) return THEME.sorted;
    if (visualState.swap && visualState.active?.includes(idx)) return THEME.swap;
    if (visualState.active?.includes(idx)) return THEME.compare;
    return THEME.bar;
  };

  return (
    <div style={{
      flex: 2, minWidth: 300, background: '#161b22', borderRadius: 12,
      border: '1px solid #30363d', padding: 20, height: 400,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4
    }}>
      <AnimatePresence>
        {visualState.arr.map((val, idx) => {
          const maxVal = Math.max(...visualState.arr, 100);
          return (
            <motion.div
              key={idx}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                height: `${(val / maxVal) * 100}%`, width: '100%',
                background: getBarColor(idx, val), borderRadius: '4px 4px 0 0',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                color: '#fff', fontSize: 10
              }}
            >
              {val}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default VisualizerBars;