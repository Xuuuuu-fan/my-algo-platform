import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  codeBg: '#0d1117',
  accent: '#58a6ff',    // 默认蓝
  active: '#d29922',    // 当前节点 (橙)
  visited: '#2ea043',   // 已完成 (绿)
  neighbor: '#a371f7',  // 正在检查的邻居 (紫)
  stackBg: '#21262d',
  delete: '#da3633',    // 删除按钮红
  highlight: '#3fb95040',
  tooltipBg: '#6e7681'  // 提示框背景
};

const NODE_R = 22;

// C++ 伪代码定义
const CODE_LINES = [
  { id: 1, text: "void DFS(Graph G, int u) {", indent: 0 },
  { id: 2, text: "    visited[u] = TRUE; // 标记访问", indent: 0 },
  { id: 3, text: "    for (w = FirstAdj(u); w >= 0; w = NextAdj(u, w)) {", indent: 0 },
  { id: 4, text: "        if (!visited[w]) {", indent: 2 },
  { id: 5, text: "            DFS(G, w); // 递归访问", indent: 3 },
  { id: 6, text: "        }", indent: 2 },
  { id: 7, text: "    }", indent: 0 },
  { id: 8, text: "} // 函数返回", indent: 0 },
];

const DFSVisualizer = () => {
  const containerRef = useRef(null);

  // ================== 图数据状态 ==================
  const [nodes, setNodes] = useState([
    { id: 0, label: '1', x: 100, y: 100 },
    { id: 1, label: '2', x: 250, y: 100 },
    { id: 2, label: '3', x: 400, y: 100 },
    { id: 3, label: '4', x: 100, y: 250 },
    { id: 4, label: '5', x: 250, y: 250 },
    { id: 5, label: '6', x: 400, y: 250 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1 }, { from: 0, to: 3 },
    { from: 1, to: 2 }, { from: 1, to: 4 },
    { from: 2, to: 5 },
    { from: 4, to: 5 },
    { from: 3, to: 4 }
  ]);

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });
  const [startNodeId, setStartNodeId] = useState(0);

  // 辅助：获取邻接表 (无向图逻辑)
  const getAdjacency = () => {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    });
    Object.keys(adj).forEach(k => adj[k].sort((a,b) => a-b));
    return adj;
  };

  // ================== 核心：DFS 步骤生成器 ==================
  const generateSteps = (startId) => {
    const adj = getAdjacency();
    const newSteps = [];
    const visited = new Set();
    const stack = [];

    const pushStep = (u, w, line, desc) => {
      newSteps.push({
        visited: new Set(visited),
        stack: JSON.parse(JSON.stringify(stack)),
        activeU: u,
        activeW: w,
        line,
        desc,
      });
    };

    const dfs = (u) => {
      stack.push({ u, name: `DFS(${nodes.find(n=>n.id===u)?.label})` });
      pushStep(u, null, 1, `进入函数 DFS(${nodes.find(n=>n.id===u)?.label})`);

      visited.add(u);
      pushStep(u, null, 2, `标记节点 ${nodes.find(n=>n.id===u)?.label} 为已访问`);

      const neighbors = adj[u] || [];
      for (let w of neighbors) {
        pushStep(u, w, 3, `检查 ${nodes.find(n=>n.id===u)?.label} 的邻居: ${nodes.find(n=>n.id===w)?.label}`);

        pushStep(u, w, 4, `判断邻居 ${nodes.find(n=>n.id===w)?.label} 是否已访问? ${visited.has(w) ? "是(跳过)" : "否(递归)"}`);

        if (!visited.has(w)) {
          pushStep(u, w, 5, `准备递归进入 DFS(${nodes.find(n=>n.id===w)?.label})...`);
          dfs(w);
          pushStep(u, w, 5, `从 DFS(${nodes.find(n=>n.id===w)?.label}) 返回，继续处理 ${nodes.find(n=>n.id===u)?.label}`);
        }
      }

      pushStep(u, null, 8, `节点 ${nodes.find(n=>n.id===u)?.label} 的邻居遍历完毕，函数返回`);
      stack.pop();
    };

    dfs(startId);
    newSteps.push({
      visited: new Set(visited),
      stack: [],
      activeU: null,
      activeW: null,
      line: -1,
      desc: "DFS 遍历结束"
    });

    return newSteps;
  };

  // ================== 控制逻辑 ==================

  const reset = () => {
    setIsAutoPlaying(false);
    setCurrentStep(-1);
    setSteps([]);
  };

  const startDFS = () => {
    reset();
    const s = generateSteps(startNodeId);
    setSteps(s);
    setCurrentStep(0);
    setIsAutoPlaying(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsAutoPlaying(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setIsAutoPlaying(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStep < steps.length - 1) {
      interval = setInterval(nextStep, 1000);
    } else {
      setIsAutoPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  // 如果没有步骤，显示指南信息
  const defaultDesc = (
    <span>
      <strong>准备就绪。</strong> 请先在上方选择 <strong>Start (起始节点)</strong>，然后点击 <strong>"开始遍历"</strong>。<br/>
      <span style={{opacity:0.7, fontSize:12}}>* 起始节点决定了 DFS 算法从图中的哪个入口开始搜索。不同的入口会产生不同的遍历序列。</span>
    </span>
  );

  const curState = steps[currentStep] || {
    visited: new Set(), stack: [], activeU: null, activeW: null, line: -1, desc: defaultDesc
  };

  // ================== 图编辑功能 ==================

  const updateNodePos = (id, info) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  const addNode = () => {
    reset();
    const id = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    setNodes([...nodes, {id, label:`${id+1}`, x: 50+Math.random()*200, y:50+Math.random()*200}]);
  };

  const addEdge = () => {
    const { from, to } = edgeInput;
    const u = Number(from);
    const v = Number(to);
    if (u === v) return;
    if (!edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u))) {
      reset();
      setEdges([...edges, {from: u, to: v}]);
    }
  };

  const removeEdge = () => {
    const { from, to } = edgeInput;
    const u = Number(from);
    const v = Number(to);

    const exists = edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (exists) {
        reset();
        setEdges(edges.filter(e => !((e.from === u && e.to === v) || (e.from === v && e.to === u))));
    } else {
        alert("未找到该连线");
    }
  };

  const handleEdgeDoubleClick = (edgeIndex) => {
      reset();
      const newEdges = [...edges];
      newEdges.splice(edgeIndex, 1);
      setEdges(newEdges);
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', marginRight: 10 }}>DFS 演示</h3>

        {/* 编辑区 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingRight: 15, borderRight: `1px solid ${THEME.border}` }}>
            <Tooltip text="在画布中增加一个新的顶点 (可拖拽)">
              <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 节点</button>
            </Tooltip>

            <div style={groupStyle}>
                <select value={edgeInput.from} onChange={e=>setEdgeInput({...edgeInput, from:e.target.value})} style={selectStyle}>
                    {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <span style={{color: THEME.textMuted}}>-</span>
                <select value={edgeInput.to} onChange={e=>setEdgeInput({...edgeInput, to:e.target.value})} style={selectStyle}>
                    {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <Tooltip text="添加一条边连接两个选中的节点">
                  <button onClick={addEdge} style={btnStyle(THEME.border)}>添加</button>
                </Tooltip>
                <Tooltip text="删除选中的连线 (或双击画布上的线)">
                  <button onClick={removeEdge} style={btnStyle(THEME.delete)}>删除</button>
                </Tooltip>
            </div>
        </div>

        {/* 播放控制区 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Start 选择器 + 解释提示 */}
            <div style={{display:'flex', alignItems:'center', gap:5}}>
                <label style={{fontSize:12}}>Start:</label>
                <select value={startNodeId} onChange={e=>{reset(); setStartNodeId(Number(e.target.value))}} style={selectStyle}>
                    {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <Tooltip text="【算法入口】\n决定 DFS 从哪个节点开始搜索。\n就像走迷宫需要选择一个入口一样。">
                  <div style={{
                    width:16, height:16, borderRadius:'50%', background: THEME.border,
                    color: THEME.textMuted, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'help', fontWeight:'bold'
                  }}>?</div>
                </Tooltip>
            </div>

            <button onClick={startDFS} style={btnStyle('#2ea043')}>开始遍历</button>

            <div style={{display:'flex', gap:5}}>
              <button onClick={prevStep} style={btnStyle(THEME.accent)} disabled={currentStep <= 0} title="上一步">◀</button>
              <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={btnStyle(THEME.active)} style={{...btnStyle(THEME.active), width: 80}}>
                  {isAutoPlaying ? "暂停" : "自动播放"}
              </button>
              <button onClick={nextStep} style={btnStyle(THEME.accent)} disabled={isAutoPlaying || currentStep === -1 || currentStep >= steps.length -1} title="下一步">▶</button>
            </div>

            <button onClick={reset} style={btnStyle(THEME.border)}>重置</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧：图可视化 === */}
        <div ref={containerRef} style={{ flex: 1.5, position: 'relative', borderRight: `1px solid ${THEME.border}`, background: '#010409', overflow: 'hidden' }}>
          <div style={labelStyle}>逻辑结构 (Graph)</div>
          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);

              const isChecking = (curState.activeU === e.from && curState.activeW === e.to) || (curState.activeU === e.to && curState.activeW === e.from);
              const color = isChecking ? THEME.neighbor : THEME.border;

              return s && t && (
                <g key={i} onDoubleClick={() => handleEdgeDoubleClick(i)} style={{cursor: 'pointer'}}>
                    <title>双击删除此连线</title>
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={color} strokeWidth={isChecking ? 3 : 2} style={{ pointerEvents: 'none' }} />
                </g>
              );
            })}
          </svg>
          {nodes.map(n => {
            let bg = THEME.accent;
            if (curState.visited.has(n.id)) bg = THEME.visited;
            if (curState.activeU === n.id) bg = THEME.active;
            if (curState.activeW === n.id) bg = THEME.neighbor;

            return (
              <motion.div key={n.id}
                drag dragMomentum={false} dragConstraints={containerRef}
                onDragEnd={(e, i) => updateNodePos(n.id, i)}
                animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale: curState.activeU === n.id ? 1.2 : 1 }}
                transition={{ type: 'spring' }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: NODE_R*2, height: NODE_R*2,
                  borderRadius: '50%', background: bg, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                  border: `2px solid ${curState.activeU === n.id ? '#fff' : 'transparent'}`,
                  cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 10
                }}
              >
                {n.label}
              </motion.div>
            );
          })}
        </div>

        {/* === 右侧：代码与栈 === */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: THEME.bg }}>

          <div style={{ flex: 1, padding: 10, borderBottom: `1px solid ${THEME.border}`, overflow: 'auto', background: THEME.codeBg }}>
            <div style={{fontSize:12, color:THEME.textMuted, marginBottom:5}}>C++ Code (Recursive)</div>
            {CODE_LINES.map(line => (
              <div key={line.id} style={{
                padding: '2px 5px', fontSize: 13,
                background: curState.line === line.id ? '#3fb95040' : 'transparent',
                color: curState.line === line.id ? '#fff' : THEME.textMuted,
                borderLeft: curState.line === line.id ? `3px solid ${THEME.visited}` : '3px solid transparent',
                paddingLeft: 10 + line.indent * 15
              }}>
                {line.text}
              </div>
            ))}
          </div>

          <div style={{ flex: 1.2, padding: 15, borderBottom: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{fontSize:12, color:THEME.textMuted, marginBottom:10, display:'flex', justifyContent:'space-between'}}>
              <span>Function Call Stack</span>
              <span>Size: {curState.stack.length}</span>
            </div>
            <div style={{ flex: 1, background: THEME.panel, borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column-reverse', gap: 5, overflow: 'auto', alignItems: 'center' }}>
              <AnimatePresence>
                {curState.stack.map((frame, index) => (
                  <motion.div
                    key={`${frame.u}-${index}`}
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    style={{
                      width: '90%', padding: '8px 12px',
                      background: index === curState.stack.length - 1 ? THEME.active : THEME.visited,
                      color: '#fff', borderRadius: 4, fontSize: 13,
                      display: 'flex', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {frame.name}
                  </motion.div>
                ))}
              </AnimatePresence>
              {curState.stack.length === 0 && (
                <div style={{color:THEME.textMuted, fontSize:12, marginTop:'auto', marginBottom:'auto'}}>Stack Empty</div>
              )}
            </div>
          </div>

          <div style={{ height: 100, padding: 15, background: '#1c2128' }}>
            <div style={{fontSize:12, color:THEME.textMuted, marginBottom:5}}>Log (操作日志)</div>
            <div style={{ fontSize: 14, color: THEME.text, lineHeight: 1.5 }}>
              {curState.desc}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ================== 自定义 Tooltip 组件 ==================
const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', bottom: '100%', left: '50%', x: '-50%', marginBottom: 8,
              background: THEME.tooltipBg, color: '#fff', padding: '5px 10px', borderRadius: 4,
              fontSize: 12, whiteSpace: 'pre-line', zIndex: 100, textAlign: 'center', minWidth: 120,
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)', pointerEvents: 'none'
            }}
          >
            {text}
            <div style={{ position: 'absolute', top: '100%', left: '50%', marginLeft: -4, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${THEME.tooltipBg}` }}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ================== 样式 ==================
const btnStyle = (bg) => ({
  padding: '6px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});
const selectStyle = {
  background: '#0d1117', color: 'white', border: `1px solid ${THEME.border}`, padding: '4px', borderRadius: 4
};
const groupStyle = {
  display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}`
};
const labelStyle = { position: 'absolute', top: 10, left: 10, color: THEME.textMuted, fontSize: 12, pointerEvents: 'none', zIndex: 20 };

export default DFSVisualizer;