import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#58a6ff',      // 蓝色 (常规操作)
  active: '#d29922',      // 当前出队节点 (橙)
  visited: '#2ea043',     // 已访问/入队 (绿)
  neighbor: '#a371f7',    // 正在探测的邻居 (紫)
  finalPath: '#f1e05a',   // 最终最短路径 (金黄)
  queueBg: '#21262d',
  delete: '#da3633',
  highlight: '#3fb95040',
  tooltipBg: '#6e7681',
  infinity: '∞'
};

const NODE_R = 24;

// BFS 最短路径伪代码
const CODE_LINES = [
  { id: 1, text: "void BFS_ShortestPath(G, start, end) {", indent: 0 },
  { id: 2, text: "    Queue.push(start); dist[start] = 0;", indent: 2 },
  { id: 3, text: "    while (!Queue.empty()) {", indent: 2 },
  { id: 4, text: "        u = Queue.pop();", indent: 4 },
  { id: 5, text: "        if (u == end) break; // 找到目标", indent: 4 },
  { id: 6, text: "        for (v in neighbors(u)) {", indent: 4 },
  { id: 7, text: "            if (dist[v] == ∞) {", indent: 6 },
  { id: 8, text: "                dist[v] = dist[u] + 1;", indent: 8 },
  { id: 9, text: "                prev[v] = u; // 记录前驱", indent: 8 },
  { id: 10, text: "               Queue.push(v);", indent: 8 },
  { id: 11, text: "            }", indent: 6 },
  { id: 12, text: "        }", indent: 4 },
  { id: 13, text: "    }", indent: 2 },
  { id: 14, text: "    ReconstructPath(prev, end); // 回溯路径", indent: 2 },
  { id: 15, text: "}", indent: 0 },
];

