import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================= 常量定义 =================
const NODE_R = 20; // 逻辑节点半径
const MAX_NODES = 6;
const CANVAS_H = 400; // 增加画布高度

const CustomGraphBuilder = () => {
  // 1. 节点状态
  const [nodes, setNodes] = useState([
    { id: 0, x: 150, y: 60 },
    { id: 1, x: 240, y: 220 },
    { id: 2, x: 60, y: 220 }
  ]);

  // 2. 边状态
  const [edges, setEdges] = useState([
    { from: 0, to: 1, id: '0-1' },
    { from: 0, to: 2, id: '0-2' },
    { from: 1, to: 2, id: '1-2' },
    { from: 2, to: 0, id: '2-0' }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });
  const constraintsRef = useRef(null);

  // ================= 交互逻辑 (保持不变) =================
  const addNode = () => {
    if (nodes.length >= MAX_NODES) return alert(`最多支持 ${MAX_NODES} 个顶点`);
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    setNodes([...nodes, { id: newId, x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 }]);
  };

  const reset = () => {
    setNodes([{ id: 0, x: 150, y: 150 }]);
    setEdges([]);
  };

  const addEdge = () => {
    const { from, to } = edgeInput;
    if (!nodes.find(n => n.id === Number(from)) || !nodes.find(n => n.id === Number(to))) return;
    if (from == to) return alert("暂不支持自环");
    const exists = edges.find(e => e.from == from && e.to == to);
    if (exists) {
      setEdges(edges.filter(e => e.id !== exists.id));
    } else {
      setEdges([...edges, { from: Number(from), to: Number(to), id: `${from}-${to}` }]);
    }
  };

  const handleDragEnd = (id, info) => {
    const newNodes = nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n);
    setNodes(newNodes);
  };

  // ================= 核心：优化后的十字链表布局计算 =================
  const orthoData = useMemo(() => {
    const OX = 60, OY = 60; // 原点
    const CELL_W = 90; // 加宽：弧节点宽度
    const CELL_H = 70; // 加高：行间距

    const idMap = {};
    nodes.forEach((n, i) => idMap[n.id] = i);

    // 1. 生成弧节点 (ArcBox)
    const arcNodes = edges.map(e => {
      const r = idMap[e.from];
      const c = idMap[e.to];
      if (r === undefined || c === undefined) return null;
      return {
        id: e.id,
        val: `${e.from}→${e.to}`,
        // 放在矩阵的对应位置
        x: OX + 80 + c * CELL_W,
        y: OY + r * CELL_H,
        r, c
      };
    }).filter(Boolean);

    const links = [];
    const nullPointers = []; // 存储末尾的 ^ 符号坐标

    // 2. 生成【绿色】同尾连线 (tLink: Row / Out)
    for (let r = 0; r < nodes.length; r++) {
      // 找到该行的所有边，按列排序（模拟链表顺序）
      const rowArcs = arcNodes.filter(n => n.r === r).sort((a, b) => a.c - b.c);

      // 起点：顶点表头的右侧绿色锚点
      let startX = OX + 70; // 顶点表宽70
      let startY = OY + r * CELL_H + 20; // 绿色点y坐标 (偏下)

      if (rowArcs.length > 0) {
        // 表头 -> 第一个节点
        const first = rowArcs[0];
        links.push({
          d: `M ${startX} ${startY} L ${first.x} ${startY}`, // 水平直连
          color: '#2ea043', marker: 'arrow-green'
        });

        // 节点 -> 节点
        for (let i = 0; i < rowArcs.length - 1; i++) {
          const curr = rowArcs[i];
          const next = rowArcs[i+1];
          // 从当前节点的右侧绿色端口 -> 下一个节点的左侧
          links.push({
            d: `M ${curr.x + 60} ${curr.y + 20} L ${next.x} ${next.y + 20}`,
            color: '#2ea043', marker: 'arrow-green'
          });
        }
        // 最后一个节点 -> NULL
        const last = rowArcs[rowArcs.length - 1];
        nullPointers.push({ x: last.x + 75, y: last.y + 24, color: '#2ea043' });
      } else {
        // 表头直接 NULL
        nullPointers.push({ x: startX + 15, y: startY + 4, color: '#2ea043' });
      }
    }

    // 3. 生成【橙色】同头连线 (hLink: Col / In)
    for (let c = 0; c < nodes.length; c++) {
      // 找到该列的所有边，按行排序
      const colArcs = arcNodes.filter(n => n.c === c).sort((a, b) => a.r - b.r);

      // 起点：顶点表头的中间橙色锚点
      let startX = OX + 50;
      let startY = OY + c * CELL_H; // 橙色点y坐标 (偏上)

      if (colArcs.length > 0) {
        // 表头 -> 第一个节点 (需要弯曲)
        const first = colArcs[0];
        // 贝塞尔曲线：先向上出，再弯曲到目标上方
        const cpX = (startX + first.x + 30) / 2;
        links.push({
          d: `M ${startX} ${startY} Q ${cpX} ${startY - 40}, ${first.x + 30} ${first.y}`,
          color: '#d29922', marker: 'arrow-orange'
        });

        // 节点 -> 节点 (垂直直连)
        for (let i = 0; i < colArcs.length - 1; i++) {
          const curr = colArcs[i];
          const next = colArcs[i+1];
          // 从当前节点的下方橙色端口 -> 下一个节点的上方
          links.push({
            d: `M ${curr.x + 30} ${curr.y + 30} L ${next.x + 30} ${next.y}`,
            color: '#d29922', marker: 'arrow-orange'
          });
        }
        // 最后一个节点 -> NULL
        const last = colArcs[colArcs.length - 1];
        nullPointers.push({ x: last.x + 26, y: last.y + 45, color: '#d29922', vertical: true });
      } else {
        // 表头直接 NULL
        nullPointers.push({ x: startX + 15, y: startY + 4, color: '#d29922' });
      }
    }

    const requiredWidth = OX + nodes.length * CELL_W + 150;
    return { arcNodes, links, nullPointers, OX, OY, CELL_H, requiredWidth };
  }, [nodes, edges]);

  return (
    <div style={{ border: '1px solid #30363d', borderRadius: 8, background: '#0d1117', padding: 20 }}>
      {/* 顶部控制栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', background:'#161b22', padding:10, borderRadius:6 }}>
        <button onClick={addNode} style={btnStyle('#238636')}>+ 添加顶点</button>
        <div style={{width:1, height:20, background:'#30363d'}}></div>
        <select style={selectStyle} value={edgeInput.from} onChange={e => setEdgeInput({...edgeInput, from: e.target.value})}>
          {nodes.map(n => <option key={n.id} value={n.id}>V{n.id}</option>)}
        </select>
        <span style={{color:'#8b949e'}}>➔</span>
        <select style={selectStyle} value={edgeInput.to} onChange={e => setEdgeInput({...edgeInput, to: e.target.value})}>
          {nodes.map(n => <option key={n.id} value={n.id}>V{n.id}</option>)}
        </select>
        <button onClick={addEdge} style={btnStyle('#1f6feb')}>添加/删除连线</button>
        <div style={{flex:1}}></div>
        <button onClick={reset} style={btnStyle('#da3633')}>重置</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* 左侧：逻辑图 */}
        <div ref={constraintsRef} style={{ height: CANVAS_H, background: '#010409', borderRadius: 8, position: 'relative', overflow: 'hidden', border: '1px solid #30363d' }}>
          <div style={labelStyle}>逻辑结构 (拖拽节点调整)</div>
          <svg width="100%" height="100%">
            <defs>
              <marker id="arrow-logic" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#8b949e" />
              </marker>
            </defs>
            {edges.map(e => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);
              if (!s || !t) return null;
              return <motion.line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#8b949e" strokeWidth="2" markerEnd="url(#arrow-logic)" />;
            })}
          </svg>
          {nodes.map(node => (
            <motion.div
              key={node.id}
              drag dragConstraints={constraintsRef} dragMomentum={false} dragElastic={0}
              onDragEnd={(e, info) => handleDragEnd(node.id, info)}
              initial={{ x: node.x - NODE_R, y: node.y - NODE_R }}
              style={{
                position: 'absolute', top: 0, left: 0, width: NODE_R * 2, height: NODE_R * 2,
                borderRadius: '50%', background: '#1f6feb', border: '2px solid #fff',
                display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', cursor: 'grab', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
              }}
              whileHover={{ scale: 1.1 }} whileTap={{ cursor: 'grabbing' }}
            >
              V{node.id}
            </motion.div>
          ))}
        </div>

        {/* 右侧：十字链表 */}
        <div style={{ height: CANVAS_H, background: '#010409', borderRadius: 8, overflow: 'auto', border: '1px solid #30363d', position:'relative' }}>
          <div style={labelStyle}>十字链表 (自动布局)</div>
          <svg width={Math.max(400, orthoData.requiredWidth)} height={Math.max(CANVAS_H, orthoData.OY + nodes.length * 80)}>
            <defs>
              <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2ea043" /></marker>
              <marker id="arrow-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#d29922" /></marker>
            </defs>

            <AnimatePresence>
              {/* 连线 */}
              {orthoData.links.map((l, i) => (
                <motion.path
                  key={i} d={l.d}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  stroke={l.color} strokeWidth="1.5" fill="none" markerEnd={`url(#${l.marker})`}
                />
              ))}

              {/* 空指针 (^) */}
              {orthoData.nullPointers.map((np, i) => (
                <motion.text
                  key={`null-${i}`} initial={{opacity:0}} animate={{opacity:1}}
                  x={np.x} y={np.y} fill={np.color} fontSize="14" fontWeight="bold" textAnchor="middle"
                  transform={np.vertical ? `rotate(90, ${np.x}, ${np.y})` : ''}
                >
                  ^
                </motion.text>
              ))}

              {/* 顶点表头 */}
              {nodes.map((n, i) => {
                const baseX = 10;
                const baseY = orthoData.OY + i * orthoData.CELL_H;
                return (
                  <g key={`head-${n.id}`} transform={`translate(${baseX}, ${baseY})`}>
                    {/* 背景框 */}
                    <rect width={70} height={30} fill="#161b22" stroke="#30363d" rx={4} />

                    {/* 分割线 */}
                    <line x1={45} y1={0} x2={45} y2={30} stroke="#30363d" />

                    {/* 数据域 */}
                    <text x={22} y={20} fill="white" fontWeight="bold" textAnchor="middle">V{n.id}</text>

                    {/* 橙色锚点 (firstIn) */}
                    <circle cx={52} cy={10} r={3} fill="#d29922" />
                    {/* 绿色锚点 (firstOut) */}
                    <circle cx={58} cy={20} r={3} fill="#2ea043" />
                  </g>
                );
              })}

              {/* 弧节点 (ArcBox) */}
              {orthoData.arcNodes.map(n => (
                <motion.g
                  key={n.id}
                  initial={{ scale: 0 }} animate={{ scale: 1, x: n.x, y: n.y }}
                  exit={{ scale: 0 }}
                >
                  {/* 节点外框 */}
                  <rect width={60} height={30} fill="#21262d" stroke="#58a6ff" rx={4} />
                  {/* 分割线：把节点分为 Data|hLink|tLink (这里简化为 Data|Links) */}
                  <line x1={30} y1={0} x2={30} y2={30} stroke="#58a6ff" strokeWidth="1" />

                  {/* 数据域 */}
                  <text x={15} y={20} textAnchor="middle" fill="#58a6ff" fontSize="11" fontWeight="bold">{n.val}</text>

                  {/* 橙色锚点 (hLink - 下方) */}
                  <circle cx={30} cy={30} r={2} fill="#d29922" />
                  {/* 绿色锚点 (tLink - 右方) */}
                  <circle cx={60} cy={20} r={2} fill="#2ea043" />
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>

          <div style={{position:'absolute', bottom:10, left:10, fontSize:12, display:'flex', gap:10, background:'rgba(0,0,0,0.6)', padding:5, borderRadius:4}}>
             <span style={{color:'#2ea043'}}>── 出度 (tLink)</span>
             <span style={{color:'#d29922'}}>── 入度 (hLink)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 样式定义
const btnStyle = (bg) => ({
  padding: '6px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});
const selectStyle = {
  background: '#0d1117', color: 'white', border: '1px solid #30363d', padding: '4px', borderRadius: 4
};
const labelStyle = {
  position: 'absolute', top: 10, left: 10, color: '#8b949e', fontSize: 12, pointerEvents: 'none'
};

export default CustomGraphBuilder;