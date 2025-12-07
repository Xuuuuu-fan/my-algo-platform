import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CELL_SIZE = 40;

const GraphStorageVisualizer = ({ data }) => {
  // data: {
  //   mode: 'matrix' | 'list',
  //   nodes: ['A', 'B', 'C'...], // 顶点标签
  //   matrix: [[0,1,0], ...],    // 矩阵数据
  //   adjList: [{id:'A', edges:['B', 'C']}, ...], // 邻接表数据
  //   highlights: { row: 1, col: 2, cell: true, currNode: 'A', scanList: true } // 高亮控制
  // }

  // --- 1. 渲染邻接矩阵 ---
  const renderMatrix = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${data.nodes.length}, ${CELL_SIZE}px)`, gap: 2 }}>

        {/* 表头 (列坐标) */}
        <div style={{/*占位*/}}></div>
        {data.nodes.map((n, i) => (
          <div key={`col-${i}`} style={{ textAlign: 'center', color: '#8b949e', fontSize: 12 }}>{n}</div>
        ))}

        {/* 矩阵内容 */}
        {data.nodes.map((rowNode, r) => (
          <React.Fragment key={`row-${r}`}>
            {/* 行表头 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontSize: 12 }}>
              {rowNode}
            </div>

            {/* 单元格 */}
            {data.nodes.map((colNode, c) => {
              const val = data.matrix[r][c];
              const isHighlight = data.highlights?.row === r && data.highlights?.col === c;
              const isRowActive = data.highlights?.row === r;

              return (
                <motion.div
                  key={`${r}-${c}`}
                  layout
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: isHighlight ? 1.1 : 1,
                    backgroundColor: isHighlight ? '#d29922' : (isRowActive ? '#1f6feb33' : '#0d1117'),
                    borderColor: isHighlight ? '#fff' : '#30363d'
                  }}
                  style={{
                    width: CELL_SIZE, height: CELL_SIZE,
                    border: '1px solid',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: val === 0 ? '#484f58' : '#fff',
                    fontWeight: val !== 0 ? 'bold' : 'normal',
                    borderRadius: 4
                  }}
                >
                  {val === Infinity ? '∞' : val}
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{marginTop: 10, fontSize: 12, color: '#8b949e'}}>
        Adjacency Matrix [ {data.nodes.length} x {data.nodes.length} ]
      </div>
    </div>
  );

  // --- 2. 渲染邻接表 ---
  const renderAdjList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', padding: '0 20px' }}>
      <AnimatePresence>
        {data.adjList.map((entry, i) => {
          const isScanning = data.highlights?.scanRow === i; // 正在扫描这一行（用于删除顶点演示）

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {/* 顶点表头 */}
              <div style={{
                width: 50, height: 40, background: isScanning ? '#d29922' : '#161b22',
                border: '1px solid #30363d', borderRadius: '4px 0 0 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 'bold', zIndex: 10
              }}>
                {entry.id}
              </div>
              <div style={{ width: 30, height: 40, border: '1px solid #30363d', borderLeft: 'none', background: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></div>
              </div>

              {/* 边链表 */}
              <AnimatePresence>
                {entry.edges.map((target, j) => (
                  <React.Fragment key={`${entry.id}-${target}`}>
                    {/* 箭头 */}
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: 30 }} exit={{ width: 0, opacity: 0 }}
                      style={{ height: 2, background: '#58a6ff', position: 'relative' }}
                    >
                      <div style={{position:'absolute', right:0, top:-4, borderLeft:'6px solid #58a6ff', borderTop:'5px solid transparent', borderBottom:'5px solid transparent'}}></div>
                    </motion.div>

                    {/* 边节点 */}
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
                      style={{
                        width: 40, height: 35, background: '#1f6feb', borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 'bold',
                        border: data.highlights?.target === target && data.highlights?.scanRow === i ? '2px solid #fff' : 'none' // 高亮特定边
                      }}
                    >
                      {target}
                    </motion.div>
                  </React.Fragment>
                ))}
              </AnimatePresence>
              {/* 空指针 */}
              <div style={{ marginLeft: 10, color: '#484f58' }}>^</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div style={{
      height: 380, background: '#010409', borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'auto'
    }}>
      {data.mode === 'matrix' ? renderMatrix() : renderAdjList()}
    </div>
  );
};

export default GraphStorageVisualizer;