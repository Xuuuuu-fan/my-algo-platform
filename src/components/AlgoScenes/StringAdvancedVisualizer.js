import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 基础字符方块
const Block = ({ val, idx, color = '#1f6feb', label, subLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2px' }}>
    {/* 上方标签 (如 i, j) */}
    <div style={{ height: 20, fontSize: 12, color: '#e0a612', fontWeight: 'bold' }}>{label}</div>

    {/* 方块主体 */}
    <motion.div
      layout
      initial={{ scale: 0.8 }}
      animate={{ scale: 1, backgroundColor: color }}
      style={{
        width: 36, height: 36, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 'bold', fontSize: 16,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {val}
    </motion.div>

    {/* 下方下标 */}
    <span style={{ fontSize: 10, color: '#8b949e', marginTop: 4 }}>{idx}</span>
    {/* 下方额外数据 (如 next值) */}
    {subLabel !== undefined && (
      <span style={{ fontSize: 12, color: '#2ea043', marginTop: 0, fontWeight: 'bold' }}>{subLabel}</span>
    )}
  </div>
);

const StringAdvancedVisualizer = ({ data }) => {
  // data.mode: 'heap' | 'match' | 'array'

  // --- 1. 堆分配视图 ---
  if (data.mode === 'heap') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 50 }}>
        {/* 栈区 (Stack) */}
        <div style={{ border: '2px solid #8b949e', borderRadius: 8, padding: 15, background: '#0d1117', width: 120 }}>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 5 }}>Stack (栈)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>H.ch</span>
            <div style={{ background: '#21262d', padding: '2px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>
              {data.heapPtr ? data.heapPtr : 'NULL'}
            </div>
          </div>
        </div>

        {/* 指针箭头 */}
        <svg width="60" height="20" style={{ overflow: 'visible' }}>
          <motion.line
            initial={{ pathLength: 0 }}
            animate={{ pathLength: data.heapPtr ? 1 : 0, opacity: data.heapPtr ? 1 : 0 }}
            x1="0" y1="10" x2="60" y2="10"
            stroke="#58a6ff" strokeWidth="2" markerEnd="url(#arrow)"
          />
          <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#58a6ff" /></marker></defs>
        </svg>

        {/* 堆区 (Heap) */}
        <div style={{ border: '2px dashed #30363d', borderRadius: 8, padding: 15, background: '#010409', minWidth: 200, minHeight: 80 }}>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 5 }}>Heap (堆)</div>
          {data.heapContent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex' }}
            >
              {data.heapContent.map((c, i) => <Block key={i} val={c} idx={i} color="#1f6feb" />)}
            </motion.div>
          ) : (
            <div style={{ fontSize: 12, color: '#30363d', fontStyle: 'italic' }}>Unallocated / Freed</div>
          )}
        </div>
      </div>
    );
  }

  // --- 2. 模式匹配视图 (BF / KMP匹配过程) ---
  if (data.mode === 'match') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
        {/* 主串 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: 40, color: '#8b949e' }}>S:</span>
          {data.s.map((c, i) => (
            <Block
              key={i} val={c} idx={i+1}
              color={data.matchIndex === i ? (data.isMatch ? '#2ea043' : '#da3633') : '#1f6feb'} // 绿/红/蓝
              label={data.i === i+1 ? 'i' : null}
            />
          ))}
        </div>
        {/* 模式串 (通过 animate x 实现滑动效果) */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: 40, color: '#8b949e' }}>T:</span>
          <motion.div
            animate={{ x: (data.i - data.j) * 40 }} // 这里的 40 是 Block 宽度+margin
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ display: 'flex' }}
          >
            {data.t.map((c, i) => (
              <Block
                key={i} val={c} idx={i+1}
                color={data.j === i+1 ? (data.isMatch ? '#2ea043' : '#da3633') : '#a371f7'}
                label={data.j === i+1 ? 'j' : null}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // --- 3. 数组生成视图 (Next / NextVal) ---
  if (data.mode === 'array') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, alignItems: 'center' }}>
        {/* 模式串 */}
        <div style={{ display: 'flex' }}>
          {data.t.map((c, i) => (
            <Block
              key={i} val={c} idx={i+1}
              // 比较 j 和 next[j] 对应的字符
              color={i+1 === data.i ? '#1f6feb' : (i+1 === data.j ? '#d29922' : '#30363d')}
              label={i+1 === data.i ? 'i' : (i+1 === data.j ? 'j' : null)}
            />
          ))}
        </div>

        {/* 数组值 */}
        <div style={{ display: 'flex', marginTop: 10 }}>
          <span style={{ marginRight: 10, alignSelf: 'center', fontWeight: 'bold' }}>{data.arrayName}:</span>
          {data.arr.map((val, i) => (
            <div key={i} style={{ width: 40, textAlign: 'center', margin: '0 2px' }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: val !== null ? 1 : 0.3, y: 0 }}
                style={{
                  background: val !== null ? '#2ea043' : 'transparent',
                  border: '1px solid #30363d',
                  borderRadius: 4, padding: 5, fontWeight: 'bold', color: '#fff'
                }}
              >
                {val !== null ? val : '?'}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default StringAdvancedVisualizer;