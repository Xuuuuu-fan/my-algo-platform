import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================= 配置常量 =================
const V_COUNT = 4; // 顶点数量 0-3
const GRID_W = 60; // 格子宽
const GRID_H = 50; // 格子高
const ORIGIN_X = 60; // 十字链表原点X
const ORIGIN_Y = 60; // 十字链表原点Y

// 逻辑图的顶点坐标 (用于左侧展示)
const LOGIC_POS = [
  { x: 100, y: 50 },  // V0
  { x: 250, y: 50 },  // V1
  { x: 100, y: 200 }, // V2
  { x: 250, y: 200 }  // V3
];

const CustomOrthogonalDemo = () => {
  // 状态：存储所有的边 [{from: 0, to: 1}, ...]
  const [edges, setEdges] = useState([]);
  const [inputFrom, setInputFrom] = useState(0);
  const [inputTo, setInputTo] = useState(1);

  // 添加边
  const addEdge = () => {
    if (inputFrom === inputTo) return alert("暂不支持自环");
    const exists = edges.find(e => e.from === inputFrom && e.to === inputTo);
    if (exists) return alert("边已存在");
    setEdges([...edges, { from: parseInt(inputFrom), to: parseInt(inputTo) }]);
  };

  // 重置
  const reset = () => setEdges([]);

  // ================= 核心：计算连线路径 =================
  // 十字链表最难的是画线。我们需要计算出所有节点的坐标，然后连线。
  const { arcNodes, hLinks, tLinks } = useMemo(() => {
    // 1. 确定所有弧节点的位置
    // 规则：Arc(u, v) 位于第 u 行，第 v 列
    const _arcNodes = edges.map(e => ({
      id: `${e.from}-${e.to}`,
      from: e.from,
      to: e.to,
      x: ORIGIN_X + e.to * GRID_W + 40, // 偏移量
      y: ORIGIN_Y + e.from * GRID_H,
      label: `${e.from}→${e.to}`
    }));

    // 2. 计算同尾 (tLink - Green) - 出度
    // 逻辑：V[u] -> Arc(u, v1) -> Arc(u, v2)...
    // 为了视觉整洁，我们按列号排序连接 (模拟链表顺序)
    const _tLinks = [];
    for (let r = 0; r < V_COUNT; r++) {
      // 找到该行所有的边，按列排序
      const rowNodes = _arcNodes.filter(n => n.from === r).sort((a, b) => a.to - b.to);

      let startX = ORIGIN_X;
      let startY = ORIGIN_Y + r * GRID_H;

      rowNodes.forEach(node => {
        _tLinks.push({
          id: `t-${r}-${node.id}`,
          d: `M ${startX} ${startY} L ${node.x} ${node.y}`,
          color: '#2ea043' // 绿线
        });
        startX = node.x + 30; // 连到节点的右侧
        startY = node.y;
      });
    }

    // 3. 计算同头 (hLink - Orange) - 入度
    // 逻辑：V[v] -> Arc(u1, v) -> Arc(u2, v)...
    const _hLinks = [];
    for (let c = 0; c < V_COUNT; c++) {
      // 找到该列所有的边，按行排序
      const colNodes = _arcNodes.filter(n => n.to === c).sort((a, b) => a.from - b.from);

      // 起点是 V[c] 的头部位置 (为了视觉方便，我们从 V[c] 的上方或下方引出曲线)
      // 十字链表表头位置：x: ORIGIN_X, y: ORIGIN_Y + c * GRID_H
      // 但这里我们要连接的是 "列链表"，所以视觉起点设在表头文字的上方

      let prevX = ORIGIN_X + 25; // 顶点表中心
      let prevY = ORIGIN_Y + c * GRID_H - 15; // 顶点表上方

      // 如果这一列有节点，第一条线需要从左侧的顶点表头 弯曲 到 对应的弧节点
      if (colNodes.length > 0) {
        const first = colNodes[0];
        // 贝塞尔曲线：起点(顶点表) -> 终点(第一个弧节点上方)
        _hLinks.push({
          id: `h-head-${c}`,
          d: `M ${prevX} ${prevY} Q ${first.x} ${prevY}, ${first.x} ${first.y - 15}`,
          color: '#d29922'
        });

        // 后续垂直连接
        for (let i = 0; i < colNodes.length - 1; i++) {
          const curr = colNodes[i];
          const next = colNodes[i+1];
          _hLinks.push({
            id: `h-${curr.id}-${next.id}`,
            d: `M ${curr.x} ${curr.y + 15} L ${next.x} ${next.y - 15}`,
            color: '#d29922'
          });
        }
      }
    }

    return { arcNodes: _arcNodes, tLinks: _tLinks, hLinks: _hLinks };
  }, [edges]);

  return (
    <div style={{ border: '1px solid #30363d', borderRadius: 8, background: '#0d1117', padding: 20 }}>

      {/* 1. 控制面板 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{color:'white', fontWeight:'bold'}}>添加边: </span>
        <select value={inputFrom} onChange={e => setInputFrom(Number(e.target.value))} style={inputStyle}>
          {[0,1,2,3].map(i => <option key={i} value={i}>V{i}</option>)}
        </select>
        <span style={{color:'white'}}>➔</span>
        <select value={inputTo} onChange={e => setInputTo(Number(e.target.value))} style={inputStyle}>
          {[0,1,2,3].map(i => <option key={i} value={i}>V{i}</option>)}
        </select>
        <button onClick={addEdge} style={btnStyle('#1f6feb')}>添加</button>
        <button onClick={reset} style={btnStyle('#d29922')}>重置</button>
        <span style={{fontSize:12, color:'#8b949e', marginLeft: 10}}>当前边数: {edges.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

        {/* 2. 左侧：逻辑图预览 */}
        <div style={{ background: '#010409', borderRadius: 8, height: 300, position: 'relative', border: '1px solid #30363d' }}>
          <div style={{position:'absolute', top:5, left:10, color:'#8b949e', fontSize:12}}>逻辑结构</div>
          <svg width="100%" height="100%">
            <defs>
              <marker id="arrow-logic" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#8b949e" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const s = LOGIC_POS[e.from];
              const t = LOGIC_POS[e.to];
              return (
                <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#8b949e" strokeWidth="2" markerEnd="url(#arrow-logic)" />
              );
            })}
            {LOGIC_POS.map((pos, i) => (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y} r={18} fill="#1f6feb" stroke="#fff" strokeWidth="2" />
                <text x={pos.x} y={pos.y} dy=".3em" textAnchor="middle" fill="white" fontWeight="bold">V{i}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* 3. 右侧：十字链表生成 */}
        <div style={{ background: '#010409', borderRadius: 8, height: 300, overflow: 'auto', border: '1px solid #30363d', position:'relative' }}>
          <div style={{position:'absolute', top:5, left:10, color:'#8b949e', fontSize:12}}>十字链表 (自动生成)</div>
          <svg width="400" height="300">
            <defs>
              <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#2ea043" /></marker>
              <marker id="arrow-orange" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#d29922" /></marker>
            </defs>

            <AnimatePresence>
              {/* 画线：同尾 (绿) */}
              {tLinks.map(link => (
                <motion.path
                  key={link.id} d={link.d}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  stroke={link.color} strokeWidth="2" fill="none" markerEnd="url(#arrow-green)"
                />
              ))}
              {/* 画线：同头 (橙) */}
              {hLinks.map(link => (
                <motion.path
                  key={link.id} d={link.d}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  stroke={link.color} strokeWidth="2" fill="none" markerEnd="url(#arrow-orange)"
                />
              ))}

              {/* 顶点表头 */}
              {[0, 1, 2, 3].map(i => (
                <g key={`v-${i}`} transform={`translate(10, ${ORIGIN_Y + i * GRID_H - 20})`}>
                  {/* 顶点结构: [Data | firstIn | firstOut] */}
                  <rect width={80} height={40} fill="#161b22" stroke="#30363d" rx={4} />
                  <text x={15} y={25} fill="white" fontWeight="bold">V{i}</text>
                  <line x1={40} y1={0} x2={40} y2={40} stroke="#30363d" />
                  <line x1={60} y1={0} x2={60} y2={40} stroke="#30363d" />
                  {/* 橙色点(In) 绿色点(Out) */}
                  <circle cx={50} cy={20} r={3} fill="#d29922" />
                  <circle cx={70} cy={20} r={3} fill="#2ea043" />
                </g>
              ))}

              {/* 弧节点 */}
              {arcNodes.map(node => (
                <motion.g
                  key={node.id}
                  initial={{ scale: 0 }} animate={{ scale: 1, x: node.x, y: node.y }}
                  transition={{ type: 'spring' }}
                >
                  <rect x={-20} y={-15} width={40} height={30} fill="#21262d" stroke="#58a6ff" rx={4} />
                  <text dy=".3em" textAnchor="middle" fill="#58a6ff" fontSize="12" fontWeight="bold">{node.label}</text>
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>

          {/* 图例 */}
          <div style={{position:'absolute', bottom:10, left:10, fontSize:12, display:'flex', gap:10}}>
             <span style={{color:'#2ea043'}}>── 出度 (tLink)</span>
             <span style={{color:'#d29922'}}>── 入度 (hLink)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 简单的内联样式
const inputStyle = { padding: '4px 8px', borderRadius: 4, background: '#21262d', color: 'white', border: '1px solid #30363d' };
const btnStyle = (bg) => ({ padding: '4px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' });

export default CustomOrthogonalDemo;