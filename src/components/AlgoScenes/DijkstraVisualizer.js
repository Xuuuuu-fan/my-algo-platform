import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#58a6ff',      // 蓝色
  active: '#d29922',      // 当前处理节点 (橙)
  visited: '#2ea043',     // 已确定最短路 (绿)
  neighbor: '#a371f7',    // 正在检查的邻居 (紫)
  finalPath: '#f1e05a',   // 最终路径 (金黄)
  queueBg: '#21262d',
  delete: '#da3633',
  highlight: '#3fb95040',
  tooltipBg: '#6e7681',
  infinity: '∞'
};

const NODE_R = 24;

// Dijkstra 伪代码
const CODE_LINES = [
  { id: 1, text: "void Dijkstra(Graph G, int start) {", indent: 0 },
  { id: 2, text: "    dist[] = ∞; dist[start] = 0;", indent: 2 },
  { id: 3, text: "    PQ.push({start, 0});", indent: 2 },
  { id: 4, text: "    while (!PQ.empty()) {", indent: 2 },
  { id: 5, text: "        u = PQ.popMin(); // 取距离最小点", indent: 4 },
  { id: 6, text: "        if (u is visited) continue;", indent: 4 },
  { id: 7, text: "        visited[u] = true;", indent: 4 },
  { id: 8, text: "        for (v, weight) in neighbors(u) {", indent: 4 },
  { id: 9, text: "            if (!visited[v] && dist[v] > dist[u] + w) {", indent: 6 },
  { id: 10, text: "                dist[v] = dist[u] + w; // 松弛操作", indent: 8 },
  { id: 11, text: "                prev[v] = u;", indent: 8 },
  { id: 12, text: "                PQ.push({v, dist[v]});", indent: 8 },
  { id: 13, text: "            }", indent: 6 },
  { id: 14, text: "        }", indent: 4 },
  { id: 15, text: "    }", indent: 2 },
  { id: 16, text: "}", indent: 0 },
];

