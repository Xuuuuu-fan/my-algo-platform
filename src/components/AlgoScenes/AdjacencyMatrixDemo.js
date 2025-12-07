import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#58a6ff',    // 蓝色高亮
  highlight: '#d29922', // 橙色交互高亮
  gridLine: '#21262d',
  zero: '#30363d',      // 0 的颜色
  one: '#2ea043'        // 1 的颜色
};

const NODE_R = 24;

const AdjacencyMatrixDemo = () => {
  const containerRef = useRef(null);

  // ================== 状态管理 ==================
  const [isDirected, setIsDirected] = useState(true);
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 100, y: 100 },
    { id: 1, label: 'B', x: 300, y: 100 },
    { id: 2, label: 'C', x: 100, y: 300 },
    { id: 3, label: 'D', x: 300, y: 300 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 0 },
    { from: 0, to: 2 }
  ]);

  const [hoveredCell, setHoveredCell] = useState(null); // {r, c}

  // ================== 交互逻辑 ==================
  const addNode = () => {
    const newId = nodes.length;
    const label = String.fromCharCode(65 + (newId % 26));
    setNodes([...nodes, { id: newId, label, x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 }]);
  };

  const toggleEdge = (r, c) => {
    if (r === c) return;
    const exists = edges.find(e => e.from === r && e.to === c);
    let newEdges = [...edges];

    if (exists) {
      newEdges = newEdges.filter(e => !(e.from === r && e.to === c));
      if (!isDirected) {
        newEdges = newEdges.filter(e => !(e.from === c && e.to === r));
      }
    } else {
      newEdges.push({ from: r, to: c });
      if (!isDirected) {
        const reverseExists = newEdges.find(e => e.from === c && e.to === r);
        if (!reverseExists) newEdges.push({ from: c, to: r });
      }
    }
    setEdges(newEdges);
  };

  const updatePos = (id, info) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  const isConnected = (r, c) => edges.some(e => e.from === r && e.to === c);

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 15, alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>邻接矩阵演示</h3>
        <div style={{width:1, height:20, background:THEME.border}}></div>
        <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 添加顶点</button>
        <button onClick={() => { setIsDirected(!isDirected); setEdges([]); }} style={btnStyle('#2ea043')}>
          {isDirected ? "当前：有向图" : "当前：无向图"}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧：图结构 (修复版) === */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', borderRight: `1px solid ${THEME.border}`, minHeight: '400px', background: '#010409', overflow: 'hidden' }}>
          <div style={labelStyle}>逻辑结构 (可拖拽)</div>

          {/* 1. SVG 连线层 (绝对定位，底层) */}
          <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={THEME.textMuted} /></marker>
              <marker id="arrow-active" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill={THEME.highlight} /></marker>
            </defs>
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);
              const isHovered = hoveredCell && hoveredCell.r === e.from && hoveredCell.c === e.to;
              const color = isHovered ? THEME.highlight : THEME.textMuted;
              const marker = isHovered ? "url(#arrow-active)" : (isDirected ? "url(#arrow)" : "");
              return s && t && (
                <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={color} strokeWidth={isHovered ? 3 : 2} markerEnd={marker} />
              );
            })}
          </svg>

          {/* 2. 节点层 (绝对定位，高层级) */}
          {nodes.map(n => (
            <motion.div key={n.id}
              drag dragMomentum={false}
              dragConstraints={containerRef}
              onDragEnd={(e, i) => updatePos(n.id, i)}
              initial={{ x: n.x - NODE_R, y: n.y - NODE_R }}
              // 关键：更新位置时直接修改 x/y，不用 transform，避免 SVG 连线滞后
              animate={{ x: n.x - NODE_R, y: n.y - NODE_R }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute', top:0, left:0, // 强制归零，完全靠 x/y 控制
                width: NODE_R*2, height: NODE_R*2,
                borderRadius: '50%', background: THEME.accent, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                cursor: 'move', boxShadow: '0 0 0 4px rgba(0,0,0,0.2)',
                zIndex: 10 // 确保在 SVG 之上
              }}
            >
              {n.label}
            </motion.div>
          ))}
        </div>

        {/* === 右侧：矩阵视图 === */}
        <div style={{ flex: 1, background: '#0d1117', padding: 40, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${nodes.length}, 40px)`, gap: 2 }}>
            <div style={cellStyle('transparent', 'transparent')}></div>
            {nodes.map(n => <div key={`th-${n.id}`} style={cellStyle('transparent', THEME.accent)}>{n.label}</div>)}
            {nodes.map((rowNode, r) => (
              <React.Fragment key={`row-${r}`}>
                <div style={cellStyle('transparent', THEME.accent)}>{rowNode.label}</div>
                {nodes.map((colNode, c) => {
                  const active = isConnected(r, c);
                  const isHover = hoveredCell && hoveredCell.r === r && hoveredCell.c === c;
                  const bg = active ? (isHover ? '#3fb950' : THEME.one) : (isHover ? '#30363d' : '#161b22');
                  return (
                    <div key={`${r}-${c}`}
                      onClick={() => toggleEdge(r, c)}
                      onMouseEnter={() => setHoveredCell({r, c})}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        ...cellStyle(bg, active ? '#fff' : '#484f58'),
                        cursor: r===c ? 'not-allowed' : 'pointer',
                        border: isHover ? `1px solid ${THEME.highlight}` : `1px solid ${THEME.gridLine}`,
                        background: r===c ? '#0d1117' : bg
                      }}
                    >
                      {r === c ? '0' : (active ? '1' : '0')}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const btnStyle = (bg) => ({ padding: '6px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold' });
const labelStyle = { position: 'absolute', top: 10, left: 10, color: THEME.textMuted, fontSize: 12, pointerEvents: 'none', zIndex: 20 };
const cellStyle = (bg, color) => ({ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: color, borderRadius: 4, fontWeight: 'bold', fontSize: 14, userSelect: 'none' });

export default AdjacencyMatrixDemo;