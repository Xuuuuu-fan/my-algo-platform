import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 单个字符格子的样式
const CharBlock = ({ char, index, color = '#1f6feb', label }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1, backgroundColor: color }}
    exit={{ opacity: 0, scale: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2px'
    }}
  >
    {/* 字符方块 */}
    <div style={{
      width: 40, height: 40, borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 'bold', fontSize: 18,
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      {char}
    </div>
    {/* 索引下标 */}
    <span style={{ fontSize: 10, color: '#8b949e', marginTop: 4 }}>{index}</span>
    {/* 额外的指针标签 (如 i, j) */}
    {label && (
      <motion.span
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ fontSize: 12, color: '#e0a612', fontWeight: 'bold', marginTop: 2 }}
      >
        {label}
      </motion.span>
    )}
  </motion.div>
);

const StringOpsVisualizer = ({ data }) => {
  // data: {
  //   s1: { chars: [], label: 'S1', activeRange: [start, end] },
  //   s2: { chars: [], label: 'S2' },
  //   result: { chars: [], label: 'Result' },
  //   pointers: { index: 2, name: 'i' }
  // }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 30, padding: 20,
      background: '#0d1117', borderRadius: 8, minHeight: 250, justifyContent: 'center'
    }}>

      {/* 主串 S1 */}
      {data.s1 && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 60, color: '#8b949e', fontWeight: 'bold', fontSize: 14 }}>{data.s1.label}:</div>
          <div style={{ display: 'flex' }}>
            <AnimatePresence>
              {data.s1.chars.map((char, i) => {
                // 判断是否高亮 (在 range 范围内)
                const isActive = data.s1.activeRange && i >= data.s1.activeRange[0] && i <= data.s1.activeRange[1];
                // 判断是否有指针
                const pointerLabel = (data.pointers && data.pointers.index === i) ? data.pointers.name : null;

                return (
                  <CharBlock
                    key={`s1-${i}`}
                    index={i + 1} // 习惯上串从1开始，或者根据需求改从0
                    char={char}
                    color={isActive ? '#d29922' : '#1f6feb'} // 高亮用黄色，普通用蓝色
                    label={pointerLabel}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 副串 S2 (用于拼接) */}
      {data.s2 && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 60, color: '#8b949e', fontWeight: 'bold', fontSize: 14 }}>{data.s2.label}:</div>
          <div style={{ display: 'flex' }}>
            {data.s2.chars.map((char, i) => (
              <CharBlock key={`s2-${i}`} index={i + 1} char={char} color="#238636" /> // 绿色
            ))}
          </div>
        </div>
      )}

      {/* 结果串 (用于截取子串结果) */}
      {data.result && (
        <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px dashed #30363d', paddingTop: 20 }}>
          <div style={{ width: 60, color: '#58a6ff', fontWeight: 'bold', fontSize: 14 }}>{data.result.label}:</div>
          <div style={{ display: 'flex' }}>
            <AnimatePresence>
              {data.result.chars.map((char, i) => (
                <CharBlock key={`res-${i}`} index={i + 1} char={char} color="#a371f7" /> // 紫色
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

    </div>
  );
};

export default StringOpsVisualizer;