const DijkstraVisualizer = () => {
  const containerRef = useRef(null);
  const logsContainerRef = useRef(null);

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
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 2 },
    { from: 1, to: 2, weight: 1 },
    { from: 1, to: 3, weight: 5 },
    { from: 2, to: 3, weight: 8 },
    { from: 2, to: 4, weight: 10 },
    { from: 3, to: 4, weight: 2 },
    { from: 3, to: 5, weight: 6 },
    { from: 4, to: 5, weight: 3 }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1, weight: 1 });
  const [startNodeId, setStartNodeId] = useState(0);
  const [endNodeId, setEndNodeId] = useState(5);

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // 安全获取邻接表 (修复了崩溃隐患)
  const getAdjacency = () => {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      // 只有当两个端点都存在时才添加边
      if (adj[e.from] && adj[e.to]) {
        adj[e.from].push({ to: e.to, weight: e.weight });
        adj[e.to].push({ to: e.from, weight: e.weight });
      }
    });
    return adj;
  };

  // ================== Dijkstra 核心逻辑 ==================
  const generateDijkstra = (start, end) => {
    const adj = getAdjacency();
    const newSteps = [];

    const dist = {};
    const prev = {};
    const visited = new Set();
    const pq = []; // {id, d}
    const logHistory = [];

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
    });

    const pushStep = (u, v, line, msg, finalPath = []) => {
      const sortedPQ = [...pq].sort((a,b) => a.d - b.d);
      const timestamp = new Date().toLocaleTimeString('en-US', {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit"});
      logHistory.push(`[${timestamp}] ${msg}`);

      newSteps.push({
        pq: sortedPQ,
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
    pq.push({ id: start, d: 0 });
    pushStep(null, null, 2, `初始化：起点 ${nodes.find(n=>n.id===start)?.label} 距离设为 0，加入 PQ`);

    let found = false;

    while (pq.length > 0) {
        pq.sort((a,b) => a.d - b.d);
        const item = pq.shift();
        const u = item.id;

        if (item.d > dist[u]) continue;

        pushStep(u, null, 5, `出队：最小距离节点 ${nodes.find(n=>n.id===u)?.label} (d=${dist[u]})`);

        if (visited.has(u)) continue;
        visited.add(u);
        pushStep(u, null, 7, `标记 ${nodes.find(n=>n.id===u)?.label} 为已确定 (Visited)`);

        if (u === end) {
            pushStep(u, null, -1, `到达目标 ${nodes.find(n=>n.id===u)?.label}，最短距离 ${dist[u]}`);
            found = true;
            break;
        }

        const neighbors = adj[u] || [];
        for (let edge of neighbors) {
            const v = edge.to;
            const w = edge.weight;
            if (visited.has(v)) continue;

            // pushStep(u, v, 8, `检查邻居 ${nodes.find(n=>n.id===v)?.label} (边权 ${w})`);

            const newDist = dist[u] + w;
            if (newDist < dist[v]) {
                const oldDist = dist[v] === Infinity ? '∞' : dist[v];
                dist[v] = newDist;
                prev[v] = u;
                pq.push({ id: v, d: newDist });
                pushStep(u, v, 10, `松弛成功！${nodes.find(n=>n.id===v)?.label}: ${oldDist} ➔ ${newDist}`);
            }
        }
    }

    // Path Reconstruction
    const path = [];
    if (found) {
        let curr = end;
        while (curr !== null && curr !== undefined) {
            path.unshift(curr);
            curr = prev[curr];
        }
        if (path[0] === start) {
             pushStep(null, null, 16, `完成！最短路径: ${path.map(id=>nodes.find(n=>n.id===id)?.label).join("→")} (总长: ${dist[end]})`, path);
        } else {
             pushStep(null, null, 16, `不可达 (无法回溯到起点)`);
        }
    } else {
        pushStep(null, null, 16, `搜索结束，目标不可达`);
    }

    return newSteps;
  };

  // ================== 控制逻辑 (关键修复) ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };

  const startAlgo = () => {
      reset();

      // 1. 确定有效的起点和终点
      let validStart = startNodeId;
      let validEnd = endNodeId;

      const startExists = nodes.find(n => n.id === validStart);
      const endExists = nodes.find(n => n.id === validEnd);

      if (!startExists) {
          validStart = nodes[0]?.id; // 默认第一个
          if (validStart === undefined) return alert("请先添加节点");
          setStartNodeId(validStart); // 同步更新 UI
      }
      if (!endExists) {
          validEnd = nodes[nodes.length - 1]?.id;
          if (validEnd === undefined) return;
          setEndNodeId(validEnd);
      }

      // 2. 立即执行算法，不使用 setTimeout
      const s = generateDijkstra(validStart, validEnd);

      if (s.length === 0) return alert("生成步骤失败，请检查图结构");

      setSteps(s);
      setCurrentStep(0);
      setIsAutoPlaying(true);
  };

  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); else setIsAutoPlaying(false); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); setIsAutoPlaying(false); };

  // 自动滚动日志
  useEffect(() => {
    if (logsContainerRef.current) {
        logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [currentStep]);

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStep < steps.length - 1) interval = setInterval(nextStep, 1000);
    else setIsAutoPlaying(false);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  const defaultLogs = ["准备就绪。设置起点终点，点击「开始搜索」。"];
  const curState = steps[currentStep] || {
    pq: [], dist: {}, prev: {}, visited: new Set(), activeU: null, activeV: null, finalPath: [], line: -1, logs: defaultLogs
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
    const { from, to, weight } = edgeInput;
    const u = Number(from); const v = Number(to); const w = Number(weight);
    if (u === v) return;
    const otherEdges = edges.filter(e => !((e.from === u && e.to === v) || (e.from === v && e.to === u)));
    setEdges([...otherEdges, {from: u, to: v, weight: w}]);
    reset();
  };
  const removeEdge = () => {
    const { from, to } = edgeInput; const u = Number(from); const v = Number(to);
    setEdges(edges.filter(e => !((e.from === u && e.to === v) || (e.from === v && e.to === u))));
    reset();
  };
  const deleteEdgeByObj = (edge) => {
      setEdges(edges.filter(e => e !== edge));
      reset();
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>Dijkstra 最短路径</h3>

        {/* 编辑区 */}
        <Tooltip text="添加新节点">
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
            <span style={{color: THEME.textMuted, fontSize:12, marginLeft:5}}>w:</span>
            <input type="number" value={edgeInput.weight} onChange={e=>setEdgeInput({...edgeInput, weight:e.target.value})} style={{...selectStyle, width:40, textAlign:'center'}} />

            <Tooltip text="添加或更新带权边">
                <button onClick={addEdge} style={btnStyle(THEME.border)}>连线/更新</button>
            </Tooltip>
            <button onClick={removeEdge} style={btnStyle(THEME.delete)}>删除</button>
        </div>

        <div style={{width:1, height:20, background: THEME.border, margin: '0 5px'}}></div>

        {/* 路径设置 */}
        <div style={{display:'flex', gap:8, alignItems:'center', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4}}>
            <span style={{fontSize:12}}>Start</span>
            <select value={startNodeId} onChange={e=>{reset(); setStartNodeId(Number(e.target.value))}} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{fontSize:12}}>End</span>
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

        {/* === 左侧区域 === */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}` }}>

            {/* 上半部分：图可视化 */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#0d1117', overflow: 'hidden', minHeight: '300px' }}>
                <div style={labelStyle}>Weighted Graph</div>
                <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    {edges.map((e, i) => {
                    const s = nodes.find(n => n.id === e.from);
                    const t = nodes.find(n => n.id === e.to);
                    if (!s || !t) return null;

                    const isPathEdge = curState.finalPath.length > 0 && (() => {
                        for(let k=0; k<curState.finalPath.length-1; k++) {
                            const u = curState.finalPath[k];
                            const v = curState.finalPath[k+1];
                            if ((u===e.from && v===e.to) || (u===e.to && v===e.from)) return true;
                        }
                        return false;
                    })();

                    const isRelaxing = (curState.activeU === e.from && curState.activeV === e.to) || (curState.activeU === e.to && curState.activeV === e.from);

                    let stroke = '#30363d';
                    let width = 1.5;

                    if (isPathEdge) { stroke = THEME.finalPath; width = 5; }
                    else if (isRelaxing) { stroke = THEME.neighbor; width = 4; }

                    return s && t && (
                        <g key={i} onDoubleClick={() => deleteEdgeByObj(e)} style={{cursor: 'pointer'}}>
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={width} />
                            <rect x={(s.x+t.x)/2 - 12} y={(s.y+t.y)/2 - 9} width={24} height={18} rx={4} fill="#0d1117" stroke={stroke} strokeWidth={1} />
                            <text x={(s.x+t.x)/2} y={(s.y+t.y)/2 + 4} textAnchor="middle" fill={THEME.text} fontSize={11} fontWeight="bold">{e.weight}</text>
                        </g>
                    );
                    })}
                </svg>

                {nodes.map(n => {
                    const isStart = n.id === startNodeId;
                    const isEnd = n.id === endNodeId;
                    const isVisited = curState.visited.has(n.id);
                    const isActive = n.id === curState.activeU;
                    const inFinalPath = curState.finalPath.includes(n.id);

                    let bg = THEME.bg;
                    let borderColor = '#fff';
                    let scale = 1;

                    if (inFinalPath) { bg = THEME.finalPath; borderColor = THEME.finalPath; scale = 1.2; }
                    else if (isActive) { bg = THEME.active; scale = 1.1; }
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
                        <div style={{
                            position: 'absolute', top: -14, right: -14,
                            background: '#21262d', color: '#c9d1d9', fontSize: 10,
                            padding: '2px 5px', borderRadius: 4, border: `1px solid ${THEME.border}`,
                            fontWeight:'bold'
                        }}>
                            d={displayDist}
                        </div>

                        {isStart && <div style={{position:'absolute', bottom:-20, fontSize:10, color: THEME.visited, fontWeight:'bold'}}>START</div>}
                        {isEnd && <div style={{position:'absolute', bottom:-20, fontSize:10, color: THEME.delete, fontWeight:'bold'}}>END</div>}
                    </motion.div>
                    );
                })}
            </div>

            {/* 下半部分：操作日志 */}
            <div style={{ height: 180, padding: 10, background: '#161b22', borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight: 'bold'}}>Operation Log</div>
                <div ref={logsContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
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

        {/* === 右侧区域 === */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', background: THEME.panel, borderLeft: `1px solid ${THEME.border}` }}>

          {/* 代码区 */}
          <div style={{ height: '35%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${THEME.border}` }}>
             <div style={panelHeaderStyle}>Dijkstra Algorithm</div>
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

          {/* 优先队列 & 距离表 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>

             <div style={{padding: 10, borderBottom: `1px solid ${THEME.border}`}}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5}}>Priority Queue (Min-Heap)</div>
                <div style={{display:'flex', gap:5, overflowX:'auto', height: 40, alignItems:'center'}}>
                    <AnimatePresence>
                        {curState.pq.length === 0 ? <span style={{fontSize:12, color:'#444'}}>Empty</span> :
                         curState.pq.map((item, idx) => (
                             <motion.div key={`${item.id}-${item.d}-${idx}`} layout initial={{opacity:0, scale:0}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0}}
                                style={{
                                    minWidth:36, height:30, borderRadius:4, background:THEME.panel, border:`1px solid ${THEME.border}`,
                                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:10, color:THEME.text,
                                    borderLeft: idx===0 ? `3px solid ${THEME.active}` : ''
                                }}>
                                <span>{nodes.find(n=>n.id===item.id)?.label}</span>
                                <span style={{fontSize:9, color:THEME.textMuted}}>{item.d}</span>
                             </motion.div>
                         ))
                        }
                    </AnimatePresence>
                </div>
             </div>

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
                                             {p===null ? '-' : nodes.find(nd=>nd.id===p)?.label}
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

// ================== Tooltip & Style ==================
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
              fontSize: 12, whiteSpace: 'pre-line', zIndex: 100, textAlign: 'center', minWidth: 120, pointerEvents: 'none'
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

export default DijkstraVisualizer;