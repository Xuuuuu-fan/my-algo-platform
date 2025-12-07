import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 1. 深色主题与配置 ==================
const THEME = {
  bg: '#0d1117',        // 全局背景
  panel: '#161b22',     // 卡片/面板背景
  border: '#30363d',    // 边框
  text: '#c9d1d9',      // 主文本
  textMuted: '#8b949e', // 辅助文本
  accent: '#58a6ff',    // 强调色 (蓝)

  // 节点相关颜色
  nodeData: '#1f6feb',  // 蓝色 (数据域)
  nodeIn: '#d29922',    // 橙色 (入度/hLink)
  nodeOut: '#2ea043',   // 绿色 (出度/tLink)

  // 代码高亮
  keyword: '#ff7b72',
  type: '#79c0ff',
  comment: '#8b949e'
};

const DIMS = {
  vW: 100, vH: 34,      // 顶点表头尺寸
  aW: 110, aH: 64,      // 弧节点尺寸
  nodeR: 24             // 逻辑圆节点半径
};

const OrthogonalListDemo = () => {
  // ================== 2. 状态管理 ==================

  // 逻辑节点
  const [vertices, setVertices] = useState([
    { id: 0, label: 'A', x: 100, y: 100 },
    { id: 1, label: 'B', x: 350, y: 100 },
    { id: 2, label: 'C', x: 100, y: 350 },
    { id: 3, label: 'D', x: 350, y: 350 },
  ]);

  // 逻辑连线
  const [edges, setEdges] = useState([
    { from: 0, to: 1, id: '0-1' },
    { from: 0, to: 2, id: '0-2' },
    { from: 2, to: 3, id: '2-3' },
    { from: 3, to: 0, id: '3-0' },
  ]);

  // 十字链表位置状态
  const [orthoHeads, setOrthoHeads] = useState([
    { id: 0, x: 50, y: 50 },
    { id: 1, x: 50, y: 160 },
    { id: 2, x: 50, y: 270 },
    { id: 3, x: 50, y: 380 },
  ]);

  const [orthoArcs, setOrthoArcs] = useState([
    { id: '0-1', x: 220, y: 50 },
    { id: '0-2', x: 350, y: 80 },
    { id: '2-3', x: 220, y: 270 },
    { id: '3-0', x: 350, y: 380 },
  ]);

  // 交互与日志
  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });
  const [logs, setLogs] = useState(["初始化图结构完成..."]);

  // ================== 3. 交互逻辑 ==================

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const addNode = () => {
    const newId = vertices.length > 0 ? Math.max(...vertices.map(v => v.id)) + 1 : 0;
    const label = String.fromCharCode(65 + (newId % 26));

    // 随机位置
    setVertices([...vertices, { id: newId, label, x: 50 + Math.random()*200, y: 50 + Math.random()*200 }]);

    // 自动排列表头
    const lastHeadY = orthoHeads.length > 0 ? orthoHeads[orthoHeads.length-1].y : 20;
    setOrthoHeads([...orthoHeads, { id: newId, x: 50, y: lastHeadY + 110 }]);

    addLog(`添加顶点 ${label} (Index: ${newId})，初始化 firstIn 和 firstOut 为 NULL`);
  };

  const addEdge = () => {
    const { from, to } = edgeInput;
    const fId = Number(from);
    const tId = Number(to);

    if (fId === tId) return alert("暂不支持自环");
    if (edges.find(e => e.from === fId && e.to === tId)) return alert("边已存在");

    const newEdgeId = `${fId}-${tId}`;
    setEdges([...edges, { from: fId, to: tId, id: newEdgeId }]);

    // 智能计算初始位置
    const sourceHead = orthoHeads.find(h => h.id === fId);
    const existingRowArcs = edges.filter(e => e.from === fId).length;
    const startX = sourceHead ? sourceHead.x + 160 + (existingRowArcs * 120) : 200;
    const startY = sourceHead ? sourceHead.y : 100;

    setOrthoArcs([...orthoArcs, { id: newEdgeId, x: startX, y: startY }]);

    const fromLabel = vertices.find(v => v.id === fId)?.label;
    const toLabel = vertices.find(v => v.id === tId)?.label;
    addLog(`添加弧 <${fromLabel}→${toLabel}> : 创建弧节点，更新 ${fromLabel} 的出度链表 (tLink)，更新 ${toLabel} 的入度链表 (hLink)`);
  };

  const updatePos = (setter, list, id, info) => {
    setter(list.map(item => item.id === id ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y } : item));
  };

  // ================== 4. 连线渲染逻辑 ==================
  const renderLinks = () => {
    const links = [];

    // --- 绿色连线 (tLink / 出度) ---
    vertices.forEach(v => {
      const headPos = orthoHeads.find(h => h.id === v.id);
      if (!headPos) return;

      const outEdges = edges.filter(e => e.from === v.id).sort((a,b) => a.to - b.to); // 简单排序模拟链表顺序

      // 起点：表头 Out 域
      let startX = headPos.x + DIMS.vW;
      let startY = headPos.y + DIMS.vH / 2;

      outEdges.forEach((edge, index) => {
        const arcNode = orthoArcs.find(a => a.id === edge.id);
        if (!arcNode) return;

        // 终点：弧节点左侧上方 (TailVex入口)
        const targetX = arcNode.x;
        const targetY = arcNode.y + DIMS.aH * 0.25;

        links.push(<PathLine key={`g-${v.id}-${index}`} d={getBezierPath(startX, startY, targetX, targetY)} color={THEME.nodeOut} />);

        // 更新起点：弧节点右侧下方 (tLink出口)
        startX = arcNode.x + DIMS.aW;
        startY = arcNode.y + (DIMS.aH * 0.75);
      });

      // NULL 指针
      links.push(<TextLabel key={`gn-${v.id}`} x={startX + 15} y={startY} text="^" color={THEME.nodeOut} />);
    });

    // --- 橙色连线 (hLink / 入度) ---
    vertices.forEach(v => {
      const headPos = orthoHeads.find(h => h.id === v.id);
      if (!headPos) return;

      const inEdges = edges.filter(e => e.to === v.id).sort((a,b) => a.from - b.from);

      // 起点：表头 In 域
      let startX = headPos.x + (DIMS.vW * 0.65);
      let startY = headPos.y + DIMS.vH;

      inEdges.forEach((edge, index) => {
        const arcNode = orthoArcs.find(a => a.id === edge.id);
        if (!arcNode) return;

        // 终点：弧节点左侧下方 (hLink 入口，模拟链入)
        const targetX = arcNode.x + 20;
        const targetY = arcNode.y + DIMS.aH - 5;

        // 使用更弯曲的路径避免重叠
        links.push(<PathLine key={`o-${v.id}-${index}`} d={getBezierPath(startX, startY, targetX, targetY, true)} color={THEME.nodeIn} dashed />);

        // 更新起点：弧节点下方 (hLink出口)
        startX = arcNode.x + (DIMS.aW * 0.4);
        startY = arcNode.y + DIMS.aH;
      });

      links.push(<TextLabel key={`on-${v.id}`} x={startX} y={startY+15} text="^" color={THEME.nodeIn} vertical />);
    });

    return links;
  };

  // ================== 5. 组件渲染 ==================
  return (
    <div style={{
      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: THEME.bg, color: THEME.text, overflow: 'hidden'
    }}>

      {/* Top Bar */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: 15 }}>
        <h3 style={{ margin: 0, color: '#fff' }}>十字链表动态演示 <span style={{fontSize:12, fontWeight:'normal', color:THEME.textMuted}}>Orthogonal List Demo</span></h3>
        <div style={{width:1, height:20, background:THEME.border}}></div>
        <button onClick={addNode} style={btnStyle(THEME.nodeOut)}>+ 添加节点</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}` }}>
          <select value={edgeInput.from} onChange={e => setEdgeInput({...edgeInput, from: e.target.value})} style={selectStyle}>
            {vertices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <span style={{color:THEME.textMuted}}>→</span>
          <select value={edgeInput.to} onChange={e => setEdgeInput({...edgeInput, to: e.target.value})} style={selectStyle}>
            {vertices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={addEdge} style={btnStyle(THEME.nodeData)}>添加连接 (Arc)</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left Panel: Graph Structure */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}`, minWidth: 350 }}>
          <div style={panelHeaderStyle}>逻辑结构图 (可拖拽/滚动)</div>
          <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#0d1117' }}>
            <svg style={{ width: '1000px', height: '1000px', position: 'absolute' }}>
              <defs>
                <marker id="arrow-logic" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill={THEME.textMuted} />
                </marker>
              </defs>
              {edges.map(e => {
                const s = vertices.find(v => v.id === e.from);
                const t = vertices.find(v => v.id === e.to);
                return s && t && (
                  <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={THEME.textMuted} strokeWidth="2" markerEnd="url(#arrow-logic)" />
                );
              })}
            </svg>
            {vertices.map(v => (
              <motion.div key={v.id}
                drag dragMomentum={false} onDragEnd={(e, i) => updatePos(setVertices, vertices, v.id, i)}
                initial={{ x: v.x - DIMS.nodeR, y: v.y - DIMS.nodeR }}
                style={{
                  position: 'absolute', width: DIMS.nodeR*2, height: DIMS.nodeR*2,
                  borderRadius: '50%', background: THEME.nodeData, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 4px rgba(31, 111, 235, 0.2)', cursor: 'move', fontWeight: 'bold', zIndex: 10
                }}
              >
                {v.label}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Panel: Orthogonal List */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={panelHeaderStyle}>十字链表存储结构 (Memory View)</div>
          <div style={{ flex: 1, overflow: 'auto', background: '#010409', position: 'relative' }}>
            <svg style={{ width: '1500px', height: '1200px', position: 'absolute' }}>
              <defs>
                <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={THEME.nodeOut} /></marker>
                <marker id="arrow-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={THEME.nodeIn} /></marker>
              </defs>
              {renderLinks()}
            </svg>

            {/* List Heads */}
            {vertices.map(v => {
              const pos = orthoHeads.find(h => h.id === v.id);
              return pos && (
                <motion.div key={`head-${v.id}`}
                  drag dragMomentum={false} onDragEnd={(e, i) => updatePos(setOrthoHeads, orthoHeads, v.id, i)}
                  initial={{ x: pos.x, y: pos.y }}
                  style={{
                    position: 'absolute', width: DIMS.vW, height: DIMS.vH,
                    display: 'flex', border: `1px solid ${THEME.border}`, background: THEME.panel,
                    cursor: 'move', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ flex: 1, color: THEME.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold' }}>{v.label}</div>
                  <div style={{ flex: 1, background: THEME.nodeIn, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>In</div>
                  <div style={{ flex: 1, background: THEME.nodeOut, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Out</div>
                </motion.div>
              );
            })}

            {/* Arc Nodes */}
            {edges.map(e => {
              const pos = orthoArcs.find(a => a.id === e.id);
              const fromLabel = vertices.find(v => v.id === e.from)?.label;
              const toLabel = vertices.find(v => v.id === e.to)?.label;
              return pos && (
                <motion.div key={`arc-${e.id}`}
                  drag dragMomentum={false} onDragEnd={(ev, i) => updatePos(setOrthoArcs, orthoArcs, e.id, i)}
                  initial={{ x: pos.x, y: pos.y }}
                  style={{
                    position: 'absolute', width: DIMS.aW, height: DIMS.aH,
                    border: `1px solid ${THEME.border}`, background: THEME.panel,
                    display: 'flex', flexDirection: 'column',
                    cursor: 'move', borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontSize: 11
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', borderBottom: `1px solid ${THEME.border}` }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.text }}>
                      <span style={{color:THEME.nodeOut, marginRight:4}}>T:</span>{fromLabel}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${THEME.border}`, color: THEME.text }}>
                      <span style={{color:THEME.nodeIn, marginRight:4}}>H:</span>{toLabel}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 1, color: THEME.nodeIn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>hLink</div>
                    <div style={{ flex: 1, color: THEME.nodeOut, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${THEME.border}` }}>tLink</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Explanation & Code */}
      <div style={{ height: 200, borderTop: `1px solid ${THEME.border}`, background: THEME.panel, display: 'flex' }}>

        {/* Theory / Code */}
        <div style={{ width: 400, borderRight: `1px solid ${THEME.border}`, padding: 15, overflow: 'auto' }}>
          <div style={{fontWeight:'bold', marginBottom:10, color:THEME.text}}>Struct Definition (C++)</div>
          <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: THEME.textMuted }}>
{`// 弧结点 (ArcBox)
struct ArcBox {
  int tailvex, headvex; // 尾/头顶点位置
  struct ArcBox *hlink; // `}<span style={{color:THEME.nodeIn}}>hLink: 相同弧头(入边)</span>{`
  struct ArcBox *tlink; // `}<span style={{color:THEME.nodeOut}}>tLink: 相同弧尾(出边)</span>{`
};

// 顶点结点 (VexNode)
struct VexNode {
  VertexType data;
  ArcBox *firstin;      // `}<span style={{color:THEME.nodeIn}}>firstIn: 第一条入边</span>{`
  ArcBox *firstout;     // `}<span style={{color:THEME.nodeOut}}>firstOut: 第一条出边</span>{`
};`}
          </pre>
        </div>

        {/* Action Logs */}
        <div style={{ flex: 1, padding: 15, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{fontWeight:'bold', marginBottom:10, color:THEME.text}}>操作日志 (Operation Log)</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: 4, fontSize: 12, color: i===0 ? THEME.text : THEME.textMuted, borderLeft: i===0 ? `2px solid ${THEME.accent}` : 'none', paddingLeft: 6 }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

// ================== 辅助函数与组件 ==================

const PathLine = ({ d, color, dashed }) => (
  <path d={d} stroke={color} strokeWidth="1.5" fill="none"
    markerEnd={color === THEME.nodeOut ? "url(#arrow-green)" : "url(#arrow-orange)"}
    strokeDasharray={dashed ? "4,4" : "none"}
    opacity="0.8" />
);

const TextLabel = ({ x, y, text, color, vertical }) => (
  <text
    x={x} y={y} fill={color} fontWeight="bold"
    transform={vertical ? `rotate(90, ${x}, ${y})` : ''}
    textAnchor="middle" style={{ fontSize: 14 }}
  >
    {text}
  </text> // <--- 确保闭合正确
);

const getBezierPath = (x1, y1, x2, y2, isCurved) => {
  if (isCurved) {
    const cp1x = x1 + (x2 - x1) * 0.5;
    const cp1y = y1 + 50;
    const cp2x = x2 - (x2 - x1) * 0.5;
    const cp2y = y2 + 50;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }
  const dx = Math.abs(x2 - x1);
  const cp1x = x1 + dx * 0.5;
  const cp1y = y1;
  const cp2x = x2 - dx * 0.5;
  const cp2y = y2;
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
};

const btnStyle = (bg) => ({
  padding: '6px 12px', borderRadius: 4, border: 'none', background: bg, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 12
});
const selectStyle = {
  background: '#0d1117', color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: '2px 5px', fontSize: 12
};
const panelHeaderStyle = {
  padding: '8px 15px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, fontSize: 12, fontWeight: 'bold', color: THEME.textMuted
};

export default OrthogonalListDemo;