const BFSShortestPath = () => {
  const containerRef = useRef(null);
  const logsContainerRef = useRef(null); // 修改点：绑定到容器，而非元素

  // ================== 数据状态 ==================
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 100, y: 150 },
    { id: 1, label: 'B', x: 250, y: 80 },
    { id: 2, label: 'C', x: 250, y: 220 },
    { id: 3, label: 'D', x: 400, y: 80 },
    { id: 4, label: 'E', x: 400, y: 220 },
    { id: 5, label: 'F', x: 550, y: 150 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 2, to: 4 },
    { from: 3, to: 5 }, { from: 4, to: 5 },
    { from: 1, to: 2 },
    { from: 3, to: 4 }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });
  const [startNodeId, setStartNodeId] = useState(0);
  const [endNodeId, setEndNodeId] = useState(5);

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // 获取邻接表
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

  // ================== BFS 最短路径算法核心 ==================
  const generateBFS = (start, end) => {
    const adj = getAdjacency();
    const newSteps = [];

    // 初始化数据结构
    const dist = {};
    const prev = {};
    const visited = new Set();
    const queue = [];
    const logHistory = [];

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
    });

    // 辅助：记录快照
    const pushStep = (u, v, line, msg, finalPath = []) => {
      const timestamp = new Date().toLocaleTimeString('en-US', {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit"});
      logHistory.push(`[${timestamp}] ${msg}`);

      newSteps.push({
        queue: [...queue],
        dist: {...dist},
        prev: {...prev},
        visited: new Set(visited),
        activeU: u,
        activeV: v,
        finalPath,
        line,
        logs: [...logHistory]
      });
    };

    // Step 0: Init
    dist[start] = 0;
    visited.add(start);
    queue.push(start);
    pushStep(null, null, 2, `初始化：起点 ${nodes[start].label} 入队，Distance设为 0。`);

    let found = false;

    while (queue.length > 0) {
        // Step: Pop
        const u = queue.shift();
        pushStep(u, null, 4, `出队：取出队头节点 ${nodes[u].label}，当前距离起点的步数 d=${dist[u]}。`);

        // Check Goal
        if (u === end) {
            pushStep(u, null, 5, `🎯 找到目标！节点 ${nodes[u].label} 就是终点，搜索停止。`);
            found = true;
            break;
        }

        const neighbors = adj[u] || [];
        for (let v of neighbors) {
            if (dist[v] === Infinity) {
                visited.add(v);
                dist[v] = dist[u] + 1;
                prev[v] = u;
                queue.push(v);
                pushStep(u, v, 8, `更新邻居 ${nodes[v].label}：首次发现，d=${dist[v]}，前驱=${nodes[u].label}，加入队列。`);
            } else {
                 // 已访问
            }
        }
    }

    // 回溯路径
    const path = [];
    if (found) {
        let curr = end;
        while (curr !== null) {
            path.unshift(curr);
            curr = prev[curr];
        }
        pushStep(null, null, 14, `🚀 路径回溯完成！最短路径: ${path.map(id=>nodes[id].label).join(" → ")}`, path);
    } else {
        pushStep(null, null, 15, `搜索结束：未找到从 ${nodes[start].label} 到 ${nodes[end].label} 的路径。`);
    }

    return newSteps;
  };

  // ================== 控制逻辑 ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };

  const startAlgo = () => {
      reset();
      if (!nodes.find(n=>n.id===startNodeId) || !nodes.find(n=>n.id===endNodeId)) return;
      const s = generateBFS(startNodeId, endNodeId);
      setSteps(s);
      setCurrentStep(0);
      setIsAutoPlaying(true);
  };

  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); else setIsAutoPlaying(false); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); setIsAutoPlaying(false); };

  // === 修复点：自动滚动逻辑优化 ===
  useEffect(() => {
    if (logsContainerRef.current) {
        // 直接设置容器的 scrollTop 到最大值，只影响容器内部，不影响页面
        logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [currentStep]); // 每当步骤变化时触发

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStep < steps.length - 1) interval = setInterval(nextStep, 1000);
    else setIsAutoPlaying(false);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  const defaultLogs = ["准备就绪。请设置起点和终点，点击「开始搜索」。"];
  const curState = steps[currentStep] || {
    queue: [], dist: {}, prev: {}, visited: new Set(), activeU: null, activeV: null, finalPath: [], line: -1, logs: defaultLogs
  };

  // ================== 编辑逻辑 ==================
  const updateNodePos = (id, info) => setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  const addNode = () => {
    reset();
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    const label = String.fromCharCode(65 + (newId % 26));
    setNodes([...nodes, {id: newId, label, x: 50+Math.random()*200, y:50+Math.random()*200}]);
  };
  const addEdge = () => {
    const { from, to } = edgeInput;
    const u = Number(from); const v = Number(to);
    if (u === v) return;
    const exists = edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (!exists) { reset(); setEdges([...edges, {from: u, to: v}]); }
  };
  const removeEdge = () => {
    const { from, to } = edgeInput; const u = Number(from); const v = Number(to);
    setEdges(edges.filter(e => !((e.from === u && e.to === v) || (e.from === v && e.to === u))));
    reset();
  };
  const handleEdgeDoubleClick = (idx) => {
      const newEdges = [...edges]; newEdges.splice(idx, 1);
      setEdges(newEdges); reset();
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>BFS 最短路径</h3>

        {/* 编辑区 */}
        <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 节点</button>
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

        <div style={{width:1, height:20, background: THEME.border, margin: '0 5px'}}></div>

        {/* 路径设置区 */}
        <div style={{display:'flex', gap:8, alignItems:'center', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4}}>
            <span style={{fontSize:12}}>从</span>
            <select value={startNodeId} onChange={e=>{reset(); setStartNodeId(Number(e.target.value))}} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{fontSize:12}}>到</span>
            <select value={endNodeId} onChange={e=>{reset(); setEndNodeId(Number(e.target.value))}} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
        </div>

        <div style={{flex:1}}></div>
        <button onClick={startAlgo} style={btnStyle(THEME.visited)}>开始搜索</button>
        <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={btnStyle(THEME.active)} style={{...btnStyle(THEME.active), width: 80}}>
            {isAutoPlaying ? "暂停" : "播放"}
        </button>
        <button onClick={reset} style={btnStyle(THEME.border)}>重置</button>
        <div style={{display:'flex', gap:2}}>
             <button onClick={prevStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep<=0}>◀</button>
             <button onClick={nextStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep >= steps.length-1}>▶</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧区域 (Column) === */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}` }}>

            {/* 上半部分：图可视化 */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#0d1117', overflow: 'hidden', minHeight: '300px' }}>
                <div style={labelStyle}>Unweighted Graph</div>
                <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    {edges.map((e, i) => {
                    const s = nodes.find(n => n.id === e.from);
                    const t = nodes.find(n => n.id === e.to);

                    const isPathEdge = curState.finalPath.length > 0 && (() => {
                        for(let k=0; k<curState.finalPath.length-1; k++) {
                            const u = curState.finalPath[k];
                            const v = curState.finalPath[k+1];
                            if ((u===e.from && v===e.to) || (u===e.to && v===e.from)) return true;
                        }
                        return false;
                    })();

                    const isTreeEdge = curState.prev[e.to] === e.from || curState.prev[e.from] === e.to;
                    const isChecking = (curState.activeU === e.from && curState.activeV === e.to) || (curState.activeU === e.to && curState.activeV === e.from);

                    let stroke = '#30363d';
                    let width = 1.5;

                    if (isPathEdge) { stroke = THEME.finalPath; width = 5; }
                    else if (isChecking) { stroke = THEME.neighbor; width = 4; }
                    else if (isTreeEdge && curState.visited.has(e.from) && curState.visited.has(e.to)) {
                        stroke = THEME.visited; width = 2;
                    }

                    return s && t && (
                        <g key={i} onDoubleClick={() => handleEdgeDoubleClick(i)} style={{cursor: 'pointer'}}>
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={width} />
                        </g>
                    );
                    })}
                </svg>

                {nodes.map(n => {
                    const isStart = n.id === startNodeId;
                    const isEnd = n.id === endNodeId;
                    const isVisited = curState.visited.has(n.id);
                    const isActive = n.id === curState.activeU;
                    const isNeighbor = n.id === curState.activeV;
                    const inFinalPath = curState.finalPath.includes(n.id);

                    let bg = THEME.bg;
                    let borderColor = '#fff';
                    let scale = 1;

                    if (inFinalPath) { bg = THEME.finalPath; borderColor = THEME.finalPath; scale = 1.2; }
                    else if (isActive) { bg = THEME.active; scale = 1.1; }
                    else if (isNeighbor) { bg = THEME.neighbor; }
                    else if (isVisited) { bg = THEME.visited; }
                    else { bg = '#1f6feb'; }

                    if (isStart) borderColor = THEME.visited;
                    if (isEnd) borderColor = THEME.delete;

                    const distVal = curState.dist[n.id];
                    const displayDist = distVal === Infinity ? '∞' : distVal;

                    return (
                    <motion.div key={n.id}
                        drag dragMomentum={false} dragConstraints={containerRef}
                        onDragEnd={(e, i) => updateNodePos(n.id, i)}
                        animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale }}
                        style={{
                        position: 'absolute', top: 0, left: 0,
                        width: NODE_R*2, height: NODE_R*2,
                        borderRadius: '50%', background: bg,
                        color: (inFinalPath) ? '#333' : 'white',
                        border: `3px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10
                        }}
                    >
                        {n.label}
                        {isVisited && (
                            <div style={{
                                position: 'absolute', top: -12, right: -12,
                                background: '#333', color: '#fff', fontSize: 10,
                                padding: '2px 5px', borderRadius: 6, border: `1px solid ${THEME.border}`
                            }}>
                                d={displayDist}
                            </div>
                        )}
                        {isStart && <div style={{position:'absolute', bottom:-20, fontSize:10, color: THEME.visited, fontWeight:'bold'}}>START</div>}
                        {isEnd && <div style={{position:'absolute', bottom:-20, fontSize:10, color: THEME.delete, fontWeight:'bold'}}>END</div>}
                    </motion.div>
                    );
                })}
            </div>

            {/* 下半部分：操作日志 (Log) - 修复点：绑定ref到div */}
            <div style={{ height: 180, padding: 10, background: '#161b22', borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight: 'bold'}}>Operation Log</div>
                <div
                    ref={logsContainerRef} // Ref 绑定在这里
                    style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                    {curState.logs.map((log, index) => (
                        <div key={index}
                            style={{
                                fontSize: 12,
                                color: index === curState.logs.length - 1 ? THEME.text : '#666',
                                borderLeft: index === curState.logs.length - 1 ? `2px solid ${THEME.accent}` : '2px solid transparent',
                                paddingLeft: 6,
                                lineHeight: 1.4
                            }}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* === 右侧区域 (Column) === */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', background: THEME.panel, borderLeft: `1px solid ${THEME.border}` }}>

          {/* 1. 代码区 (固定高度) */}
          <div style={{ height: '40%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${THEME.border}` }}>
             <div style={panelHeaderStyle}>BFS Algorithm</div>
             <div style={{ flex: 1, overflow: 'auto', background: THEME.codeBg, padding: 10 }}>
                {CODE_LINES.map(line => (
                <div key={line.id} style={{
                    padding: '1px 0', fontSize: 12, fontFamily:'Consolas',
                    background: curState.line === line.id ? 'rgba(56, 139, 253, 0.15)' : 'transparent',
                    color: curState.line === line.id ? '#fff' : THEME.textMuted,
                    borderLeft: curState.line === line.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                    paddingLeft: 10 + line.indent * 10
                }}>
                    {line.text}
                </div>
                ))}
             </div>
          </div>

          {/* 2. 队列与距离表 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>

             {/* 队列可视化 */}
             <div style={{padding: 10, borderBottom: `1px solid ${THEME.border}`}}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5}}>Queue (FIFO)</div>
                <div style={{display:'flex', gap:5, overflowX:'auto', height: 34, alignItems:'center'}}>
                    <AnimatePresence>
                        {curState.queue.length === 0 ? <span style={{fontSize:12, color:'#444'}}>Empty</span> :
                         curState.queue.map((id, idx) => (
                             <motion.div key={`${id}-${idx}`} layout initial={{opacity:0, scale:0}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0}}
                                style={{
                                    minWidth:24, height:24, borderRadius:'50%', background:THEME.panel, border:`1px solid ${THEME.border}`,
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:THEME.text
                                }}>
                                {nodes[id].label}
                             </motion.div>
                         ))
                        }
                    </AnimatePresence>
                </div>
             </div>

             {/* 距离表 */}
             <div style={{flex:1, display:'flex', flexDirection:'column', overflow: 'hidden'}}>
                 <div style={panelHeaderStyle}>Distance Table</div>
                 <div style={{flex:1, overflow:'auto', padding:10}}>
                     <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, color:THEME.text}}>
                         <thead>
                             <tr style={{borderBottom:`1px solid ${THEME.border}`, color:THEME.textMuted}}>
                                 <th style={{textAlign:'left', padding:4}}>Node</th>
                                 <th style={{textAlign:'center', padding:4}}>Dist</th>
                                 <th style={{textAlign:'center', padding:4}}>Prev</th>
                             </tr>
                         </thead>
                         <tbody>
                             {nodes.map(n => {
                                 const d = curState.dist[n.id];
                                 const p = curState.prev[n.id];
                                 const isHighlight = n.id === curState.activeU || n.id === curState.activeV;
                                 return (
                                     <tr key={n.id} style={{background: isHighlight ? 'rgba(255,255,255,0.05)' : 'transparent'}}>
                                         <td style={{padding:4, fontWeight:'bold'}}>{n.label}</td>
                                         <td style={{padding:4, textAlign:'center', color: d===Infinity?THEME.textMuted:THEME.accent}}>
                                             {d===Infinity ? '∞' : d}
                                         </td>
                                         <td style={{padding:4, textAlign:'center'}}>
                                             {p===null ? '-' : nodes[p]?.label}
                                         </td>
                                     </tr>
                                 )
                             })}
                         </tbody>
                     </table>
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================== 样式 ==================
const btnStyle = (bg) => ({
  padding: '5px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});
const iconBtnStyle = (bg) => ({
    padding: '5px 10px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});
const selectStyle = {
  background: '#0d1117', color: 'white', border: `1px solid ${THEME.border}`, padding: '4px', borderRadius: 4, fontSize: 12
};
const groupStyle = {
  display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}`
};
const labelStyle = {
  position: 'absolute', top: 10, left: 10, color: '#8b949e', fontSize: 12, fontWeight: 'bold', pointerEvents: 'none', zIndex: 20,
  background: 'rgba(13, 17, 23, 0.6)', padding: '2px 6px', borderRadius: 4
};
const panelHeaderStyle = {
    padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: 11, fontWeight: 'bold', color: '#8b949e'
};

export default BFSShortestPath;