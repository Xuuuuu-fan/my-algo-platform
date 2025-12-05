import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 节点半径
const R = 22;

const ThreadedTreeVisualizer = ({ data }) => {
  // data 包含:
  // nodes: { id, val, x, y, isCurrent, isPre }
  // links: { source, target, type: 'child' | 'thread', isLeft }

  return (
    <div style={{
      width: '100%',
      height: '400px',
      background: '#0d1117',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <svg width="100%" height="100%" viewBox="0 0 600 400">
        <AnimatePresence>
          {/* 1. 渲染连线 */}
          {data.links.map((link, i) => {
            const sourceNode = data.nodes.find(n => n.id === link.source);
            const targetNode = data.nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            // 计算曲线控制点 (让线索呈现弧形，不遮挡树枝)
            // 如果是线索(thread)，稍微弯曲一下
            const isThread = link.type === 'thread';
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            // 弯曲偏移量
            const curveOffset = isThread ? (link.isLeft ? -40 : 40) : 0;

            const pathData = isThread
              ? `M ${sourceNode.x} ${sourceNode.y} Q ${midX + curveOffset} ${midY + curveOffset/2} ${targetNode.x} ${targetNode.y}`
              : `M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`;

            return (
              <motion.path
                key={`${link.source}-${link.target}-${link.type}`}
                d={pathData}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  stroke: isThread ? '#ff4d4f' : '#58a6ff', // 线索红色，孩子蓝色
                  strokeWidth: 2,
                  strokeDasharray: isThread ? '6,4' : '0', // 线索虚线
                  fill: 'none'
                }}
                transition={{ duration: 0.4 }}
                markerEnd={isThread ? "url(#arrow)" : ""} // 线索加箭头
              />
            );
          })}

          {/* 2. 渲染节点 */}
          {data.nodes.map((node) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0 }}
              animate={{
                x: node.x,
                y: node.y,
                scale: 1,
                opacity: 1
              }}
            >
              {/* 节点外圈 - 用于标记指针 */}
              {node.isCurrent && (
                <motion.circle r={R + 6} fill="none" stroke="#e0a612" strokeWidth="3"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              {node.isPre && (
                <motion.circle r={R + 6} fill="none" stroke="#8b949e" strokeWidth="3" strokeDasharray="4,4" />
              )}

              {/* 节点本体 */}
              <circle r={R} fill="#1f6feb" stroke="#fff" strokeWidth="2" />
              <text textAnchor="middle" dy=".3em" fill="white" fontWeight="bold">{node.val}</text>

              {/* 标记是指针 p 还是 pre */}
              {node.isCurrent && <text x={0} y={-35} textAnchor="middle" fill="#e0a612" fontSize="14px" fontWeight="bold">p</text>}
              {node.isPre && <text x={0} y={35} textAnchor="middle" fill="#8b949e" fontSize="14px" fontWeight="bold">pre</text>}

              {/* 左右 Tag 标记 (0或1) - 可选显示 */}
              <text x={-R-10} y={5} fill={node.ltag ? '#ff4d4f' : '#58a6ff'} fontSize="10px">{node.ltag ? 1 : 0}</text>
              <text x={R+4} y={5} fill={node.rtag ? '#ff4d4f' : '#58a6ff'} fontSize="10px">{node.rtag ? 1 : 0}</text>
            </motion.g>
          ))}
        </AnimatePresence>

        {/* 定义箭头标记 */}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#ff4d4f" />
          </marker>
        </defs>
      </svg>

      {/* 图例 */}
      <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#8b949e', background: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 4 }}>
        <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:20, height:2, background:'#58a6ff'}}></span> 孩子指针 (tag=0)</div>
        <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:20, height:2, background:'#ff4d4f', borderTop:'2px dashed #ff4d4f'}}></span> 线索指针 (tag=1)</div>
        <div style={{marginTop:4}}>🟡 p: 当前访问结点</div>
        <div>⚪ pre: 前驱结点</div>
      </div>
    </div>
  );
};

export default ThreadedTreeVisualizer;