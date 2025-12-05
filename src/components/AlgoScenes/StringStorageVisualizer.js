import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StringStorageVisualizer = ({ data }) => {
  // data.type: 'seq' (顺序) | 'link' (链式)

  // --- 1. 顺序存储视图 ---
  const renderSeq = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* 结构体示意图 */}
      <div style={{
        border: '2px solid #30363d', borderRadius: 8, padding: 20,
        background: '#0d1117', position: 'relative', minWidth: 400
      }}>
        <div style={{ position: 'absolute', top: -12, left: 20, background: '#0d1117', padding: '0 5px', color: '#8b949e', fontSize: 12 }}>
          struct SString
        </div>

        {/* 字符数组 */}
        <div style={{ display: 'flex', marginBottom: 15 }}>
          {data.cells.map((cell, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
              <motion.div
                initial={{ scale: 0.8, backgroundColor: '#161b22' }}
                animate={{
                  scale: 1,
                  backgroundColor: cell.val ? '#1f6feb' : '#161b22',
                  borderColor: cell.val ? '#58a6ff' : '#30363d'
                }}
                style={{
                  width: 36, height: 36, border: '1px solid', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 'bold', fontSize: 18
                }}
              >
                {cell.val}
              </motion.div>
              <span style={{ fontSize: 10, color: '#8b949e', marginTop: 4 }}>{i}</span>
            </div>
          ))}
          {/* 省略号表示 MAXSIZE */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 10, color: '#8b949e' }}>...</div>
        </div>

        {/* 长度属性 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px dashed #30363d', paddingTop: 10 }}>
          <span style={{ color: '#ff7b72', fontFamily: 'monospace' }}>int length = </span>
          <motion.div
            key={data.length}
            initial={{ scale: 1.5, color: '#fff' }}
            animate={{ scale: 1, color: '#ff7b72' }}
            style={{ fontWeight: 'bold', fontSize: 20 }}
          >
            {data.length}
          </motion.div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#8b949e' }}>
        ⚠️ 定长数组：无论存多少字符，都占用 MAXSIZE 空间
      </div>
    </div>
  );

  // --- 2. 链式存储视图 (块链) ---
  const renderLink = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <AnimatePresence>
          {data.nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {/* 结点盒子 */}
              <div style={{
                border: '1px solid #58a6ff', borderRadius: 6, overflow: 'hidden',
                display: 'flex', flexDirection: 'column', background: '#0d1117'
              }}>
                {/* 数据域 (Chunk) */}
                <div style={{ display: 'flex', borderBottom: '1px solid #30363d' }}>
                  {node.chars.map((char, ci) => (
                    <div key={ci} style={{
                      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRight: ci < node.chars.length - 1 ? '1px solid #30363d' : 'none',
                      color: char === '#' ? '#8b949e' : '#fff', // 填充符变灰
                      background: char === '#' ? '#161b22' : 'transparent',
                      fontWeight: 'bold'
                    }}>
                      {char}
                    </div>
                  ))}
                </div>
                {/* 指针域 */}
                <div style={{
                  height: 20, background: '#161b22', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#58a6ff'
                }}>
                  next
                </div>
              </div>

              {/* 箭头 */}
              {i < data.nodes.length - 1 ? (
                <div style={{ width: 30, height: 2, background: '#58a6ff', margin: '0 5px', position: 'relative' }}>
                  <div style={{position:'absolute', right:0, top:-4, borderLeft:'6px solid #58a6ff', borderTop:'5px solid transparent', borderBottom:'5px solid transparent'}}></div>
                </div>
              ) : (
                <div style={{ marginLeft: 10, color: '#8b949e', fontSize: 12 }}>NULL</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ fontSize: 13, color: '#8b949e' }}>
        🔗 块链串：每个结点存储 {data.chunkSize} 个字符，不足处用 '#' 补位
      </div>
    </div>
  );

  return (
    <div style={{
      padding: 30, background: '#010409', borderRadius: 12,
      border: '1px solid #30363d', minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      {data.type === 'seq' ? renderSeq() : renderLink()}
    </div>
  );
};

export default StringStorageVisualizer;