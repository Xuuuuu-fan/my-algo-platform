import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#a371f7',   // 紫色
  nodeColor: '#1f6feb', // 蓝色
  edgeNode: '#238636',  // 绿色
};

const NODE_R = 24;

const AdjacencyListDemo = () => {
  const containerRef = useRef(null);

  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 100, y: 100 },
    { id: 1, label: 'B', x: 300, y: 100 },
    { id: 2, label: 'C', x: 100, y: 300 },
    { id: 3, label: 'D', x: 300, y: 300 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1, id: '0-1' },
    { from: 0, to: 2, id: '0-2' },
    { from: 2, to: 3, id: '2-3' },
    { from: 1, to: 2, id: '1-2' },
    { from: 3, to: 0, id: '3-0' }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });

  const addNode = () => {
    const newId = nodes.length;
    const label = String.fromCharCode(65 + (newId % 26));
    setNodes([...nodes, { id: newId, label, x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 }]);
  };

  const addEdge = () => {
    const { from, to } = edgeInput;
    const fId = Number(from);
    const tId = Number(to);
    if (fId === tId || edges.find(e => e.from === fId && e.to === tId)) return;
    setEdges([...edges, { from: fId, to: tId, id: `${fId}-${tId}` }]);
  };

  const updatePos = (id, info) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  const getAdjList = () => {
    const list = {};
    nodes.forEach(n => list[n.id] = []);
    edges.forEach(e => list[e.from].push(e.to));
    Object.keys(list).forEach(k => list[k].sort((a,b) => a - b));
    return list;
  };

  const adjList = getAdjList();

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 15, alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>邻接表演示</h3>
        <div style={{width:1, height:20, background:THEME.border}}></div>
        <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 添加顶点</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}` }}>
          <select value={edgeInput.from} onChange={e => setEdgeInput({...edgeInput, from: e.target.value})} style={selectStyle}>
            {nodes.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <span style={{color:THEME.textMuted}}>→</span>
          <select value={edgeInput.to} onChange={e => setEdgeInput({...edgeInput, to: e.target.value})} style={selectStyle}>
            {nodes.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={addEdge} style={btnStyle(THEME.nodeColor)}>添加边</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧：图结构 (修复版) === */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', borderRight: `1px solid ${THEME.border}`, minHeight: '400px', background: '#010409', overflow: 'hidden' }}>
          <div style={labelStyle}>逻辑结构 (Directed Graph)</div>

          <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            <defs>
              <marker id="arrow-list" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={THEME.textMuted} /></marker>
            </defs>
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);
              return s && t && (
                <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={THEME.textMuted} strokeWidth="2" markerEnd="url(#arrow-list)" />
              );
            })}
          </svg>

          {nodes.map(n => (
            <motion.div key={n.id}
              drag dragMomentum={false}
              dragConstraints={containerRef}
              onDragEnd={(e, i) => updatePos(n.id, i)}
              initial={{ x: n.x - NODE_R, y: n.y - NODE_R }}
              animate={{ x: n.x - NODE_R, y: n.y - NODE_R }}
              style={{
                position: 'absolute', top:0, left:0,
                width: NODE_R*2, height: NODE_R*2,
                borderRadius: '50%', background: THEME.nodeColor, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                cursor: 'move', boxShadow: '0 0 0 4px rgba(0,0,0,0.2)', zIndex: 10
              }}
            >
              {n.label}
            </motion.div>
          ))}
        </div>

        {/* === 右侧：邻接表视图 === */}
        <div style={{ flex: 1, background: '#0d1117', padding: 20, overflow: 'auto' }}>
          <div style={labelStyle}>存储结构 (Array + Linked Lists)</div>
          <div style={{ marginTop: 30 }}>
            {nodes.map((node, i) => {
              const neighbors = adjList[node.id];
              return (
                <div key={node.id} style={{ position: 'relative', height: 60, marginBottom: 10 }}>
                  <div style={{ position: 'absolute', left: 10, top: 0, width: 100, height: 40, display: 'flex', border: `1px solid ${THEME.border}`, borderRadius: 4, overflow: 'hidden', zIndex:5, background: THEME.panel }}>
                    <div style={{ width: 50, background: THEME.nodeColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{node.label}</div>
                    <div style={{ width: 50, color: THEME.textMuted, fontSize:12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>first</div>
                  </div>

                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents:'none' }}>
                    <defs><marker id="arrow-small" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={THEME.textMuted} /></marker></defs>
                    {neighbors.map((targetId, idx) => {
                      const prevX = 110 + idx * 100;
                      const currX = prevX + 40;
                      return <line key={idx} x1={prevX - (idx===0?0:0)} y1={20} x2={currX} y2={20} stroke={THEME.textMuted} strokeWidth="1.5" markerEnd="url(#arrow-small)" />;
                    })}
                    <text x={110 + neighbors.length * 100 + 10} y={25} fill={THEME.textMuted} fontSize="14">^</text>
                  </svg>

                  {neighbors.map((targetId, idx) => (
                    <motion.div key={targetId}
                      initial={{ opacity: 0, x: 130 + idx * 100 }} animate={{ opacity: 1, x: 150 + idx * 100 }}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: 60, height: 40,
                        display: 'flex', border: `1px solid ${THEME.edgeNode}`, borderRadius: 4, background: '#161b22', zIndex:5
                      }}
                    >
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.edgeNode, fontWeight: 'bold' }}>{nodes.find(n=>n.id===targetId)?.label || targetId}</div>
                       <div style={{ width: 20, borderLeft: `1px solid ${THEME.border}`, background: '#0d1117' }}></div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const btnStyle = (bg) => ({ padding: '6px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' });
const selectStyle = { background: '#0d1117', color: 'white', border: `1px solid ${THEME.border}`, padding: '4px', borderRadius: 4 };
const labelStyle = { position: 'absolute', top: 10, left: 10, color: THEME.textMuted, fontSize: 12, pointerEvents: 'none', zIndex: 20 };

export default AdjacencyListDemo;