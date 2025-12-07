import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 基础配置
const NODE_R = 20; // 逻辑图节点半径
const ROW_H = 60;  // 存储结构行高
const ARC_W = 100; // 弧节点宽度
const ARC_H = 40;  // 弧节点高度

// 弧节点组件 (存储结构中的方块)
const ArcNode = ({ x, y, data, isFirst }) => {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x, y }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring' }}
    >
      {/* 节点框 */}
      <rect x={0} y={0} width={ARC_W} height={ARC_H} rx={4} fill="#161b22" stroke="#30363d" strokeWidth="1" />

      {/* 竖线分割 */}
      <line x1={ARC_W/3} y1={0} x2={ARC_W/3} y2={ARC_H} stroke="#30363d" />
      <line x1={ARC_W*2/3} y1={0} x2={ARC_W*2/3} y2={ARC_H} stroke="#30363d" />

      {/* 文本内容 */}
      <text x={ARC_W/6} y={25} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{data.from}</text>
      <text x={ARC_W/2} y={25} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{data.to}</text>

      {/* 指针域标识 */}
      <text x={ARC_W*5/6} y={15} textAnchor="middle" fill="#2ea043" fontSize="8">hLink</text>
      <text x={ARC_W*5/6} y={32} textAnchor="middle" fill="#f69d50" fontSize="8">tLink</text>
    </motion.g>
  );
};

