import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const R = 22; // 节点半径

const TreeTraversalVisualizer = ({ data }) => {
  // data: {
  //   nodes: [...],
  //   links: [...],
  //   queue: [val1, val2...], // 辅助队列数据
  //   output: [val1, val2...] // 已遍历序列
  // }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>

      {/* 1. 上半部分：树形结构 */}
      <div style={{
        flex: 1,
        minHeight: '300px',
        background: '#0d1117',
        borderRadius: '8px 8px 0 0',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #30363d'
      }}>
        <svg width="100%" height="100%" viewBox="0 0 600 320">
          <AnimatePresence>
            {/* 连线 */}
            {data.links.map((link) => {
              const s = data.nodes.find(n => n.id === link.source);
              const t = data.nodes.find(n => n.id === link.target);
              if(!s || !t) return null;
              return (
                <line
                  key={`${link.source}-${link.target}`}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke="#30363d" strokeWidth="2"
                />
              );
            })}

            {/* 节点 */}
            {data.nodes.map((node) => (
              <motion.g
                key={node.id}
                initial={false}
                animate={{ scale: node.active ? 1.2 : 1 }}
                transition={{ type: "spring" }}
              >
                <circle
                  cx={node.x} cy={node.y} r={R}
                  // 颜色逻辑：当前访问(橙色) > 已访问(绿色) > 未访问(蓝色)
                  fill={node.active ? '#f69d50' : (node.visited ? '#2ea043' : '#1f6feb')}
                  stroke="#fff" strokeWidth="2"
                />
                <text x={node.x} y={node.y} dy=".3em" textAnchor="middle" fill="white" fontWeight="bold">
                  {node.val}
                </text>
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </div>

      {/* 2. 下半部分：辅助数据区 (队列 & 输出) */}
      <div style={{
        height: '100px',
        background: '#161b22',
        borderRadius: '0 0 8px 8px',
        padding: '10px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '10px'
      }}>

        {/* 如果有队列数据，显示队列 */}
        {data.queue && (
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{color:'#8b949e', fontSize:12, width:40}}>Queue:</span>
            <div style={{display:'flex', gap:5, border:'1px dashed #30363d', padding:5, borderRadius:4, minWidth:200}}>
              <AnimatePresence>
                {data.queue.map((val, i) => (
                  <motion.div
                    key={`${val}-${i}`} // 使用组合key保证唯一
                    initial={{opacity:0, x:-20}}
                    animate={{opacity:1, x:0}}
                    exit={{opacity:0, scale:0}}
                    style={{
                      width: 30, height: 30, background: '#1f6feb',
                      borderRadius: 4, display:'flex', alignItems:'center',
                      justifyContent:'center', color:'white', fontWeight:'bold', fontSize:12
                    }}
                  >
                    {val}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 显示输出序列 */}
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span style={{color:'#8b949e', fontSize:12, width:40}}>Print:</span>
          <div style={{display:'flex', gap:5}}>
            {data.output.map((val, i) => (
              <motion.span
                key={i}
                initial={{opacity:0}} animate={{opacity:1}}
                style={{color: '#2ea043', fontWeight:'bold', fontFamily:'monospace'}}
              >
                {val}
              </motion.span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TreeTraversalVisualizer;