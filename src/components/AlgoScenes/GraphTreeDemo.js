import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#58a6ff',    // 蓝色
  active: '#d29922',    // 当前处理 (橙)
  visited: '#2ea043',   // 已访问 (绿)
  treeEdge: '#2ea043',  // 树边颜色 (绿)
  delete: '#da3633',    // 删除红
  highlight: '#3fb95040',
  tooltipBg: '#6e7681'
};

const NODE_R = 22;

const GraphTreeDemo = () => {
  const containerRef = useRef(null);

  // ================== 数据状态 ==================
  const [mode, setMode] = useState('BFS'); // 'BFS' or 'DFS'

  // 初始节点
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 250, y: 60 },
    { id: 1, label: 'B', x: 150, y: 150 },
    { id: 2, label: 'C', x: 350, y: 150 },
    { id: 3, label: 'D', x: 100, y: 250 },
    { id: 4, label: 'E', x: 200, y: 250 },
    { id: 5, label: 'F', x: 300, y: 250 },
    { id: 6, label: 'G', x: 400, y: 250 },
  ]);

  // 初始连线
  const [edges, setEdges] = useState([
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 2, to: 5 }, { from: 2, to: 6 },
    { from: 4, to: 5 }, // 横向边 (Cross Edge)
    { from: 3, to: 4 }
  ]);

  // 编辑输入状态
  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [startNodeId, setStartNodeId] = useState(0);

  // 辅助：获取邻接表 (无向图逻辑)
  const getAdjacency = () => {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    });
    // 排序保证确定性
    Object.keys(adj).forEach(k => adj[k].sort((a,b) => a-b));
    return adj;
  };

  // ================== 算法实现 ==================

  // 1. BFS 生成树
  const generateBFS = (startId) => {
    const adj = getAdjacency();
    const newSteps = [];

    const visited = new Set();
    const treeEdges = [];
    const queue = [];

    const pushStep = (u, desc) => {
      newSteps.push({
        type: 'BFS',
        visited: new Set(visited),
        treeEdges: [...treeEdges],
        activeNode: u,
        desc
      });
    };

    visited.add(startId);
    queue.push(startId);
    pushStep(startId, `从起点 ${nodes.find(n=>n.id===startId)?.label} 开始，加入队列`);

    while (queue.length > 0) {
      const u = queue.shift();
      pushStep(u, `节点 ${nodes.find(n=>n.id===u)?.label} 出队，检查邻居`);

      const neighbors = adj[u] || [];
      for (let w of neighbors) {
        if (!visited.has(w)) {
          visited.add(w);
          treeEdges.push({ from: u, to: w });
          queue.push(w);
          pushStep(u, `发现未访问邻居 ${nodes.find(n=>n.id===w)?.label}，标记为树边`);
        }
      }
    }

    newSteps.push({
      type: 'BFS',
      visited: new Set(visited),
      treeEdges: [...treeEdges],
      activeNode: null,
      desc: "BFS 生成树构建完成"
    });

    return newSteps;
  };

  // 2. DFS 生成树
  const generateDFS = (startId) => {
    const adj = getAdjacency();
    const newSteps = [];

    const visited = new Set();
    const treeEdges = [];

    const pushStep = (u, desc) => {
      newSteps.push({
        type: 'DFS',
        visited: new Set(visited),
        treeEdges: [...treeEdges],
        activeNode: u,
        desc
      });
    };

    const dfs = (u) => {
      visited.add(u);
      pushStep(u, `访问节点 ${nodes.find(n=>n.id===u)?.label}`);

      const neighbors = adj[u] || [];
      for (let w of neighbors) {
        if (!visited.has(w)) {
          treeEdges.push({ from: u, to: w });
          pushStep(u, `发现未访问邻居 ${nodes.find(n=>n.id===w)?.label}，连接树边并递归`);
          dfs(w);
          pushStep(u, `递归返回到节点 ${nodes.find(n=>n.id===u)?.label}`);
        }
      }
    };

    dfs(startId);

    newSteps.push({
      type: 'DFS',
      visited: new Set(visited),
      treeEdges: [...treeEdges],
      activeNode: null,
      desc: "DFS 生成树构建完成"
    });

    return newSteps;
  };

  // ================== 控制逻辑 ==================

  const reset = () => {
    setIsAutoPlaying(false);
    setCurrentStep(-1);
    setSteps([]);
  };

  const startTraversal = () => {
    reset();
    // 检查起点是否存在 (防止删除节点后起点失效)
    if (!nodes.find(n => n.id === startNodeId)) {
        setStartNodeId(nodes[0].id);
        alert("原起点已被删除，已自动重置为第一个节点，请重新点击生成。");
        return;
    }
    const algo = mode === 'BFS' ? generateBFS : generateDFS;
    const s = algo(startNodeId);
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

  const curState = steps[currentStep] || {
    visited: new Set(), treeEdges: [], activeNode: null, desc: "请编辑图结构或直接点击生成"
  };

  // ================== 图编辑功能 ==================

  const updateNodePos = (id, info) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  const addNode = () => {
    reset();
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    // 使用字母生成标签 A, B, C...
    const label = String.fromCharCode(65 + (newId % 26)) + (newId >= 26 ? Math.floor(newId/26) : '');
    setNodes([...nodes, {id: newId, label, x: 50+Math.random()*200, y:50+Math.random()*200}]);
  };

  const addEdge = () => {
    const { from, to } = edgeInput;
    const u = Number(from);
    const v = Number(to);
    if (u === v) return;

    // 无向图检查重复
    const exists = edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (!exists) {
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
    }
  };

  const handleEdgeDoubleClick = (edgeIndex) => {
      reset();
      const newEdges = [...edges];
      newEdges.splice(edgeIndex, 1);
      setEdges(newEdges);
  };

  // ================== 辅助渲染 ==================

  const renderNodes = (isTreePanel) => {
    return nodes.map(n => {
      if (isTreePanel && !curState.visited.has(n.id)) return null; // 树视图只显示已访问节点

      let bg = THEME.accent;
      if (curState.visited.has(n.id)) bg = THEME.visited;
      if (curState.activeNode === n.id && !isTreePanel) bg = THEME.active;

      return (
        <motion.div key={n.id}
          drag dragMomentum={false} dragConstraints={containerRef}
          onDragEnd={(e, i) => updateNodePos(n.id, i)}
          initial={{ scale: 0 }}
          animate={{
            x: n.x - NODE_R,
            y: n.y - NODE_R,
            scale: 1,
            opacity: isTreePanel && !curState.visited.has(n.id) ? 0 : 1
          }}
          transition={{ type: 'spring' }}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: NODE_R*2, height: NODE_R*2,
            borderRadius: '50%', background: bg, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
            border: `2px solid #fff`,
            cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 10
          }}
        >
          {n.label}
        </motion.div>
      );
    });
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>生成树演示</h3>

        {/* 模式切换 */}
        <div style={{display:'flex', background: '#010409', borderRadius:6, padding:2, border: `1px solid ${THEME.border}`}}>
            <Tooltip text="广度优先生成树 (层层扩散)">
                <button onClick={() => { setMode('BFS'); reset(); }} style={tabStyle(mode === 'BFS')}>BFS 树</button>
            </Tooltip>
            <Tooltip text="深度优先生成树 (一条路走到黑)">
                <button onClick={() => { setMode('DFS'); reset(); }} style={tabStyle(mode === 'DFS')}>DFS 树</button>
            </Tooltip>
        </div>

        {/* 编辑区 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingRight: 15, borderRight: `1px solid ${THEME.border}`, borderLeft: `1px solid ${THEME.border}`, paddingLeft: 15 }}>
            <Tooltip text="增加新节点">
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
                <button onClick={addEdge} style={btnStyle(THEME.border)}>连线</button>
                <button onClick={removeEdge} style={btnStyle(THEME.delete)}>删除</button>
            </div>
        </div>

        {/* 播放区 */}
        <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{display:'flex', alignItems:'center', gap:5}}>
                <label style={{fontSize:12}}>Root:</label>
                <select value={startNodeId} onChange={e=>{reset(); setStartNodeId(Number(e.target.value))}} style={selectStyle}>
                    {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <Tooltip text="生成树的根节点 (起始点)">
                    <div style={{fontSize:12, cursor:'help'}}>?</div>
                </Tooltip>
            </div>

            <button onClick={startTraversal} style={btnStyle(THEME.visited)}>生成</button>
            <div style={{display:'flex', gap:5}}>
                <button onClick={prevStep} style={btnStyle(THEME.accent)} disabled={currentStep<=0}>◀</button>
                <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={btnStyle(THEME.active)} style={{...btnStyle(THEME.active), width:70}}>
                    {isAutoPlaying ? "暂停" : "播放"}
                </button>
                <button onClick={nextStep} style={btnStyle(THEME.accent)} disabled={currentStep >= steps.length-1}>▶</button>
            </div>
            <button onClick={reset} style={btnStyle(THEME.border)}>重置</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧：原始图 === */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', borderRight: `1px solid ${THEME.border}`, background: '#0d1117' }}>
          <div style={labelStyle}>原始图 (可编辑/拖拽)</div>
          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);
              const isTreeEdge = curState.treeEdges.some(te => (te.from===e.from && te.to===e.to) || (te.from===e.to && te.to===e.from));
              return s && t && (
                <g key={i} onDoubleClick={() => handleEdgeDoubleClick(i)} style={{cursor: 'pointer'}}>
                    <title>双击删除</title>
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={isTreeEdge ? THEME.visited : THEME.border} strokeWidth={isTreeEdge ? 3 : 1} style={{pointerEvents:'none'}} />
                </g>
              );
            })}
          </svg>
          {renderNodes(false)}
        </div>

        {/* === 右侧：生成树 === */}
        <div style={{ flex: 1, position: 'relative', background: '#010409' }}>
          <div style={labelStyle}>结果：{mode} 生成树</div>

          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            <AnimatePresence>
                {curState.treeEdges.map((e, i) => {
                const s = nodes.find(n => n.id === e.from);
                const t = nodes.find(n => n.id === e.to);
                return s && t && (
                    <motion.line key={`tree-${e.from}-${e.to}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                        stroke={THEME.treeEdge}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                );
                })}
            </AnimatePresence>

            {/* 虚线显示非树边 */}
            {edges.map((e, i) => {
                const s = nodes.find(n => n.id === e.from);
                const t = nodes.find(n => n.id === e.to);
                const isVisitedBoth = curState.visited.has(e.from) && curState.visited.has(e.to);
                const isTreeEdge = curState.treeEdges.some(te => (te.from===e.from && te.to===e.to) || (te.from===e.to && te.to===e.from));

                if (isVisitedBoth && !isTreeEdge) {
                    return <line key={`non-${i}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#30363d" strokeWidth="1" strokeDasharray="5,5" />;
                }
                return null;
            })}
          </svg>

          {renderNodes(true)}

          <div style={{
              position: 'absolute', bottom: 20, left: 20, right: 20,
              background: 'rgba(22, 27, 34, 0.9)', padding: 15, borderRadius: 8,
              border: `1px solid ${THEME.border}`, pointerEvents: 'none'
          }}>
              <div style={{color: THEME.accent, fontWeight: 'bold', marginBottom: 5}}>
                  {mode === 'BFS' ? 'BFS 生成树' : 'DFS 生成树'}
              </div>
              <div style={{fontSize: 13, color: THEME.text}}>
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
const tabStyle = (active) => ({
    padding: '6px 12px', borderRadius: 4, background: active ? THEME.accent : 'transparent', color: active?'white':THEME.text, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold', transition: '0.2s'
});
const selectStyle = {
  background: '#0d1117', color: 'white', border: `1px solid ${THEME.border}`, padding: '4px', borderRadius: 4
};
const groupStyle = {
  display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}`
};
const labelStyle = { position: 'absolute', top: 10, left: 10, color: '#8b949e', fontSize: 12, fontWeight: 'bold', pointerEvents: 'none', zIndex: 20, background:'rgba(13, 17, 23, 0.8)', padding:'2px 6px', borderRadius:4 };

export default GraphTreeDemo;