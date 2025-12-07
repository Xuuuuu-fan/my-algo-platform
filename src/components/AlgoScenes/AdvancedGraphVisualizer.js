import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 样式常量
const V_NODE_W = 50;  // 顶点节点宽度
const V_NODE_H = 40;
const E_NODE_W = 70;  // 边节点宽度 (十字链表/多重表用)
const E_NODE_H = 35;
const GAP_X = 80;     // 列间距
const GAP_Y = 60;     // 行间距

const AdvancedGraphVisualizer = ({ data }) => {
  // data: { type: 'matrix'|'adjList'|'orth'|'multi', nodes: [], edges: [], pointers: [] }

  // 1. 渲染顶点 (Vertex Nodes)
  const renderVertices = () => (
    data.nodes.map(n => (
      <motion.g
        key={n.id}
        initial={{ scale: 0 }}
        animate={{ scale: 1, x: n.x, y: n.y }}
        transition={{ type: 'spring' }}
      >
        {/* 顶点外观：左侧是数据，右侧是指针域 */}
        <rect x={0} y={0} width={V_NODE_W} height={V_NODE_H} rx={4} fill="#161b22" stroke="#30363d" strokeWidth="2" />
        <text x={V_NODE_W/2} y={V_NODE_H/2} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold">{n.val}</text>

        {/* 辅助文字 (Index) */}
        <text x={-15} y={V_NODE_H/2} dy=".3em" textAnchor="end" fill="#8b949e" fontSize="12">{n.idx}</text>
      </motion.g>
    ))
  );

  // 2. 渲染边节点 (Edge Nodes - 用于十字链表/多重表)
  const renderEdgeNodes = () => (
    data.edges.map(e => (
      <motion.g
        key={e.id}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1, x: e.x, y: e.y }}
      >
        <rect x={0} y={0} width={E_NODE_W} height={E_NODE_H} rx={4} fill="#0d1117" stroke={e.color || "#1f6feb"} strokeWidth="2" />
        <text x={E_NODE_W/2} y={E_NODE_H/2} dy=".3em" textAnchor="middle" fill="#58a6ff" fontSize="12">
          {e.label} {/* 显示如 0->1 */}
        </text>
      </motion.g>
    ))
  );

  // 3. 渲染指针连线 (Pointers)
  const renderPointers = () => (
    data.pointers.map((p, i) => {
      // 这里的 path d 属性由数据直接提供，或者根据起点终点计算
      // 为了支持十字链表的复杂走线，我们在数据层预计算好 path
      return (
        <motion.path
          key={i}
          d={p.path} // 预计算的 SVG 路径
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          stroke={p.color || '#8b949e'}
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#arrow-${p.color?.replace('#','') || 'gray'})`}
        />
      );
    })
  );

  // 4. 渲染矩阵 (Matrix Grid)
  const renderMatrix = () => {
    if (!data.matrix) return null;
    return (
      <g transform="translate(50, 50)">
        {data.matrix.map((row, r) => (
          <g key={r}>
            {/* 行头 */}
            <text x={-20} y={r * 40 + 25} fill="#8b949e" fontSize="12">V{r}</text>
            {row.map((val, c) => (
              <g key={c}>
                {/* 列头 (只画一次) */}
                {r === 0 && <text x={c * 40 + 20} y={-10} textAnchor="middle" fill="#8b949e" fontSize="12">V{c}</text>}
                {/* 单元格 */}
                <motion.rect
                  initial={{ scale: 0.8 }} animate={{ scale: 1, fill: val ? '#1f6feb' : '#0d1117' }}
                  x={c * 40} y={r * 40} width={38} height={38} rx={4} stroke="#30363d"
                />
                <text x={c * 40 + 19} y={r * 40 + 24} textAnchor="middle" fill={val ? '#fff' : '#484f58'}>
                  {val}
                </text>
              </g>
            ))}
          </g>
        ))}
      </g>
    );
  };

  return (
    <div style={{ width: '100%', height: '400px', background: '#010409', borderRadius: '8px', overflow: 'hidden', border: '1px solid #30363d' }}>
      <svg width="100%" height="100%" viewBox="0 0 600 400">
        <defs>
          <marker id="arrow-gray" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#8b949e" /></marker>
          <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#2ea043" /></marker>
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#1f6feb" /></marker>
          <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#d29922" /></marker>
        </defs>

        <AnimatePresence>
          {data.type === 'matrix' ? renderMatrix() : (
            <>
              {renderPointers()}
              {renderEdgeNodes()}
              {renderVertices()}
            </>
          )}
        </AnimatePresence>

        {/* 底部图例 */}
        <text x="10" y="390" fill="#8b949e" fontSize="12">
          {data.legend}
        </text>
      </svg>
    </div>
  );
};

export default AdvancedGraphVisualizer;