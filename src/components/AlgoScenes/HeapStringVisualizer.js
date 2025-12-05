import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 内存块组件
const MemoryBlock = ({ address, values, status }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, x: 20 }}
    animate={{
      opacity: status === 'freed' ? 0.5 : 1,
      scale: 1,
      x: 0,
      filter: status === 'freed' ? 'grayscale(100%)' : 'none'
    }}
    exit={{ opacity: 0, scale: 0.5 }}
    transition={{ duration: 0.5 }}
    style={{
      border: `2px solid ${status === 'freed' ? '#30363d' : '#2ea043'}`,
      background: status === 'freed' ? '#161b22' : '#0d1117',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      position: 'relative'
    }}
  >
    {/* 内存地址标签 */}
    <div style={{
      position: 'absolute', top: -10, left: 10,
      background: '#0d1117', padding: '0 5px', fontSize: 12,
      color: status === 'freed' ? '#8b949e' : '#2ea043', fontWeight: 'bold'
    }}>
      Heap Addr: {address} {status === 'freed' ? '(Freed)' : ''}
    </div>

    {/* 内存格子 */}
    <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          width: 30, height: 30, border: '1px solid #30363d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, background: '#161b22'
        }}>
          {v}
        </div>
      ))}
      <div style={{ width: 30, height: 30, border: '1px dashed #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 10 }}>\0</div>
    </div>
  </motion.div>
);

const HeapStringVisualizer = ({ data }) => {
  // data: {
  //   stack: { ptr: '0x...', len: 5 },
  //   heap: { address: '0x...', data: [...], status: 'active'|'freed' }
  // }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 280, gap: 40, padding: 20, background: '#010409', borderRadius: 8, border: '1px solid #30363d'
    }}>

      {/* 1. 栈区 (Stack) */}
      <div style={{
        width: 140, padding: 15, borderRadius: 8,
        border: '2px solid #58a6ff', background: '#0d1117', position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: -10, right: 10, background: '#0d1117', padding: '0 5px', color: '#58a6ff', fontSize: 12, fontWeight: 'bold' }}>Stack (S)</div>

        {/* 指针变量 ch */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#8b949e' }}>char *ch</div>
          <motion.div
            animate={{ backgroundColor: data.stack.ptr ? '#1f6feb' : '#21262d' }}
            style={{
              padding: '5px 8px', borderRadius: 4,
              color: '#fff', fontFamily: 'monospace', fontSize: 13, textAlign: 'center',
              border: '1px solid #30363d'
            }}
          >
            {data.stack.ptr || 'NULL'}
          </motion.div>
        </div>

        {/* 长度变量 len */}
        <div>
          <div style={{ fontSize: 12, color: '#8b949e' }}>int length</div>
          <div style={{
            padding: '5px 8px', borderRadius: 4, background: '#21262d',
            color: '#fff', fontFamily: 'monospace', fontSize: 13, textAlign: 'center',
            border: '1px solid #30363d'
          }}>
            {data.stack.len}
          </div>
        </div>
      </div>

      {/* 2. 指针箭头 */}
      <div style={{ width: 60, height: 2, background: data.stack.ptr ? '#58a6ff' : 'transparent', position: 'relative', transition: 'all 0.3s' }}>
        {data.stack.ptr && (
          <div style={{ position: 'absolute', right: 0, top: -4, borderLeft: '8px solid #58a6ff', borderTop: '5px solid transparent', borderBottom: '5px solid transparent' }} />
        )}
      </div>

      {/* 3. 堆区 (Heap) */}
      <div style={{ width: 220, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#8b949e', marginBottom: 10, borderBottom: '1px dashed #30363d', paddingBottom: 5 }}>
          Dynamic Memory (Heap)
        </div>

        <AnimatePresence mode='popLayout'>
          {data.heap && (
            <MemoryBlock
              key={data.heap.address} // Key 很重要，地址变了就是新组件
              address={data.heap.address}
              values={data.heap.data}
              status={data.heap.status}
            />
          )}
        </AnimatePresence>

        {!data.heap && (
          <div style={{ textAlign: 'center', color: '#30363d', fontSize: 12, fontStyle: 'italic' }}>
            (Empty)
          </div>
        )}
      </div>

    </div>
  );
};

export default HeapStringVisualizer;