import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 节点半径
const R = 20;

const TreeTransVisualizer = ({ data }) => {
  // data 包含 nodes[] and links[]
  // nodes: { id, val, x, y, color }
  // links: { source, target, type: 'solid' | 'dashed' | 'remove', color }

  return (
    <div style={{
      width: '100%',
      height: '350px',
      background: '#0d1117',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <svg width="100%" height="100%" viewBox="0 0 600 350">
        <AnimatePresence>
          {/* 1. 渲染连线 */}
          {data.links.map((link, i) => {
            const sourceNode = data.nodes.find(n => n.id === link.source);
            const targetNode = data.nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <motion.line
                key={`${link.source}-${link.target}-${link.type}`} // 确保 key 唯一
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  x1: sourceNode.x, y1: sourceNode.y,
                  x2: targetNode.x, y2: targetNode.y,
                  pathLength: 1,
                  opacity: 1,
                  stroke: link.color || '#58a6ff',
                  strokeWidth: 2,
                  strokeDasharray: link.type === 'dashed' ? '5,5' : '0'
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            );
          })}

          {/* 2. 渲染节点 */}
          {data.nodes.map((node) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                x: node.x,
                y: node.y,
                opacity: 1,
                scale: 1
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {/* 节点圆圈 */}
              <circle r={R} fill={node.color || '#1f6feb'} stroke="#fff" strokeWidth="2" />
              {/* 节点文字 */}
              <text
                textAnchor="middle"
                dy=".3em"
                fill="white"
                fontSize="14px"
                fontWeight="bold"
              >
                {node.val}
              </text>
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>

      {/* 图例 */}
      <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#8b949e' }}>
        <div style={{display:'flex', alignItems:'center', gap:5}}>
          <span style={{width:20, height:2, background:'#58a6ff'}}></span> 父子关系
        </div>
        <div style={{display:'flex', alignItems:'center', gap:5}}>
          <span style={{width:20, height:2, background:'#2ea043', borderTop:'2px dashed #2ea043'}}></span> 兄弟连线
        </div>
        <div style={{display:'flex', alignItems:'center', gap:5}}>
          <span style={{width:20, height:2, background:'#ff4d4f'}}></span> 移除连线
        </div>
      </div>
    </div>
  );
};

export default TreeTransVisualizer;