const OrthogonalListVisualizer = () => {
  // 1. 状态管理
  const [nodes, setNodes] = useState(['A', 'B', 'C', 'D']); // 节点标签
  const [edges, setEdges] = useState([
    { from: 0, to: 1 }, // A->B
    { from: 0, to: 2 }, // A->C
    { from: 2, to: 0 }, // C->A
    { from: 2, to: 3 }, // C->D
    { from: 3, to: 1 }, // D->B
  ]);

  // 输入框状态
  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });

  // 2. 计算派生数据 (核心逻辑)
  const { vertexRows, hLinks } = useMemo(() => {
    // 2.1 构建邻接表形式的行数据 (tLink链)
    const rows = nodes.map((n, i) => {
      // 找到所有以 i 为起点的边 (Out Edges)
      const outEdges = edges
        .filter(e => e.from === i)
        .sort((a, b) => a.to - b.to); // 排序保持稳定
      return { id: i, label: n, arcs: outEdges };
    });

    // 2.2 计算 hLink (同入度链) 的坐标连接
    // 我们需要知道每个边节点在 SVG 中的具体 (x, y) 坐标
    // 规则：Arc(u->v) 的坐标：x = 120 + u_index * 120 (错开排列不好看，还是紧凑排列)
    // 修正规则：x = 120 + (它在行内的序号) * 140, y = 行号 * ROW_H

    // 先建立一个映射表： edgeKey -> {x, y}
    const arcPosMap = {};
    rows.forEach((row, rowIndex) => {
      row.arcs.forEach((arc, colIndex) => {
        const key = `${arc.from}-${arc.to}`;
        arcPosMap[key] = {
          x: 120 + colIndex * 140,
          y: rowIndex * ROW_H + 10, // +10 是为了垂直居中
          width: ARC_W,
          height: ARC_H
        };
      });
    });

    // 生成 hLink 连线数据
    const hLinkLines = [];
    nodes.forEach((_, targetNodeIdx) => {
      // 找到所有指向 targetNodeIdx 的边
      const inEdges = edges.filter(e => e.to === targetNodeIdx).sort((a, b) => a.from - b.from);

      // 顶点 -> 第一条入边
      if (inEdges.length > 0) {
        const firstArcKey = `${inEdges[0].from}-${inEdges[0].to}`;
        const target = arcPosMap[firstArcKey];
        if (target) {
          hLinkLines.push({
            x1: 60, y1: targetNodeIdx * ROW_H + 30, // 顶点 firstIn 位置 (假定在下方)
            x2: target.x + ARC_W/2, y2: target.y, // 连到弧节点的顶部
            color: '#2ea043' // 绿色代表入度链
          });
        }

        // 边 -> 边
        for (let i = 0; i < inEdges.length - 1; i++) {
          const currKey = `${inEdges[i].from}-${inEdges[i].to}`;
          const nextKey = `${inEdges[i+1].from}-${inEdges[i+1].to}`;
          const start = arcPosMap[currKey];
          const end = arcPosMap[nextKey];
          if (start && end) {
            hLinkLines.push({
              x1: start.x + ARC_W/2, y1: start.y + ARC_H - 10, // 从 hLink 域出发
              x2: end.x + ARC_W/2, y2: end.y,
              color: '#2ea043'
            });
          }
        }
      }
    });

    return { vertexRows: rows, hLinks: hLinkLines };
  }, [nodes, edges]);

  // 操作函数
  const addEdge = () => {
    const exists = edges.find(e => e.from === parseInt(edgeInput.from) && e.to === parseInt(edgeInput.to));
    if (!exists && parseInt(edgeInput.from) !== parseInt(edgeInput.to)) {
      setEdges([...edges, { from: parseInt(edgeInput.from), to: parseInt(edgeInput.to) }]);
    }
  };

  const removeEdge = (idx) => {
    const newEdges = [...edges];
    newEdges.splice(idx, 1);
    setEdges(newEdges);
  };

  const addNode = () => {
    const nextLabel = String.fromCharCode(65 + nodes.length);
    setNodes([...nodes, nextLabel]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. 控制面板 */}
      <div style={{ padding: 15, background: '#161b22', borderRadius: 8, border: '1px solid #30363d', display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center' }}>
        <button onClick={addNode} style={btnStyle('#1f6feb')}>+ 添加节点</button>

        <div style={{display:'flex', alignItems:'center', gap:5, borderLeft:'1px solid #30363d', paddingLeft:15}}>
          <select
            value={edgeInput.from}
            onChange={e => setEdgeInput({...edgeInput, from: e.target.value})}
            style={selectStyle}
          >
            {nodes.map((n, i) => <option key={i} value={i}>{n} ({i})</option>)}
          </select>
          <span style={{color:'white'}}>→</span>
          <select
            value={edgeInput.to}
            onChange={e => setEdgeInput({...edgeInput, to: e.target.value})}
            style={selectStyle}
          >
            {nodes.map((n, i) => <option key={i} value={i}>{n} ({i})</option>)}
          </select>
          <button onClick={addEdge} style={btnStyle('#238636')}>添加连线</button>
        </div>

        <div style={{fontSize:12, color:'#8b949e', marginLeft:'auto'}}>
          点击下方连线可删除
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* 2. 左侧：逻辑结构图 */}
        <div style={{ background: '#0d1117', borderRadius: 8, height: 400, position: 'relative', border: '1px solid #30363d' }}>
          <h4 style={{position:'absolute', top:10, left:10, margin:0, color:'#8b949e'}}>逻辑结构 (Graph)</h4>
          <svg width="100%" height="100%" viewBox="0 0 300 400">
            <defs>
              <marker id="arrow-logic" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#8b949e" />
              </marker>
            </defs>
            {/* 简单布局：圆周排列 */}
            {nodes.map((n, i) => {
              const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
              const cx = 150 + 100 * Math.cos(angle);
              const cy = 200 + 100 * Math.sin(angle);
              return (
                <g key={i}>
                  {/* 连线 */}
                  {edges.filter(e => e.from === i).map((e, ei) => {
                    const tAngle = (e.to / nodes.length) * 2 * Math.PI - Math.PI / 2;
                    const tx = 150 + 100 * Math.cos(tAngle);
                    const ty = 200 + 100 * Math.sin(tAngle);
                    return (
                      <line
                        key={`${i}-${e.to}`} x1={cx} y1={cy} x2={tx} y2={ty}
                        stroke="#8b949e" strokeWidth="2" markerEnd="url(#arrow-logic)"
                        onClick={() => {
                            // 简单的点击删除逻辑
                            const idx = edges.findIndex(edge => edge.from === i && edge.to === e.to);
                            removeEdge(idx);
                        }}
                        style={{cursor: 'pointer'}}
                      />
                    );
                  })}
                  <circle cx={cx} cy={cy} r={NODE_R} fill="#1f6feb" stroke="#fff" />
                  <text x={cx} y={cy} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold">{n}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 3. 右侧：存储结构图 (核心) */}
        <div style={{ background: '#0d1117', borderRadius: 8, height: 400, overflow: 'auto', border: '1px solid #30363d', position:'relative' }}>
          <h4 style={{position:'absolute', top:10, left:10, margin:0, color:'#8b949e', zIndex:10}}>十字链表 (Memory)</h4>

          <div style={{position:'absolute', top:10, right:10, fontSize:12, zIndex:10}}>
             <span style={{color:'#f69d50'}}>── tLink (出边)</span>
             <span style={{color:'#2ea043', marginLeft:10}}>── hLink (入边)</span>
          </div>

          <svg width={Math.max(600, 120 + 5 * 140)} height={Math.max(400, nodes.length * ROW_H + 50)}>
            <defs>
              <marker id="arrow-tlink" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#f69d50" />
              </marker>
              <marker id="arrow-hlink" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#2ea043" />
              </marker>
            </defs>

            <AnimatePresence>
              {/* 渲染顶点表头 */}
              {vertexRows.map((row, i) => (
                <g key={`vertex-${i}`}>
                  {/* 顶点框 */}
                  <rect x={20} y={i * ROW_H + 10} width={80} height={40} fill="#21262d" stroke="#58a6ff" rx={4} />
                  <text x={40} y={i * ROW_H + 35} textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="14">{row.label}</text>

                  {/* 顶点内的指针域文字 */}
                  <text x={70} y={i * ROW_H + 22} textAnchor="middle" fill="#2ea043" fontSize="9">in</text>
                  <text x={90} y={i * ROW_H + 22} textAnchor="middle" fill="#f69d50" fontSize="9">out</text>

                  {/* firstOut 指针线 (tLink起点) */}
                  {row.arcs.length > 0 && (
                    <line
                      x1={90} y1={i * ROW_H + 30}
                      x2={120} y2={i * ROW_H + 30}
                      stroke="#f69d50" strokeWidth="2" markerEnd="url(#arrow-tlink)"
                    />
                  )}

                  {/* 渲染该行的所有弧节点 */}
                  {row.arcs.map((arc, colIndex) => {
                    const x = 120 + colIndex * 140;
                    const y = i * ROW_H + 10;

                    return (
                      <g key={`${arc.from}-${arc.to}`}>
                        {/* tLink 连线 (连向下一个) */}
                        {colIndex < row.arcs.length - 1 && (
                          <line
                            x1={x + ARC_W - 15} y1={y + 30} // 从 tLink域出发
                            x2={x + 140} y2={y + 30}
                            stroke="#f69d50" strokeWidth="2" markerEnd="url(#arrow-tlink)"
                          />
                        )}

                        <ArcNode x={x} y={y} data={{from: arc.from, to: arc.to}} />
                      </g>
                    );
                  })}
                </g>
              ))}

              {/* 渲染 hLink 连线 (入边链表 - 跨行连接) */}
              {hLinks.map((line, i) => (
                <motion.path
                  key={`hlink-${i}`}
                  d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1+20} ${line.x2} ${line.y2-20} ${line.x2} ${line.y2}`}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2"
                  strokeDasharray="4,4" // 虚线表示
                  markerEnd="url(#arrow-hlink)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
              ))}
            </AnimatePresence>
          </svg>
        </div>
      </div>
    </div>
  );
};

// 简单的内联样式
const btnStyle = (color) => ({
  padding: '6px 12px', background: color, border: 'none', borderRadius: 4,
  color: '#fff', cursor: 'pointer', fontWeight: 'bold'
});
const selectStyle = {
  padding: '5px', background: '#0d1117', color: '#fff', border: '1px solid #30363d', borderRadius: 4
};

export default OrthogonalListVisualizer;